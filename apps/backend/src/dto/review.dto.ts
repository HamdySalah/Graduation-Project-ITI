import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsMongoId, Min, Max, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AspectRatingsDto {
  @ApiProperty({
    description: 'Professionalism rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  professionalism: number;

  @ApiProperty({
    description: 'Punctuality rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  punctuality: number;

  @ApiProperty({
    description: 'Communication rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  communication: number;

  @ApiProperty({
    description: 'Skill level rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  skillLevel: number;
}

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID of the completed request being reviewed',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  requestId: string;

  @ApiProperty({
    description: 'ID of the nurse being reviewed',
    example: '507f1f77bcf86cd799439012'
  })
  @IsMongoId()
  nurseId: string;

  @ApiProperty({
    description: 'Overall rating for the nurse (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Written review comment',
    example: 'Excellent service! Very professional and caring nurse.',
    maxLength: 1000
  })
  @IsString()
  @MaxLength(1000)
  comment: string;

  @ApiPropertyOptional({
    description: 'Detailed aspect ratings',
    type: AspectRatingsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AspectRatingsDto)
  aspectRatings?: AspectRatingsDto;

  @ApiPropertyOptional({
    description: 'Whether the patient would recommend this nurse',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Updated overall rating for the nurse (1-5 stars)',
    example: 4,
    minimum: 1,
    maximum: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Updated written review comment',
    example: 'Good service, but could improve punctuality.',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({
    description: 'Updated detailed aspect ratings',
    type: AspectRatingsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AspectRatingsDto)
  aspectRatings?: AspectRatingsDto;

  @ApiPropertyOptional({
    description: 'Updated recommendation status',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;
}

export class ReviewResponseDto {
  @ApiProperty({
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'Patient information',
    example: {
      id: '507f1f77bcf86cd799439012',
      name: 'Ahmed Hassan',
      profileImage: 'https://example.com/profile.jpg'
    }
  })
  patient: {
    id: string;
    name: string;
    profileImage?: string;
  };

  @ApiProperty({
    description: 'Nurse information',
    example: {
      id: '507f1f77bcf86cd799439013',
      name: 'Sara Ibrahim',
      profileImage: 'https://example.com/profile.jpg'
    }
  })
  nurse: {
    id: string;
    name: string;
    profileImage?: string;
  };

  @ApiProperty({
    description: 'Request information',
    example: {
      id: '507f1f77bcf86cd799439014',
      title: 'Post-surgery wound care',
      serviceType: 'wound_care',
      scheduledDate: '2024-01-15T10:00:00Z'
    }
  })
  request: {
    id: string;
    title: string;
    serviceType: string;
    scheduledDate: Date;
  };

  @ApiProperty({
    description: 'Overall rating (1-5 stars)',
    example: 5
  })
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Excellent service! Very professional and caring nurse.'
  })
  comment: string;

  @ApiPropertyOptional({
    description: 'Detailed aspect ratings',
    example: {
      professionalism: 5,
      punctuality: 4,
      communication: 5,
      skillLevel: 5
    }
  })
  aspectRatings?: AspectRatingsDto;

  @ApiProperty({
    description: 'Whether the patient would recommend this nurse',
    example: true
  })
  wouldRecommend: boolean;

  @ApiProperty({
    description: 'Review creation date',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Review last update date',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}

export class ReviewStatsDto {
  @ApiProperty({
    description: 'Total number of reviews',
    example: 25
  })
  totalReviews: number;

  @ApiProperty({
    description: 'Average rating (1-5 stars)',
    example: 4.8
  })
  averageRating: number;

  @ApiProperty({
    description: 'Rating distribution by star count',
    example: { 1: 0, 2: 1, 3: 2, 4: 7, 5: 15 }
  })
  ratingDistribution: Record<number, number>;

  @ApiPropertyOptional({
    description: 'Average ratings for specific aspects',
    example: {
      professionalism: 4.9,
      punctuality: 4.6,
      communication: 4.8,
      skillLevel: 4.7
    }
  })
  averageAspectRatings?: {
    professionalism: number;
    punctuality: number;
    communication: number;
    skillLevel: number;
  };

  @ApiProperty({
    description: 'Percentage of patients who would recommend this nurse',
    example: 96
  })
  recommendationRate: number;
}

export class PendingReviewDto {
  @ApiProperty({
    description: 'Request ID that can be reviewed',
    example: '507f1f77bcf86cd799439011'
  })
  requestId: string;

  @ApiProperty({
    description: 'Request title',
    example: 'Post-surgery wound care'
  })
  title: string;

  @ApiProperty({
    description: 'Service type',
    example: 'wound_care'
  })
  serviceType: string;

  @ApiProperty({
    description: 'Scheduled service date',
    example: '2024-01-15T10:00:00Z'
  })
  scheduledDate: Date;

  @ApiProperty({
    description: 'Service completion date',
    example: '2024-01-15T12:00:00Z'
  })
  completedAt: Date;

  @ApiProperty({
    description: 'Nurse information',
    example: {
      id: '507f1f77bcf86cd799439013',
      name: 'Sara Ibrahim',
      profileImage: 'https://example.com/profile.jpg'
    }
  })
  nurse: {
    id: string;
    name: string;
    profileImage?: string;
  };
}
