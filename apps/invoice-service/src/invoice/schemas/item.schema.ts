import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: false })
export class Item extends Document {
  @Prop({ type: String, required: true })
  sku: string;

  @Prop({ type: Number, required: true })
  qt: number;
}

export type ItemDocument = Item & Document;
export const ItemSchema = SchemaFactory.createForClass(Item);
