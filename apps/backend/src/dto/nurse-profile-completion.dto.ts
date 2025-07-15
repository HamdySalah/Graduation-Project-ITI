import { IsString, IsEmail, IsOptional, IsDateString, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProfileCompletionStatus } from '../schemas/nurse-profile.schema';

// Step 1: Basic Information DTO
export class Step1BasicInfoDto {
  @ApiProperty({
    description: 'Full name of the nurse',
    example: 'Sarah Miller'
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Email address of the nurse',
    example: 'sarah.miller@email.com'
  })
  @IsEmail()
  emailAddress: string;
}

// Step 2: Verification Documents DTO
export class Step2VerificationDto {
  @ApiProperty({
    description: 'Nursing license number',
    example: 'NUR123456'
  })
  @IsString()
  licenseNumber: string;

  @ApiProperty({
    description: 'License expiration date',
    example: '2025-12-31'
  })
  @IsDateString()
  licenseExpirationDate: string;

  @ApiProperty({
    description: 'License document file information',
    type: 'object'
  })
  @IsOptional()
  licenseDocument?: {
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  };

  @ApiProperty({
    description: 'Background check document file information',
    type: 'object'
  })
  @IsOptional()
  backgroundCheckDocument?: {
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  };

  @ApiProperty({
    description: 'Resume document file information',
    type: 'object'
  })
  @IsOptional()
  resumeDocument?: {
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  };
}

// Step 3: Complete Profile DTO
export class Step3CompleteProfileDto {
  @ApiProperty({
    description: 'Certification name',
    example: 'Registered Nurse Certification'
  })
  @IsOptional()
  @IsString()
  certificationName?: string;

  @ApiProperty({
    description: 'Issuing organization',
    example: 'American Nurses Credentialing Center'
  })
  @IsOptional()
  @IsString()
  issuingOrganization?: string;

  @ApiProperty({
    description: 'Certification license number',
    example: 'CERT789012'
  })
  @IsOptional()
  @IsString()
  certificationLicenseNumber?: string;

  @ApiProperty({
    description: 'Certification expiration date',
    example: '2026-06-30'
  })
  @IsOptional()
  @IsDateString()
  certificationExpirationDate?: string;

  @ApiProperty({
    description: 'List of skills',
    example: ['Patient Care', 'IV Therapy', 'Wound Care']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({
    description: 'Work experience description',
    example: '5 years of experience in emergency care and patient management'
  })
  @IsOptional()
  @IsString()
  workExperience?: string;

  @ApiProperty({
    description: 'Educational institution name',
    example: 'University of Healthcare Sciences'
  })
  @IsOptional()
  @IsString()
  institutionName?: string;

  @ApiProperty({
    description: 'Degree obtained',
    example: 'Bachelor of Science in Nursing'
  })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiProperty({
    description: 'Graduation date',
    example: '2019-05-15'
  })
  @IsOptional()
  @IsDateString()
  graduationDate?: string;

  @ApiProperty({
    description: 'Additional documents',
    type: 'array',
    items: { type: 'object' }
  })
  @IsOptional()
  @IsArray()
  additionalDocuments?: Array<{
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    documentType: string;
  }>;
}

// Profile completion status DTO
export class ProfileCompletionStatusDto {
  @ApiProperty({
    description: 'Current completion status',
    enum: ProfileCompletionStatus
  })
  @IsEnum(ProfileCompletionStatus)
  status: ProfileCompletionStatus;

  @ApiProperty({
    description: 'Step 1 completion status'
  })
  @IsBoolean()
  step1Completed: boolean;

  @ApiProperty({
    description: 'Step 2 completion status'
  })
  @IsBoolean()
  step2Completed: boolean;

  @ApiProperty({
    description: 'Step 3 completion status'
  })
  @IsBoolean()
  step3Completed: boolean;

  @ApiProperty({
    description: 'Profile submission date'
  })
  @IsOptional()
  @IsDateString()
  submittedAt?: string;
}

// Admin review DTO
export class AdminReviewDto {
  @ApiProperty({
    description: 'Approval status',
    example: true
  })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({
    description: 'Admin notes',
    example: 'All documents verified successfully'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Rejection reason (if not approved)',
    example: 'License document is not clear'
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
