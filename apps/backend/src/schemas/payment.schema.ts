import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  WALLET = 'wallet'
}

export enum PaymentType {
  SERVICE_PAYMENT = 'service_payment',
  PLATFORM_FEE = 'platform_fee',
  REFUND = 'refund',
  BONUS = 'bonus',
  WITHDRAWAL = 'withdrawal'
}

@Schema({ timestamps: true })
export class Payment {
  @ApiProperty({
    description: 'ID of the patient making the payment',
    example: '507f1f77bcf86cd799439011'
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the nurse receiving the payment',
    example: '507f1f77bcf86cd799439012'
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  nurseId: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the related service request',
    example: '507f1f77bcf86cd799439013'
  })
  @Prop({ type: Types.ObjectId, ref: 'PatientRequest', required: true })
  requestId: Types.ObjectId;

  @ApiProperty({
    description: 'Payment amount in the smallest currency unit (e.g., cents)',
    example: 15000
  })
  @Prop({ type: Number, required: true })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'EGP'
  })
  @Prop({ type: String, required: true, default: 'EGP' })
  currency: string;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED
  })
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD
  })
  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Type of payment',
    enum: PaymentType,
    example: PaymentType.SERVICE_PAYMENT
  })
  @Prop({ type: String, enum: PaymentType, default: PaymentType.SERVICE_PAYMENT })
  paymentType: PaymentType;

  @ApiProperty({
    description: 'External payment provider transaction ID',
    example: 'pi_1234567890abcdef'
  })
  @Prop({ type: String })
  externalTransactionId?: string;

  @ApiProperty({
    description: 'Payment provider name',
    example: 'stripe'
  })
  @Prop({ type: String })
  paymentProvider?: string;

  @ApiProperty({
    description: 'Platform fee amount',
    example: 1500
  })
  @Prop({ type: Number, default: 0 })
  platformFee: number;

  @ApiProperty({
    description: 'Net amount received by nurse (amount - platformFee)',
    example: 13500
  })
  @Prop({ type: Number })
  netAmount: number;

  @ApiProperty({
    description: 'Payment description',
    example: 'Payment for wound care service'
  })
  @Prop({ type: String, maxlength: 500 })
  description?: string;

  @ApiProperty({
    description: 'Payment metadata',
    example: { sessionId: 'cs_123', customerId: 'cus_456' }
  })
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'When the payment was processed',
    example: '2024-01-15T10:30:00Z'
  })
  @Prop({ type: Date })
  processedAt?: Date;

  @ApiProperty({
    description: 'When the payment failed (if applicable)',
    example: '2024-01-15T10:35:00Z'
  })
  @Prop({ type: Date })
  failedAt?: Date;

  @ApiProperty({
    description: 'Failure reason (if applicable)',
    example: 'Insufficient funds'
  })
  @Prop({ type: String })
  failureReason?: string;

  @ApiProperty({
    description: 'When the payment was refunded (if applicable)',
    example: '2024-01-16T10:30:00Z'
  })
  @Prop({ type: Date })
  refundedAt?: Date;

  @ApiProperty({
    description: 'Refund amount',
    example: 15000
  })
  @Prop({ type: Number })
  refundAmount?: number;

  @ApiProperty({
    description: 'Refund reason',
    example: 'Service cancelled by patient'
  })
  @Prop({ type: String })
  refundReason?: string;

  @ApiProperty({
    description: 'Payment creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Payment last update timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes for better query performance
PaymentSchema.index({ patientId: 1, createdAt: -1 });
PaymentSchema.index({ nurseId: 1, createdAt: -1 });
PaymentSchema.index({ requestId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ externalTransactionId: 1 });
PaymentSchema.index({ createdAt: -1 });

// Virtual for populated fields
PaymentSchema.virtual('patient', {
  ref: 'User',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

PaymentSchema.virtual('nurse', {
  ref: 'User',
  localField: 'nurseId',
  foreignField: '_id',
  justOne: true
});

PaymentSchema.virtual('request', {
  ref: 'PatientRequest',
  localField: 'requestId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate net amount
PaymentSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('platformFee')) {
    this.netAmount = this.amount - this.platformFee;
  }
  next();
});

PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });
