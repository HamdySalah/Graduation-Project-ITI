import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsMongoId, Min, Max, MaxLength } from 'class-validator';
import { ReviewType, ReviewerRole } from '../schemas/review.schema';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID of the completed request',
    example: '507f1f77bcf86cd799439013'
  })
  @IsMongoId()
  requestId: string;

  @ApiPropertyOptional({
    description: 'ID of the user being reviewed (required for user-to-user reviews)',
    example: '507f1f77bcf86cd799439012'
  })
  @IsOptional()
  @IsMongoId()
  revieweeId?: string;

  @ApiProperty({
    description: 'Type of review',
    example: 'user_to_user',
    enum: ReviewType
  })
  @IsEnum(ReviewType)
  reviewType: ReviewType;

  @ApiProperty({
    description: 'Rating (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Optional written feedback',
    example: 'Excellent service! Very professional and caring.',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Updated rating (1-5 stars)',
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
    description: 'Updated written feedback',
    example: 'Good service overall.',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}

export class ReviewResponseDto {
  @ApiProperty({
    description: 'Review ID',
    example: '507f1f77bcf86cd799439014'
  })
  id: string;

  @ApiProperty({
    description: 'Request ID',
    example: '507f1f77bcf86cd799439013'
  })
  requestId: string;

  @ApiProperty({
    description: 'Reviewer ID',
    example: '507f1f77bcf86cd799439011'
  })
  reviewerId: string;

  @ApiProperty({
    description: 'Reviewer role',
    example: 'patient',
    enum: ReviewerRole
  })
  reviewerRole: ReviewerRole;

  @ApiPropertyOptional({
    description: 'Reviewee ID (for user-to-user reviews)',
    example: '507f1f77bcf86cd799439012'
  })
  revieweeId?: string;

  @ApiProperty({
    description: 'Review type',
    example: 'user_to_user',
    enum: ReviewType
  })
  reviewType: ReviewType;

  @ApiProperty({
    description: 'Rating given',
    example: 5
  })
  rating: number;

  @ApiPropertyOptional({
    description: 'Written feedback',
    example: 'Excellent service!'
  })
  feedback?: string;

  @ApiProperty({
    description: 'When the review was submitted',
    example: '2024-01-15T10:30:00Z'
  })
  submittedAt: Date;

  @ApiProperty({
    description: 'Review creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Review last update timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}

export class ReviewStatsDto {
  @ApiProperty({
    description: 'Average rating',
    example: 4.5
  })
  averageRating: number;

  @ApiProperty({
    description: 'Total number of reviews',
    example: 25
  })
  totalReviews: number;

  @ApiProperty({
    description: 'Rating distribution',
    example: { 1: 0, 2: 1, 3: 2, 4: 8, 5: 14 }
  })
  ratingDistribution: Record<number, number>;
}

export class GetReviewsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by request ID',
    example: '507f1f77bcf86cd799439013'
  })
  @IsOptional()
  @IsMongoId()
  requestId?: string;

  @ApiPropertyOptional({
    description: 'Filter by reviewer ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  reviewerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by reviewee ID',
    example: '507f1f77bcf86cd799439012'
  })
  @IsOptional()
  @IsMongoId()
  revieweeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by review type',
    example: 'user_to_user',
    enum: ReviewType
  })
  @IsOptional()
  @IsEnum(ReviewType)
  reviewType?: ReviewType;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
