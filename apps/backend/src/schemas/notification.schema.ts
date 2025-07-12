import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  REQUEST_CREATED = 'request_created',
  REQUEST_ACCEPTED = 'request_accepted',
  REQUEST_COMPLETED = 'request_completed',
  REQUEST_CANCELLED = 'request_cancelled',
  NURSE_VERIFIED = 'nurse_verified',
  NURSE_REJECTED = 'nurse_rejected',
  REVIEW_RECEIVED = 'review_received',
  PAYMENT_RECEIVED = 'payment_received',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  REMINDER = 'reminder'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

@Schema({ timestamps: true })
export class Notification {
  @ApiProperty({
    description: 'ID of the user who will receive this notification',
    example: '507f1f77bcf86cd799439011'
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId?: Types.ObjectId;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.REQUEST_ACCEPTED
  })
  @Prop({ type: String, enum: NotificationType, required: true })
  type?: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'Request Accepted'
  })
  @Prop({ type: String, required: true, maxlength: 100 })
  title?: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your nursing request has been accepted by Sara Ibrahim.'
  })
  @Prop({ type: String, required: true, maxlength: 500 })
  message?: string;

  @ApiProperty({
    description: 'Notification priority level',
    enum: NotificationPriority,
    example: NotificationPriority.MEDIUM
  })
  @Prop({ type: String, enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  priority?: NotificationPriority;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false
  })
  @Prop({ type: Boolean, default: false })
  isRead?: boolean;

  @ApiProperty({
    description: 'Related entity ID (request, user, etc.)',
    example: '507f1f77bcf86cd799439012'
  })
  @Prop({ type: Types.ObjectId })
  relatedEntityId?: Types.ObjectId;

  @ApiProperty({
    description: 'Type of related entity',
    example: 'request'
  })
  @Prop({ type: String })
  relatedEntityType?: string;

  @ApiProperty({
    description: 'Additional data for the notification',
    example: { nurseId: '507f1f77bcf86cd799439013', nurseName: 'Sara Ibrahim' }
  })
  @Prop({ type: Object })
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Action URL or deep link',
    example: '/requests/507f1f77bcf86cd799439012'
  })
  @Prop({ type: String })
  actionUrl?: string;

  @ApiProperty({
    description: 'When the notification was read',
    example: '2024-01-15T10:30:00Z'
  })
  @Prop({ type: Date })
  readAt?: Date;

  @ApiProperty({
    description: 'When the notification expires (for temporary notifications)',
    example: '2024-01-22T10:30:00Z'
  })
  @Prop({ type: Date })
  expiresAt?: Date;

  @ApiProperty({
    description: 'Notification creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Notification last update timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Virtual for populated user
NotificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });
