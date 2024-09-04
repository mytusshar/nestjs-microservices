import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMqProducerService } from '../src/rabbitmq/producer/rmq-producer.service';
import { ConfigService } from '@nestjs/config';
import { RabbitMqBaseService } from '../src/rabbitmq/rmq-base.service';

// Mock dependencies
const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'QUEUE_NAME') return 'mockQueueName';
    return null;
  }),
};

const mockChannel = {
  sendToQueue: jest.fn(),
};

// Mock RabbitMqBaseService to ensure it provides the correct channel
class MockRabbitMqBaseService {
  channel = mockChannel;
  queueName = 'mockQueueName';
}

describe('RabbitMqProducerService', () => {
  let service: RabbitMqProducerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMqProducerService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RabbitMqBaseService, useClass: MockRabbitMqBaseService },
      ],
    }).compile();

    service = module.get<RabbitMqProducerService>(RabbitMqProducerService);

    // Manually set the channel on the service instance to ensure it's initialized
    (service as any).channel = mockChannel;
    (service as any).queueName = 'mockQueueName';
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should send a message to the correct queue', async () => {
      const message = 'Test Message';

      await service.sendNotification(message);

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'mockQueueName',
        Buffer.from(message),
      );
    });

    it('should throw an error if the RabbitMQ connection is not established', async () => {
      // Mock the channel to be undefined
      (service as any).channel = null;

      await expect(service.sendNotification('Test Message')).rejects.toThrow(
        'RabbitMQ connection not established',
      );
    });
  });
});
