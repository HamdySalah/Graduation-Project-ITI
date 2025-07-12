import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsEnum, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { UserRole, UserStatus } from '../schemas/user.schema';

export class UserListDto {
  @ApiProperty({
    description: 'List of users',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        role: { type: 'string', example: 'nurse' },
        status: { type: 'string', example: 'verified' },
        createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  users: any[];

  @ApiProperty({
    description: 'Pagination information',
    example: {
      currentPage: 1,
      totalPages: 10,
      totalUsers: 100,
      hasNextPage: true,
      hasPrevPage: false
    }
  })
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };

  @ApiProperty({
    description: 'Applied filters',
    example: {
      role: 'nurse',
      status: 'verified',
      search: 'john'
    }
  })
  filters: {
    role?: UserRole;
    status?: string;
    search?: string;
  };
}

export class UserProfileDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe'
  })
  name: string;

  @ApiProperty({
    description: 'User email',
    example: 'john@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'User phone',
    example: '+1234567890'
  })
  phone: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: 'nurse'
  })
  role: UserRole;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: 'verified'
  })
  status: UserStatus;

  @ApiProperty({
    description: 'User location',
    example: {
      type: 'Point',
      coordinates: [31.233334, 30.033333]
    }
  })
  location: {
    type: string;
    coordinates: [number, number];
  };

  @ApiProperty({
    description: 'User address',
    example: '123 Main St, Cairo, Egypt'
  })
  address: string;

  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://example.com/profile.jpg'
  })
  @IsOptional()
  profileImage?: string;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Nurse profile data (if user is a nurse)',
    example: {
      licenseNumber: 'NUR123456',
      specializations: ['general', 'emergency'],
      rating: 4.8,
      hourlyRate: 50
    }
  })
  @IsOptional()
  nurseProfile?: any;

  @ApiProperty({
    description: 'User statistics',
    example: {
      totalJobs: 25,
      completedJobs: 20,
      completionRate: 80
    }
  })
  @IsOptional()
  statistics?: any;

  @ApiProperty({
    description: 'Recent user activity',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'job' },
        action: { type: 'string', example: 'Job completed' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @IsOptional()
  recentActivity?: any[];
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'User email',
    example: 'john@example.com'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'User phone',
    example: '+1234567890'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'User address',
    example: '123 Main St, Cairo, Egypt'
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: 'verified'
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({
    description: 'User coordinates [longitude, latitude]',
    example: [31.233334, 30.033333]
  })
  @IsOptional()
  @IsArray()
  coordinates?: [number, number];

  @ApiProperty({
    description: 'Nurse profile data (if user is a nurse)',
    example: {
      bio: 'Experienced nurse with 5 years in healthcare',
      hourlyRate: 60,
      isAvailable: true,
      specializations: ['general', 'emergency']
    }
  })
  @IsOptional()
  nurseData?: {
    bio?: string;
    hourlyRate?: number;
    isAvailable?: boolean;
    specializations?: string[];
    education?: string;
    certifications?: string[];
    languages?: string[];
  };
}

export class UserStatsDto {
  @ApiProperty({
    description: 'User statistics overview',
    example: {
      totalUsers: 1500,
      recentRegistrations: 25,
      usersByRole: { patient: 1200, nurse: 280, admin: 20 },
      usersByStatus: { verified: 1400, pending: 80, suspended: 20 }
    }
  })
  overview: {
    totalUsers: number;
    recentRegistrations: number;
    usersByRole: Record<string, number>;
    usersByStatus: Record<string, number>;
  };

  @ApiProperty({
    description: 'User registration trends',
    example: {
      registrations: [
        { _id: '2024-01-15', count: 5 },
        { _id: '2024-01-16', count: 8 }
      ]
    }
  })
  trends: {
    registrations: Array<{
      _id: string;
      count: number;
    }>;
  };
}

export class UserStatusUpdateDto {
  @ApiProperty({
    description: 'New user status',
    enum: UserStatus,
    example: 'verified'
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({
    description: 'Reason for status change',
    example: 'Documents verified successfully'
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SuspendUserDto {
  @ApiProperty({
    description: 'Reason for suspension',
    example: 'Policy violation'
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Suspension duration in days',
    example: 30
  })
  @IsOptional()
  @IsNumber()
  duration?: number;
}
