import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Item } from './item.schema';

@Schema({
  toJSON: {
    virtuals: true,
    versionKey: false, // Exclude __v field
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
    },
  },
})
export class Invoice extends Document {
  @Prop({ type: String, required: true, unique: true })
  reference: string;

  @Prop({ type: String, required: true })
  customer: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Item' }],
    default: [],
  })
  items: Item[];
}

export type InvoiceDocument = Invoice & Document;
export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
