import { Injectable } from '@nestjs/common';
import { RabbitMqBaseService } from '../rmq-base.service';
import { ConsumeMessage } from 'amqplib';
import { EmailService } from '../../email/email.service';
import { SalesReport } from '../../interfaces/report.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitMqConsumerService extends RabbitMqBaseService {
  constructor(
    configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    super(configService);
    console.log('$$$ RMQ-RabbitMqConsumerService: inside constructor');
  }

  async onModuleInit() {
    await super.onModuleInit(); // Call the base class method
    this.channel.consume(this.queueName, this.handleMessage.bind(this), {
      noAck: true,
    });
    console.log(
      '$$$ RMQ-Consumer: RabbitMqConsumerService is listening for messages...',
    );
  }

  async handleMessage(msg: ConsumeMessage | null) {
    if (msg) {
      const messageContent = msg.content.toString();
      console.log(`$$$ RMQ-Consumer: Received message: ${messageContent}`);

      const report: SalesReport = JSON.parse(messageContent);
      await this.emailService.sendEmail(report);
    }
  }
}
