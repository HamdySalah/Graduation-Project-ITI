import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileSubmissionDocument = ProfileSubmission & Document;

export enum SubmissionStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_CHANGES = 'requires_changes',
}

export enum AdminAction {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUESTED_CHANGES = 'requested_changes',
  ADDED_NOTE = 'added_note',
}

@Schema({ timestamps: true })
export class AdminActionLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  adminId: Types.ObjectId;

  @Prop({ required: true, enum: AdminAction })
  action: AdminAction;

  @Prop()
  notes?: string;

  @Prop()
  reason?: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const AdminActionLogSchema = SchemaFactory.createForClass(AdminActionLog);

@Schema({ timestamps: true })
export class ProfileSubmission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'NurseProfile', required: true })
  nurseProfileId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: SubmissionStatus, 
    default: SubmissionStatus.PENDING 
  })
  status: SubmissionStatus;

  @Prop({ required: true })
  submittedAt: Date;

  @Prop()
  reviewedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  adminNotes?: string;

  @Prop()
  rejectionReason?: string;

  @Prop({ type: [AdminActionLogSchema] })
  actionHistory: AdminActionLog[];

  // Notification tracking
  @Prop({ default: false })
  nurseNotified: boolean;

  @Prop({ default: false })
  adminNotified: boolean;

  @Prop()
  notificationSentAt?: Date;

  // Priority and urgency
  @Prop({ default: 'normal', enum: ['low', 'normal', 'high', 'urgent'] })
  priority: string;

  @Prop({ default: false })
  flaggedForReview: boolean;

  @Prop()
  flagReason?: string;
}

export const ProfileSubmissionSchema = SchemaFactory.createForClass(ProfileSubmission);

// Indexes for better query performance
ProfileSubmissionSchema.index({ userId: 1 });
ProfileSubmissionSchema.index({ status: 1, submittedAt: -1 });
ProfileSubmissionSchema.index({ reviewedBy: 1, reviewedAt: -1 });
ProfileSubmissionSchema.index({ priority: 1, submittedAt: -1 });
