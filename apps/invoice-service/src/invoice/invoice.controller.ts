import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('api')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('invoice')
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get('invoice/:id')
  async findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Get('invoice')
  async findAll(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.invoiceService.findAll(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }
}
