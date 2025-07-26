import { IsString, IsNumber, IsEnum, Min, IsOptional } from 'class-validator';
import { ApplicationStatus } from '../schemas/application.schema';

export class CreateApplicationDto {
  @IsString()
  requestId: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  estimatedTime: number;
}

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
