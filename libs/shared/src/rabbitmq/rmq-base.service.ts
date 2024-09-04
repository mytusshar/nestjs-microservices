import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { connect, Channel, Connection } from 'amqplib';
import { ConfigService } from '@nestjs/config';

export abstract class RabbitMqBaseService
  implements OnModuleInit, OnModuleDestroy
{
  protected channel: Channel;
  protected connection: Connection;
  protected queueName: string;

  constructor(protected readonly configService: ConfigService) {}

  async onModuleInit() {
    this.queueName = this.configService.get<string>('QUEUE_NAME');
    const rabbitMQUrl = this.configService.get<string>('RABBITMQ_URL');
    this.connection = await connect(rabbitMQUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.queueName);

    console.log(
      `$$$ RMQ-Base: RabbitMqBaseService initialized with queue: ${this.queueName}`,
    );
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    console.log('$$$ RMQ-Base: RabbitMqBaseService connection closed.');
  }
}
