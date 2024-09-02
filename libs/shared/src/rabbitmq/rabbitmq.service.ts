import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { connect, Channel, Connection, ConsumeMessage } from 'amqplib';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { SalesReport } from '../interfaces/report.interface';

@Injectable()
export class RabbitMqService2 implements OnModuleInit, OnModuleDestroy {
  private channel: Channel;
  private connection: Connection;
  private queueName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService, // Inject EmailService
  ) {}

  async onModuleInit() {
    this.queueName = this.configService.get<string>('QUEUE_NAME');
    const rabbitMQUrl = this.configService.get<string>('RABBITMQ_URL');
    this.connection = await connect(rabbitMQUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.queueName);
    this.channel.consume(this.queueName, this.handleMessage.bind(this), {
      noAck: true,
    });

    console.log('$$$ RMQ-2: RabbitMqService2 is listening for messages...');
  }

  async sendNotification(message: string) {
    if (!this.channel) {
      throw new Error('RabbitMQ connection not established');
    }

    this.channel.sendToQueue(this.queueName, Buffer.from(message));
    console.log(`$$$ RMQ-2: Notification sent: ${message}`);
  }

  async handleMessage(msg: ConsumeMessage | null) {
    if (msg) {
      const messageContent = msg.content.toString();
      console.log(`$$$ RMQ-2: Received message: ${messageContent}`);

      const report: SalesReport = JSON.parse(messageContent);
      await this.emailService.sendEmail(report); // Use EmailService to send the email
    }
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}
