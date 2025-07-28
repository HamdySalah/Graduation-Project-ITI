import {
  IsString,
  IsEnum,
  IsArray,
  IsNumber,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
  IsPhoneNumber,
  Matches,
  ValidateIf
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, RequestStatus } from '../schemas/patient-request.schema';
import { SpecializationType } from '../schemas/nurse-profile.schema';

export class CreateRequestDto {
  @ApiProperty({
    description: 'Title of the nursing request',
    example: 'Post-surgery care needed',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the nursing care needed',
    example: 'Patient needs post-surgical wound care and medication administration for 2 weeks',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description!: string;

  @ApiProperty({
    description: 'Type of nursing service required',
    enum: ServiceType,
    example: ServiceType.POST_SURGICAL_CARE,
  })
  @IsEnum(ServiceType, { message: 'Invalid service type' })
  serviceType!: ServiceType;

  @ApiProperty({
    description: 'Geographic coordinates [longitude, latitude] for the service location',
    example: [31.233, 30.033],
    type: [Number],
    minItems: 2,
    maxItems: 2,
  })
  @IsArray({ message: 'Coordinates must be an array' })
  @ArrayMinSize(2, { message: 'Coordinates must contain exactly 2 values [longitude, latitude]' })
  @ArrayMaxSize(2, { message: 'Coordinates must contain exactly 2 values [longitude, latitude]' })
  @IsNumber({}, { each: true, message: 'Each coordinate must be a valid number' })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(coord => parseFloat(coord));
    }
    return value;
  })
  coordinates!: [number, number]; // [longitude, latitude]

  @ApiProperty({
    description: 'Physical address where the service is needed',
    example: '123 Main St, Apt 4B, Cairo, Egypt',
    minLength: 10,
    maxLength: 255,
  })
  @IsString()
  @MinLength(10, { message: 'Address must be at least 10 characters long' })
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address!: string;

  @ApiProperty({
    description: 'Scheduled date and time for the service (ISO 8601 format)',
    example: '2024-12-25T10:00:00Z',
    format: 'date-time',
  })
  @IsDateString({}, { message: 'Please provide a valid date in ISO 8601 format' })
  scheduledDate!: string;

  @ApiPropertyOptional({
    description: 'Estimated duration of the service in hours',
    example: 4,
    minimum: 1,
    maximum: 24,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  @IsNumber({}, { message: 'Estimated duration must be a valid number' })
  @Min(1, { message: 'Estimated duration must be at least 1 hour' })
  @Max(24, { message: 'Estimated duration cannot exceed 24 hours' })
  estimatedDuration?: number;

  @ApiPropertyOptional({
    description: 'Urgency level of the request',
    example: 'high',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['low', 'medium', 'high', 'critical'], { message: 'Urgency level must be low, medium, high, or critical' })
  urgencyLevel?: string;

  @ApiPropertyOptional({
    description: 'Special requirements or instructions',
    example: 'Patient has allergies to penicillin. Requires gentle handling due to recent surgery.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Special requirements must not exceed 500 characters' })
  specialRequirements?: string;

  @ApiPropertyOptional({
    description: 'Budget for the service in local currency',
    example: 200,
    minimum: 0,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  @IsNumber({}, { message: 'Budget must be a valid number' })
  @Min(0, { message: 'Budget cannot be negative' })
  budget?: number;

  @ApiPropertyOptional({
    description: 'Contact phone number for the service',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.contactPhone && o.contactPhone.trim() !== '')
  @MinLength(10, { message: 'Phone number must be at least 10 digits' })
  @MaxLength(15, { message: 'Phone number must not exceed 15 digits' })
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or comments',
    example: 'Please call before arriving. Patient prefers morning appointments.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Array of uploaded images related to the condition',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        originalName: { type: 'string' },
        url: { type: 'string' },
        size: { type: 'number' },
      },
    },
  })
  @IsOptional()
  @IsArray()
  images?: Array<{
    filename: string;
    originalName: string;
    url: string;
    size: number;
  }>;
}

export class UpdateRequestStatusDto {
  @ApiProperty({
    description: 'New status for the request',
    enum: RequestStatus,
    example: RequestStatus.ACCEPTED,
  })
  @IsEnum(RequestStatus, { message: 'Invalid request status' })
  status!: RequestStatus;

  @ApiPropertyOptional({
    description: 'Reason for cancellation (required if status is cancelled)',
    example: 'Patient no longer needs the service',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Cancellation reason must not exceed 255 characters' })
  cancellationReason?: string;
}

export class UpdateRequestDto {
  @ApiPropertyOptional({
    description: 'Request title',
    example: 'Post-surgery care needed',
    minLength: 5,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the service needed',
    example: 'Patient needs post-surgical wound care and medication administration...',
    minLength: 20,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MinLength(20, { message: 'Description must be at least 20 characters long' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of nursing service required',
    enum: ServiceType,
    example: ServiceType.POST_SURGICAL_CARE,
  })
  @IsOptional()
  @IsEnum(ServiceType, { message: 'Invalid service type' })
  serviceType?: ServiceType;

  @ApiPropertyOptional({
    description: 'Service location coordinates [longitude, latitude]',
    example: [31.233, 30.033],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2, { message: 'Coordinates must contain exactly 2 values' })
  @ArrayMaxSize(2, { message: 'Coordinates must contain exactly 2 values' })
  @IsNumber({}, { each: true, message: 'Each coordinate must be a number' })
  coordinates?: [number, number];

  @ApiPropertyOptional({
    description: 'Full address where service is needed',
    example: '123 Main St, Apartment 4B, Cairo, Egypt',
    minLength: 10,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Address must be at least 10 characters long' })
  @MaxLength(200, { message: 'Address must not exceed 200 characters' })
  address?: string;

  @ApiPropertyOptional({
    description: 'Scheduled date and time for the service (ISO 8601 format)',
    example: '2024-12-25T10:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)' })
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Estimated duration of service in hours',
    example: 4,
    minimum: 1,
    maximum: 24,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 hour' })
  @Max(24, { message: 'Duration must not exceed 24 hours' })
  estimatedDuration?: number;

  @ApiPropertyOptional({
    description: 'Urgency level of the request',
    example: 'high',
    enum: ['low', 'medium', 'high', 'emergency'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['low', 'medium', 'high', 'emergency'], { message: 'Invalid urgency level' })
  urgencyLevel?: string;

  @ApiPropertyOptional({
    description: 'Special requirements or instructions',
    example: 'Patient has mobility issues, please bring wheelchair accessible equipment',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Special requirements must not exceed 500 characters' })
  specialRequirements?: string;

  @ApiPropertyOptional({
    description: 'Budget for the service in EGP',
    example: 200,
    minimum: 50,
    maximum: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(50, { message: 'Budget must be at least 50 EGP' })
  @Max(5000, { message: 'Budget must not exceed 5000 EGP' })
  budget?: number;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+201234567890',
  })
  @IsOptional()
  @IsPhoneNumber('EG', { message: 'Invalid Egyptian phone number format' })
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or comments',
    example: 'Please call before arriving',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Notes must not exceed 300 characters' })
  notes?: string;
}

export class GetNearbyNursesDto {
  @ApiProperty({
    description: 'Latitude coordinate for the search center',
    example: 30.033,
    minimum: -90,
    maximum: 90,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude!: number;

  @ApiProperty({
    description: 'Longitude coordinate for the search center',
    example: 31.233,
    minimum: -180,
    maximum: 180,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude!: number;

  @ApiPropertyOptional({
    description: 'Search radius in kilometers',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber({}, { message: 'Radius must be a valid number' })
  @Min(1, { message: 'Radius must be at least 1 km' })
  @Max(100, { message: 'Radius cannot exceed 100 km' })
  radius?: number; // in kilometers, default 10km

  @ApiPropertyOptional({
    description: 'Filter nurses by specializations (comma-separated or array)',
    enum: SpecializationType,
    isArray: true,
    example: [SpecializationType.GENERAL, SpecializationType.PEDIATRIC],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim()).filter(s => s);
    }
    return value;
  })
  @IsArray()
  @IsEnum(SpecializationType, { each: true, message: 'Invalid specialization type' })
  specializations?: SpecializationType[];
}

export class RequestResponseDto {
  @ApiProperty({
    description: 'Request ID',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Request title',
    example: 'Post-surgery care needed',
  })
  title!: string;

  @ApiProperty({
    description: 'Request description',
    example: 'Patient needs post-surgical wound care...',
  })
  description!: string;

  @ApiProperty({
    description: 'Service type',
    enum: ServiceType,
    example: ServiceType.POST_SURGICAL_CARE,
  })
  serviceType!: ServiceType;

  @ApiProperty({
    description: 'Request status',
    enum: RequestStatus,
    example: RequestStatus.PENDING,
  })
  status!: RequestStatus;

  @ApiProperty({
    description: 'Service location coordinates',
    example: [31.233, 30.033],
    type: [Number],
  })
  coordinates!: [number, number];

  @ApiProperty({
    description: 'Service address',
    example: '123 Main St, Cairo, Egypt',
  })
  address!: string;

  @ApiProperty({
    description: 'Scheduled date and time',
    example: '2024-12-25T10:00:00Z',
  })
  scheduledDate!: Date;

  @ApiPropertyOptional({
    description: 'Estimated duration in hours',
    example: 4,
  })
  estimatedDuration?: number;

  @ApiPropertyOptional({
    description: 'Urgency level',
    example: 'high',
  })
  urgencyLevel?: string;

  @ApiPropertyOptional({
    description: 'Budget for the service',
    example: 200,
  })
  budget?: number;

  @ApiProperty({
    description: 'Request creation date',
    example: '2024-12-20T10:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-12-20T10:00:00Z',
  })
  updatedAt!: Date;
}

export class DashboardStatsDto {
  @ApiProperty({
    description: 'Total number of requests',
    example: 25,
  })
  totalRequests!: number;

  @ApiProperty({
    description: 'Number of pending requests',
    example: 5,
  })
  pendingRequests!: number;

  @ApiProperty({
    description: 'Number of accepted requests',
    example: 10,
  })
  acceptedRequests!: number;

  @ApiProperty({
    description: 'Number of completed requests',
    example: 8,
  })
  completedRequests!: number;

  @ApiProperty({
    description: 'Number of cancelled requests',
    example: 2,
  })
  cancelledRequests!: number;
}
