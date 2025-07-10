import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  PATIENT = 'patient',
  NURSE = 'nurse',
  ADMIN = 'admin',
}

export enum UserStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name?: string;

  @Prop({ required: true, unique: true })
  email?: string;

  @Prop({ required: true })
  password?: string;

  @Prop({ required: true })
  phone?: string;

  @Prop({ required: true, enum: UserRole })
  role?: UserRole;

  @Prop({ default: UserStatus.PENDING, enum: UserStatus })
  status?: UserStatus;

  @Prop({ default: false })
  isEmailVerified?: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop({ type: Date })
  emailVerificationExpires?: Date;

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
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };

  @Prop()
  address?: string;

  @Prop()
  profileImage?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create geospatial index for location-based queries
UserSchema.index({ location: '2dsphere' });
