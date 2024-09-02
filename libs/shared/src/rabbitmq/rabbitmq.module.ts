// rabbitmq.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMqService2 } from './rabbitmq.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // Load environment variables
    EmailModule, // Import the EmailModule
  ],
  providers: [RabbitMqService2],
  exports: [RabbitMqService2],
})
export class RabbitMqModule2 {}
