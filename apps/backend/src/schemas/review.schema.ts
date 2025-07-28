import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ReviewDocument = Review & Document;

export enum ReviewType {
  USER_TO_USER = 'user_to_user',    // Nurse reviewing patient or vice versa
  SERVICE_REVIEW = 'service_review'  // Review of the service itself
}

export enum ReviewerRole {
  PATIENT = 'patient',
  NURSE = 'nurse'
}

@Schema({ timestamps: true })
export class Review {
  @ApiProperty({
    description: 'ID of the completed request this review is for',
    example: '507f1f77bcf86cd799439013'
  })
  @Prop({ type: Types.ObjectId, ref: 'PatientRequest', required: true })
  requestId: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the user who wrote the review',
    example: '507f1f77bcf86cd799439011'
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reviewerId: Types.ObjectId;

  @ApiProperty({
    description: 'Role of the reviewer (patient or nurse)',
    example: 'patient',
    enum: ReviewerRole
  })
  @Prop({ type: String, enum: ReviewerRole, required: true })
  reviewerRole: ReviewerRole;

  @ApiProperty({
    description: 'ID of the user being reviewed (only for user-to-user reviews)',
    example: '507f1f77bcf86cd799439012',
    required: false
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  revieweeId?: Types.ObjectId;

  @ApiProperty({
    description: 'Type of review (user-to-user or service review)',
    example: 'user_to_user',
    enum: ReviewType
  })
  @Prop({ type: String, enum: ReviewType, required: true })
  reviewType: ReviewType;

  @ApiProperty({
    description: 'Rating given (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @ApiProperty({
    description: 'Optional written feedback',
    example: 'Excellent service! Very professional and caring.',
    required: false
  })
  @Prop({ type: String, maxlength: 1000 })
  feedback?: string;

  @ApiProperty({
    description: 'Whether the review is active',
    example: true
  })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'When the review was submitted',
    example: '2024-01-15T10:30:00Z'
  })
  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;

  @ApiProperty({
    description: 'Review creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Review last update timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Create compound indexes to enforce uniqueness and prevent duplicate reviews
ReviewSchema.index(
  { requestId: 1, reviewerId: 1, revieweeId: 1, reviewType: 1 },
  { unique: true, sparse: true }
);

// Index for service reviews (when revieweeId is null)
ReviewSchema.index(
  { requestId: 1, reviewerId: 1, reviewType: 1 },
  {
    unique: true,
    partialFilterExpression: { reviewType: ReviewType.SERVICE_REVIEW }
  }
);

// Additional indexes for performance
ReviewSchema.index({ requestId: 1 });
ReviewSchema.index({ reviewerId: 1 });
ReviewSchema.index({ revieweeId: 1 });
ReviewSchema.index({ reviewType: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ submittedAt: -1 });

// Virtual for populated fields
ReviewSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewerId',
  foreignField: '_id',
  justOne: true
});

ReviewSchema.virtual('reviewee', {
  ref: 'User',
  localField: 'revieweeId',
  foreignField: '_id',
  justOne: true
});

ReviewSchema.virtual('request', {
  ref: 'PatientRequest',
  localField: 'requestId',
  foreignField: '_id',
  justOne: true
});

ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });
