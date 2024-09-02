import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InvoiceService } from '../src/invoice/invoice.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { CreateInvoiceDto } from '../src/invoice/dto/create-invoice.dto';
import { RabbitMqService2 } from '../../../libs/shared/src/index';

// Mock for RabbitMqService2
const mockRabbitMqService2 = {
  sendNotification: jest.fn(),
};

// Mock for ItemModel
const mockItemModel = {
  insertMany: jest.fn().mockResolvedValue([{ _id: 'item-id' }]), // Mocked return value with _id
};

// Mock for InvoiceModel
const mockInvoiceData = {
  _id: 'invoice-id',
  amount: 100,
  reference: 'INV-001',
  items: [{ sku: 'item-sku', qt: 1 }], // Adjusted item structure
  toJSON: jest.fn().mockReturnValue({
    _id: 'invoice-id',
    amount: 100,
    reference: 'INV-001',
    items: [{ sku: 'item-sku', qt: 1 }],
  }),
};

const mockInvoiceModel = {
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  populate: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  findOne: jest.fn(),
};

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getModelToken('Invoice'),
          useValue: mockInvoiceModel,
        },
        {
          provide: getModelToken('Item'),
          useValue: mockItemModel,
        },
        {
          provide: RabbitMqService2,
          useValue: mockRabbitMqService2,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an invoice', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        customer: 'customer-id',
        amount: 100,
        reference: 'INV-001',
        items: [{ sku: 'item-sku', qt: 1 }], // Adjusted item structure
        date: new Date().toISOString(),
      };

      mockInvoiceModel.create.mockResolvedValue(createInvoiceDto);

      const result = await service.create(createInvoiceDto);

      expect(mockInvoiceModel.create).toHaveBeenCalledWith(createInvoiceDto);
      expect(result).toEqual(createInvoiceDto);
    });

    it('should throw ConflictException for duplicate invoice reference', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        customer: 'customer-id',
        amount: 100,
        reference: 'INV-001',
        items: [{ sku: 'item-sku', qt: 1 }], // Adjusted item structure
        date: new Date().toISOString(),
      };

      mockInvoiceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockInvoiceData), // Simulate invoice exists
      });

      await expect(service.create(createInvoiceDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single invoice', async () => {
      mockInvoiceModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockInvoiceData),
      });

      const result = await service.findOne('invoice-id');

      expect(mockInvoiceModel.findById).toHaveBeenCalledWith('invoice-id');
      expect(result).toEqual(mockInvoiceData);
    });

    it('should throw BadRequestException if invoice not found', async () => {
      mockInvoiceModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('invoice-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of invoices', async () => {
      const expectedInvoices = [mockInvoiceData];

      mockInvoiceModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(expectedInvoices),
      });

      const result = await service.findAll();

      expect(mockInvoiceModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedInvoices);
    });
  });

  describe('handleDailySalesSummary', () => {
    it('should calculate and send daily sales summary', async () => {
      const invoices = [
        { _id: 'invoice-id', amount: 50, items: [{ sku: 'SKU-1', qt: 1 }] },
      ];

      // Set to the same date for consistent test results
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      mockInvoiceModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(invoices),
      });

      await service.handleDailySalesSummary();

      expect(mockInvoiceModel.find).toHaveBeenCalledWith({
        date: { $gte: startOfDay, $lte: endOfDay },
      });
      expect(mockRabbitMqService2.sendNotification).toHaveBeenCalled();
    });
  });
});
