import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMqConsumerService } from '../src/rabbitmq/consumer/rmq-consumer.service';
import { EmailService } from '../src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { RabbitMqBaseService } from '../src/rabbitmq/rmq-base.service';
import { ConsumeMessage } from 'amqplib';

// Define mocks
const mockEmailService = {
  sendEmail: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'QUEUE_NAME') return 'mockQueueName';
    if (key === 'RABBITMQ_URL')
      return 'amqp://mockUser:mockPass@localhost:5672/mockVhost';
    return null;
  }),
};

const mockChannel = {
  consume: jest.fn(),
  assertQueue: jest.fn(),
  createChannel: jest.fn().mockResolvedValue(this),
};

const mockConnection = {
  createChannel: jest.fn().mockResolvedValue(mockChannel),
};

// Mock 'amqplib' module using a factory function
jest.mock('amqplib', () => ({
  connect: () => Promise.resolve(mockConnection),
}));

describe('RabbitMqConsumerService', () => {
  let service: RabbitMqConsumerService;
  let emailService: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMqConsumerService,
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RabbitMqBaseService, useValue: {} },
      ],
    }).compile();

    service = module.get<RabbitMqConsumerService>(RabbitMqConsumerService);
    emailService = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call super.onModuleInit and set up channel.consume', async () => {
      await service.onModuleInit();

      expect(mockChannel.consume).toHaveBeenCalledWith(
        'mockQueueName',
        expect.any(Function),
        { noAck: true },
      );
    });
  });

  describe('handleMessage', () => {
    it('should process a valid message and call sendEmail', async () => {
      const date = new Date();
      const mockMessage: ConsumeMessage = {
        content: Buffer.from(
          JSON.stringify({
            date: date.toISOString(),
            totalSales: 1000,
            totalQuantityPerSKU: {},
          }),
        ),
        fields: {} as any,
        properties: {} as any,
      } as any;

      await service.handleMessage(mockMessage);

      expect(emailService.sendEmail).toHaveBeenCalledWith({
        date: date.toISOString(),
        totalSales: 1000,
        totalQuantityPerSKU: {},
      });
    });

    it('should handle a null message gracefully', async () => {
      await expect(service.handleMessage(null)).resolves.not.toThrow();
    });
  });
});
