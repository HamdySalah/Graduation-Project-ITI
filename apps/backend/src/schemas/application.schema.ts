import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export type ApplicationDocument = Application & Document;

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PatientRequest', required: true })
  requestId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  nurseId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  estimatedTime: number;

  @Prop({
    type: String,
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.PENDING
  })
  status: ApplicationStatus;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

// Add indexes
ApplicationSchema.index({ requestId: 1 });
ApplicationSchema.index({ nurseId: 1 });
ApplicationSchema.index({ status: 1 });
