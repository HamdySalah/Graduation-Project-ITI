import { IsEmail, IsString, IsEnum, IsOptional, IsArray, IsNumber, MinLength, IsPhoneNumber, isPhoneNumber, Matches } from 'class-validator';
import { UserRole } from '../schemas/user.schema';
import { SpecializationType } from '../schemas/nurse-profile.schema';

export class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @Matches(/^(\+20|0)?1[0-2,5]\d{8}$/, {
    message: 'Please provide a valid Egyptian phone number (e.g., 01030321695 or +201030321695)'
  })
  phone!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsArray()
  @IsNumber({}, { each: true })
  coordinates!: [number, number]; // [longitude, latitude]

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
  email!: string;

  @IsString()
  password!: string;
}

export class AuthResponseDto {
  access_token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
  };

}
