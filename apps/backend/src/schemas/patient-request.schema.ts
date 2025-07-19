import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientRequestDocument = PatientRequest & Document;

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ServiceType {
  HOME_CARE = 'home_care',
  MEDICATION_ADMINISTRATION = 'medication_administration',
  WOUND_CARE = 'wound_care',
  VITAL_SIGNS_MONITORING = 'vital_signs_monitoring',
  POST_SURGICAL_CARE = 'post_surgical_care',
  ELDERLY_CARE = 'elderly_care',
  PEDIATRIC_CARE = 'pediatric_care',
  CHRONIC_DISEASE_MANAGEMENT = 'chronic_disease_management',
}

@Schema({ timestamps: true })
export class PatientRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false }) // Temporarily remove required to debug
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  nurseId?: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: ServiceType })
  serviceType!: ServiceType;

  @Prop({ default: RequestStatus.PENDING, enum: RequestStatus })
  status!: RequestStatus;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location!: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true })
  scheduledDate!: Date;

  @Prop()
  estimatedDuration!: number; // in hours

  @Prop()
  urgencyLevel!: string; // low, medium, high, critical

  @Prop()
  specialRequirements!: string;

  @Prop()
  budget?: number;

  @Prop()
  contactPhone?: string;

  @Prop()
  notes?: string;

  @Prop()
  acceptedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  // Timestamps (automatically added by Mongoose)
  createdAt?: Date;
  updatedAt?: Date;
}

export const PatientRequestSchema = SchemaFactory.createForClass(PatientRequest);

// Create geospatial index for location-based queries
PatientRequestSchema.index({ location: '2dsphere' });
