import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @ApiProperty({
    description: 'ID of the patient who wrote the review',
    example: '507f1f77bcf86cd799439011'
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId?: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the nurse being reviewed',
    example: '507f1f77bcf86cd799439012'
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  nurseId?: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the completed request this review is for',
    example: '507f1f77bcf86cd799439013'
  })
  @Prop({ type: Types.ObjectId, ref: 'PatientRequest', required: true })
  requestId?: Types.ObjectId;

  @ApiProperty({
    description: 'Rating given to the nurse (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating?: number;

  @ApiProperty({
    description: 'Written review comment',
    example: 'Excellent service! Very professional and caring nurse.'
  })
  @Prop({ type: String, required: true, maxlength: 1000 })
  comment?: string;

  @ApiProperty({
    description: 'Specific aspects rated by the patient',
    example: {
      professionalism: 5,
      punctuality: 4,
      communication: 5,
      skillLevel: 5
    }
  })
  @Prop({
    type: {
      professionalism: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      skillLevel: { type: Number, min: 1, max: 5 }
    }
  })
  aspectRatings?: {
    professionalism: number;
    punctuality: number;
    communication: number;
    skillLevel: number;
  };

  @ApiProperty({
    description: 'Whether the patient would recommend this nurse',
    example: true
  })
  @Prop({ type: Boolean, default: true })
  wouldRecommend?: boolean;

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

// Indexes for better query performance
ReviewSchema.index({ nurseId: 1, createdAt: -1 });
ReviewSchema.index({ patientId: 1, createdAt: -1 });
ReviewSchema.index({ requestId: 1 }, { unique: true }); // One review per request
ReviewSchema.index({ rating: 1 });

// Virtual for populated fields
ReviewSchema.virtual('patient', {
  ref: 'User',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

ReviewSchema.virtual('nurse', {
  ref: 'User',
  localField: 'nurseId',
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
