import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceController } from '../src/invoice/invoice.controller';
import { InvoiceService } from '../src/invoice/invoice.service';
import { CreateInvoiceDto } from '../src/invoice/dto/create-invoice.dto';

describe.skip('InvoiceController', () => {
  let controller: InvoiceController;
  let service: InvoiceService;

  const mockInvoiceService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: InvoiceService,
          useValue: mockInvoiceService,
        },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
    service = module.get<InvoiceService>(InvoiceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an invoice', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        reference: 'INV001',
        customer: 'John Doe',
        amount: 500,
        date: new Date().toISOString(),
        items: [{ sku: 'ITEM001', qt: 10 }],
      };

      const result = {
        ...createInvoiceDto,
        id: 'some-id',
      };

      mockInvoiceService.create.mockResolvedValue(result);

      expect(await controller.create(createInvoiceDto)).toEqual(result);
      expect(service.create).toHaveBeenCalledWith(createInvoiceDto);
    });
  });

  describe('findOne', () => {
    it('should return a single invoice', async () => {
      const result = {
        id: 'some-id',
        reference: 'INV001',
        customer: 'John Doe',
        amount: 500,
        date: new Date().toISOString(),
        items: [],
      };

      mockInvoiceService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('some-id')).toEqual(result);
      expect(service.findOne).toHaveBeenCalledWith('some-id');
    });
  });

  describe('findAll', () => {
    it('should return an array of invoices', async () => {
      const result = [
        {
          id: 'some-id',
          reference: 'INV001',
          customer: 'John Doe',
          amount: 500,
          date: new Date().toISOString(),
          items: [],
        },
      ];

      mockInvoiceService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toEqual(result);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
