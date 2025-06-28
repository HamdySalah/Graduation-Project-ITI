import { IsString, IsEnum, IsArray, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ServiceType, RequestStatus } from '../schemas/patient-request.schema';

export class CreateRequestDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: [number, number]; // [longitude, latitude]

  @IsString()
  address: string;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @IsOptional()
  @IsString()
  urgencyLevel?: string;

  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class GetNearbyNursesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  radius?: number; // in kilometers, default 10km

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];
}
