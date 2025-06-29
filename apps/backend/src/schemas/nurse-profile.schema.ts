import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NurseProfileDocument = NurseProfile & Document;

export enum SpecializationType {
  GENERAL = 'general',
  PEDIATRIC = 'pediatric',
  GERIATRIC = 'geriatric',
  ICU = 'icu',
  EMERGENCY = 'emergency',
  SURGICAL = 'surgical',
  PSYCHIATRIC = 'psychiatric',
  ONCOLOGY = 'oncology',
}

@Schema({ timestamps: true })
export class NurseProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId?: Types.ObjectId;

  @Prop({ required: true })
  licenseNumber?: string;

  @Prop({ required: true })
  yearsOfExperience?: number;

  @Prop({ type: [String], enum: SpecializationType })
  specializations?: SpecializationType[];

  @Prop()
  education?: string;

  @Prop()
  certifications?: string[];

  @Prop({ type: [String] })
  documents?: string[]; // URLs to uploaded documents

  @Prop({ min: 0, max: 5, default: 0 })
  rating?: number;

  @Prop({ default: 0 })
  totalReviews?: number;

  @Prop({ default: 0 })
  completedJobs?: number;

  @Prop({ default: true })
  isAvailable?: boolean;

  @Prop()
  hourlyRate?: number;

  @Prop()
  bio?: string;

  @Prop()
  languages?: string[];

  @Prop({ default: Date.now })
  verifiedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy?: Types.ObjectId;
}

export const NurseProfileSchema = SchemaFactory.createForClass(NurseProfile);
