import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { Item, ItemDocument } from './schemas/item.schema';
import { RabbitMqService2 } from '../../../../libs/shared/src/index';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    private readonly rabbitService: RabbitMqService2,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    const errors = await validate(createInvoiceDto);
    if (errors.length > 0) throw new BadRequestException(errors);

    // Check if invoice reference already exists
    const invoiceExists = await this.invoiceModel.findOne({
      reference: createInvoiceDto.reference,
    });
    if (invoiceExists) {
      throw new ConflictException('Invoice reference number already exists');
    }

    // Check for duplicate SKUs within the same invoice
    const skuSet = new Set();
    for (const item of createInvoiceDto.items || []) {
      if (skuSet.has(item.sku)) {
        throw new BadRequestException(
          `Duplicate SKU found within the invoice: ${item.sku}`,
        );
      }
      skuSet.add(item.sku);
    }

    // Save items and get their IDs
    let itemIds: string[] = [];
    if (createInvoiceDto.items) {
      const items = await this.itemModel.insertMany(createInvoiceDto.items);
      itemIds = items.map((item) => item._id.toString());
    }

    // Create the invoice
    const invoice = new this.invoiceModel({
      customer: createInvoiceDto.customer,
      amount: createInvoiceDto.amount,
      reference: createInvoiceDto.reference,
      date: new Date(createInvoiceDto.date),
      items: itemIds,
    });

    // Save invoice
    const savedInvoice = await invoice.save();
    return savedInvoice.toJSON(); // Apply schema transformation
  }

  async findOne(id: string) {
    const invoice = await this.invoiceModel
      .findById(id)
      .populate('items')
      .exec();
    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }
    return invoice.toJSON(); // Apply schema transformation
  }

  async findAll(dateFrom?: Date, dateTo?: Date) {
    const filter: any = {};

    if (dateFrom && dateTo) {
      filter.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    }

    const invoices = await this.invoiceModel
      .find(filter)
      .populate('items')
      .exec();
    return invoices.map((invoice) => invoice.toJSON()); // Apply schema transformation
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleDailySalesSummary() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const invoices = await this.invoiceModel
      .find({
        date: { $gte: startOfDay, $lte: endOfDay },
      })
      .populate('items')
      .exec();

    const totalSales = invoices.reduce(
      (sum, invoice) => sum + invoice.amount,
      0,
    );
    const totalQuantityPerSKU = invoices
      .flatMap((invoice) => invoice.items)
      .reduce((acc, item) => {
        if (!acc[item.sku]) {
          acc[item.sku] = 0;
        }
        acc[item.sku] += item.qt;
        return acc;
      }, {} as Record<string, number>);

    const report = { date: new Date(), totalSales, totalQuantityPerSKU };
    console.log('Daily Sales Summary:', report);

    await this.rabbitService.sendNotification(JSON.stringify(report));
  }
}
