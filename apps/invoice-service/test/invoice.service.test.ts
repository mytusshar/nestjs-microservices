import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InvoiceService } from '../src/invoice/invoice.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { CreateInvoiceDto } from '../src/invoice/dto/create-invoice.dto';
import { RabbitMqProducerService } from 'shared/src';

// Mock for RabbitMqProducerService
const mockRabbitMqProducerService = {
  sendNotification: jest.fn(),
};

// Mock for ItemModel
const mockItemModel = {
  insertMany: jest.fn().mockResolvedValue([{ _id: 'item-id' }]), // Mocked return value with _id
};

// Mock for InvoiceModel
const mockInvoiceData = {
  _id: '66d8642d648b565a3afa6974',
  amount: 100,
  reference: 'INV-001',
  items: [{ sku: 'item-sku', qt: 1 }], // Adjusted item structure
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
          provide: RabbitMqProducerService,
          useValue: mockRabbitMqProducerService,
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
      const date = new Date();
      const createInvoiceDto: CreateInvoiceDto = {
        customer: 'customer-id',
        amount: 100,
        reference: 'INV-001',
        items: [{ sku: 'item-sku', qt: 1 }], // Adjusted item structure
        date: date.toISOString(),
      };
      const expectedResult: any = Object.assign({}, createInvoiceDto);
      expectedResult.items = ['item-id'];
      expectedResult.date = date;

      mockInvoiceModel.create.mockResolvedValue(expectedResult);

      const result = await service.create(createInvoiceDto);

      expect(mockInvoiceModel.create).toHaveBeenCalledWith(expectedResult);
      expect(result).toEqual(expectedResult);
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

      const result = await service.findOne('66d8642d648b565a3afa6974');

      expect(mockInvoiceModel.findById).toHaveBeenCalledWith(
        '66d8642d648b565a3afa6974',
      );
      expect(result).toEqual(mockInvoiceData);
    });

    it('should throw BadRequestException if invoice not found', async () => {
      mockInvoiceModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('66d8642d648b565a3afa6975')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if invalid invoice id provided', async () => {
      mockInvoiceModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('66d8642d648b565a3afa6')).rejects.toThrow(
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
      expect(mockRabbitMqProducerService.sendNotification).toHaveBeenCalled();
    });
  });
});
