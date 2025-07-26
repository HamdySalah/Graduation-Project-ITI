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

export enum ProfileCompletionStatus {
  NOT_STARTED = 'not_started',
  STEP_1_COMPLETED = 'step_1_completed',
  STEP_2_COMPLETED = 'step_2_completed',
  STEP_3_COMPLETED = 'step_3_completed',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Document upload schema for file management
@Schema({ timestamps: true })
export class DocumentUpload {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  fileType: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true })
  documentType: string; // 'license', 'background_check', 'resume', 'certification', etc.

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

export const DocumentUploadSchema = SchemaFactory.createForClass(DocumentUpload);

@Schema({ timestamps: true })
export class NurseProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId?: Types.ObjectId;

  // Profile completion tracking
  @Prop({
    type: String,
    enum: ProfileCompletionStatus,
    default: ProfileCompletionStatus.NOT_STARTED
  })
  completionStatus?: ProfileCompletionStatus;

  @Prop({ default: Date.now })
  lastUpdated?: Date;

  // Step 1: Basic Information (from form image 1)
  @Prop()
  fullName?: string; // Will sync with User.name

  @Prop()
  emailAddress?: string; // Will sync with User.email

  @Prop({ default: false })
  step1Completed?: boolean;

  @Prop()
  step1CompletedAt?: Date;

  // Step 2: Verification Documents (from form image 2)
  @Prop()
  licenseNumber?: string;

  @Prop()
  licenseExpirationDate?: Date;

  @Prop({ type: DocumentUploadSchema })
  licenseDocument?: DocumentUpload;

  @Prop({ type: DocumentUploadSchema })
  backgroundCheckDocument?: DocumentUpload;

  @Prop({ type: DocumentUploadSchema })
  resumeDocument?: DocumentUpload;

  @Prop({ default: false })
  step2Completed?: boolean;

  @Prop()
  step2CompletedAt?: Date;

  // Step 3: Complete Profile (from form image 3)
  @Prop()
  certificationName?: string;

  @Prop()
  issuingOrganization?: string;

  @Prop()
  certificationLicenseNumber?: string;

  @Prop()
  certificationExpirationDate?: Date;

  @Prop({ type: [String] })
  skills?: string[];

  @Prop()
  workExperience?: string;

  @Prop()
  institutionName?: string;

  @Prop()
  degree?: string;

  @Prop()
  graduationDate?: Date;

  @Prop({ type: [DocumentUploadSchema] })
  additionalDocuments?: DocumentUpload[];

  @Prop({ default: false })
  step3Completed?: boolean;

  @Prop()
  step3CompletedAt?: Date;

  // Legacy fields (keeping for backward compatibility)
  @Prop({ required: false })
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

  @Prop()
  verifiedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy?: Types.ObjectId;

  // Profile submission tracking
  @Prop()
  submittedAt?: Date;

  @Prop()
  adminNotes?: string;

  @Prop()
  rejectionReason?: string;

  @Prop()
  rejectedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  rejectedBy?: Types.ObjectId;
}

export const NurseProfileSchema = SchemaFactory.createForClass(NurseProfile);
