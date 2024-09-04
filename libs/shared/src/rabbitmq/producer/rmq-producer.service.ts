import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMqBaseService } from '../rmq-base.service';

@Injectable()
export class RabbitMqProducerService extends RabbitMqBaseService {
  constructor(configService: ConfigService) {
    super(configService);
    console.log('$$$ RMQ-RabbitMqProducerService: inside constructor');
  }
  async sendNotification(message: string) {
    if (!this.channel) {
      throw new Error('RabbitMQ connection not established');
    }

    this.channel.sendToQueue(this.queueName, Buffer.from(message));
    console.log(`$$$ RMQ-Producer: Notification sent: ${message}`);
  }
}
