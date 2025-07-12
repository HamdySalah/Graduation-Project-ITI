import { IsEmail, IsString, IsEnum, IsOptional, IsArray, IsNumber, MinLength, IsPhoneNumber, isPhoneNumber } from 'class-validator';
import { UserRole } from '../schemas/user.schema';
import { SpecializationType } from '../schemas/nurse-profile.schema';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;


  @ApiProperty({
    description: 'Phone number of the user (Egyptian format: 01X followed by 8 digits)',
    example: '01012345678',
  })
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'Phone number must be a valid Egyptian mobile number (e.g., 01012345678)',
  })
  phone: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: [number, number]; // [longitude, latitude]

  @IsOptional()
  @IsString()
  address?: string;

  // Nurse-specific fields (only required if role is nurse)
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(SpecializationType, { each: true })
  specializations?: SpecializationType[];

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
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
    description: 'Updated phone number (Egyptian mobile format)',
    example: '01012345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'Please provide a valid Egyptian mobile number (01X format, 11 digits)'
  })
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


}
