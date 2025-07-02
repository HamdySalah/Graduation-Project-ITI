import {
  IsString,
  IsEmail,
  IsEnum,
  IsArray,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
  Matches
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';
import { SpecializationType } from '../schemas/nurse-profile.schema';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Password for the account',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
  })
  @IsString()
  @IsPhoneNumber(null, { message: 'Please provide a valid phone number' })
  phone: string;

  @ApiProperty({
    description: 'Role of the user in the system',
    enum: UserRole,
    example: UserRole.PATIENT,
  })
  @IsEnum(UserRole, { message: 'Role must be either patient, nurse, or admin' })
  role: UserRole;

  @ApiProperty({
    description: 'Geographic coordinates [longitude, latitude]',
    example: [31.233, 30.033],
    type: [Number],
    minItems: 2,
    maxItems: 2,
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'Coordinates must contain exactly 2 values' })
  @ArrayMaxSize(2, { message: 'Coordinates must contain exactly 2 values' })
  @IsNumber({}, { each: true, message: 'Coordinates must be valid numbers' })
  coordinates: [number, number]; // [longitude, latitude]

  @ApiPropertyOptional({
    description: 'Physical address of the user',
    example: '123 Main St, Cairo, Egypt',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address?: string;

  // Nurse-specific fields (only required if role is nurse)
  @ApiPropertyOptional({
    description: 'Nursing license number (required for nurses)',
    example: 'NL123456789',
  })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'License number must be at least 5 characters long' })
  licenseNumber?: string;

  @ApiPropertyOptional({
    description: 'Years of nursing experience (required for nurses)',
    example: 5,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Years of experience must be a valid number' })
  @Min(0, { message: 'Years of experience cannot be negative' })
  @Max(50, { message: 'Years of experience cannot exceed 50 years' })
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    description: 'Areas of nursing specialization',
    enum: SpecializationType,
    isArray: true,
    example: [SpecializationType.GENERAL, SpecializationType.PEDIATRIC],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SpecializationType, { each: true, message: 'Invalid specialization type' })
  specializations?: SpecializationType[];

  @ApiPropertyOptional({
    description: 'Educational background',
    example: 'Bachelor of Science in Nursing, Cairo University',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Education description must not exceed 500 characters' })
  education?: string;

  @ApiPropertyOptional({
    description: 'Professional certifications',
    example: ['CPR Certified', 'Advanced Cardiac Life Support'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each certification must be a valid string' })
  certifications?: string[];

  @ApiPropertyOptional({
    description: 'Document URLs for verification',
    example: ['https://example.com/license.pdf', 'https://example.com/certificate.pdf'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each document must be a valid URL string' })
  documents?: string[];

  @ApiPropertyOptional({
    description: 'Hourly rate in local currency',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Hourly rate must be a valid number' })
  @Min(0, { message: 'Hourly rate cannot be negative' })
  hourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Professional biography',
    example: 'Experienced nurse with 5 years in pediatric care...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Bio must not exceed 1000 characters' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Languages spoken',
    example: ['English', 'Arabic'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each language must be a valid string' })
  languages?: string[];
}

export class LoginDto {
  @ApiProperty({
    description: 'Email address for login',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Password for login',
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.PATIENT,
  })
  role: UserRole;

  @ApiProperty({
    description: 'User account status',
    example: 'verified',
    enum: ['pending', 'verified', 'rejected'],
  })
  status: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Updated full name',
    example: 'John Smith',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  @IsPhoneNumber(null, { message: 'Please provide a valid phone number' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Updated address',
    example: '456 New St, Cairo, Egypt',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address?: string;

  @ApiPropertyOptional({
    description: 'Updated coordinates [longitude, latitude]',
    example: [31.233, 30.033],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2, { message: 'Coordinates must contain exactly 2 values' })
  @ArrayMaxSize(2, { message: 'Coordinates must contain exactly 2 values' })
  @IsNumber({}, { each: true, message: 'Coordinates must be valid numbers' })
  coordinates?: [number, number];

  // Nurse-specific updates
  @ApiPropertyOptional({
    description: 'Updated hourly rate',
    example: 60,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Hourly rate must be a valid number' })
  @Min(0, { message: 'Hourly rate cannot be negative' })
  hourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Updated bio',
    example: 'Updated professional biography...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Bio must not exceed 1000 characters' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Updated availability status',
    example: true,
  })
  @IsOptional()
  isAvailable?: boolean;
}
