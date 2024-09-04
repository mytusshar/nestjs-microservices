import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMqProducerService } from './rmq-producer.service';

@Module({
  imports: [
    ConfigModule.forRoot(), // Load environment variables
  ],
  providers: [RabbitMqProducerService],
  exports: [RabbitMqProducerService],
})
export class RabbitMqProducerModule {}
