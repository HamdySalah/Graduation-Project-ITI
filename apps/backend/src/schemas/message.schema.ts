import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MessageDocument = Message & Document;
export type ConversationDocument = Conversation & Document;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  LOCATION = 'location',
  SYSTEM = 'system'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read'
}

@Schema({ timestamps: true })
export class Message {
  @ApiProperty({
    description: 'ID of the conversation this message belongs to',
    example: '507f1f77bcf86cd799439011'
  })
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId?: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the user who sent the message',
    example: '507f1f77bcf86cd799439012'
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId?: Types.ObjectId;

  @ApiProperty({
    description: 'Type of message',
    enum: MessageType,
    example: MessageType.TEXT
  })
  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  type?: MessageType;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, I have a question about the service.'
  })
  @Prop({ type: String, required: true, maxlength: 2000 })
  content?: string;

  @ApiProperty({
    description: 'File attachment URL (for image/file messages)',
    example: '/api/uploads/messages/image-123456789.jpg'
  })
  @Prop({ type: String })
  attachmentUrl?: string;

  @ApiProperty({
    description: 'File attachment metadata',
    example: { filename: 'document.pdf', size: 1024000, mimeType: 'application/pdf' }
  })
  @Prop({ type: Object })
  attachmentMetadata?: {
    filename: string;
    size: number;
    mimeType: string;
  };

  @ApiProperty({
    description: 'Message status',
    enum: MessageStatus,
    example: MessageStatus.READ
  })
  @Prop({ type: String, enum: MessageStatus, default: MessageStatus.SENT })
  status?: MessageStatus;

  @ApiProperty({
    description: 'When the message was delivered',
    example: '2024-01-15T10:30:00Z'
  })
  @Prop({ type: Date })
  deliveredAt?: Date;

  @ApiProperty({
    description: 'When the message was read',
    example: '2024-01-15T10:35:00Z'
  })
  @Prop({ type: Date })
  readAt?: Date;

  @ApiProperty({
    description: 'Message creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Message last update timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt?: Date;
}

@Schema({ timestamps: true })
export class Conversation {
  @ApiProperty({
    description: 'ID of the patient in the conversation',
    example: '507f1f77bcf86cd799439011'
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId?: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the nurse in the conversation',
    example: '507f1f77bcf86cd799439012'
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  nurseId?: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the related service request (optional)',
    example: '507f1f77bcf86cd799439013'
  })
  @Prop({ type: Types.ObjectId, ref: 'PatientRequest' })
  requestId?: Types.ObjectId;

  @ApiProperty({
    description: 'Conversation title/subject',
    example: 'Wound Care Service Discussion'
  })
  @Prop({ type: String, maxlength: 200 })
  title?: string;

  @ApiProperty({
    description: 'ID of the last message in the conversation',
    example: '507f1f77bcf86cd799439014'
  })
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessageId?: Types.ObjectId;

  @ApiProperty({
    description: 'Timestamp of the last message',
    example: '2024-01-15T10:35:00Z'
  })
  @Prop({ type: Date })
  lastMessageAt?: Date;

  @ApiProperty({
    description: 'Number of unread messages for the patient',
    example: 2
  })
  @Prop({ type: Number, default: 0 })
  unreadCountPatient?: number;

  @ApiProperty({
    description: 'Number of unread messages for the nurse',
    example: 0
  })
  @Prop({ type: Number, default: 0 })
  unreadCountNurse?: number;

  @ApiProperty({
    description: 'Whether the conversation is archived by the patient',
    example: false
  })
  @Prop({ type: Boolean, default: false })
  archivedByPatient?: boolean;

  @ApiProperty({
    description: 'Whether the conversation is archived by the nurse',
    example: false
  })
  @Prop({ type: Boolean, default: false })
  archivedByNurse?: boolean;

  @ApiProperty({
    description: 'Conversation creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Conversation last update timestamp',
    example: '2024-01-15T10:35:00Z'
  })
  updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Message indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ status: 1 });

// Conversation indexes
ConversationSchema.index({ patientId: 1, lastMessageAt: -1 });
ConversationSchema.index({ nurseId: 1, lastMessageAt: -1 });
ConversationSchema.index({ requestId: 1 });
ConversationSchema.index({ patientId: 1, nurseId: 1 }, { unique: true });

// Virtual for populated fields
MessageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

MessageSchema.virtual('conversation', {
  ref: 'Conversation',
  localField: 'conversationId',
  foreignField: '_id',
  justOne: true
});

ConversationSchema.virtual('patient', {
  ref: 'User',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

ConversationSchema.virtual('nurse', {
  ref: 'User',
  localField: 'nurseId',
  foreignField: '_id',
  justOne: true
});

ConversationSchema.virtual('request', {
  ref: 'PatientRequest',
  localField: 'requestId',
  foreignField: '_id',
  justOne: true
});

ConversationSchema.virtual('lastMessage', {
  ref: 'Message',
  localField: 'lastMessageId',
  foreignField: '_id',
  justOne: true
});

MessageSchema.set('toJSON', { virtuals: true });
MessageSchema.set('toObject', { virtuals: true });
ConversationSchema.set('toJSON', { virtuals: true });
ConversationSchema.set('toObject', { virtuals: true });
