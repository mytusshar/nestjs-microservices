import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../../email/email.module';
import { RabbitMqConsumerService } from './rmq-consumer.service';

@Module({
  imports: [ConfigModule.forRoot(), EmailModule],
  providers: [RabbitMqConsumerService],
  exports: [RabbitMqConsumerService],
})
export class RabbitMqConsumerModule {}
