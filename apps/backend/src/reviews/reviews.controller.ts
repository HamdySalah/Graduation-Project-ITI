import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../schemas/user.schema';
import { ReviewType } from '../schemas/review.schema';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  ReviewStatsDto,
  GetReviewsQueryDto
} from '../dto/review.dto';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new review',
    description: 'Create a mutual review between nurse and patient, or a service review'
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review created successfully',
    type: ReviewResponseDto
  })
  @ApiBadRequestResponse({ description: 'Invalid input or duplicate review' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Not authorized to review this request' })
  @ApiNotFoundResponse({ description: 'Request or reviewee not found' })
  async createReview(
    @Body(ValidationPipe) createReviewDto: CreateReviewDto,
    @Request() req: any
  ) {
    return this.reviewsService.createReview(createReviewDto, req.user);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get reviews with filtering and pagination',
    description: 'Retrieve reviews with optional filters for request, reviewer, reviewee, and type'
  })
  @ApiQuery({ name: 'requestId', required: false, description: 'Filter by request ID' })
  @ApiQuery({ name: 'reviewerId', required: false, description: 'Filter by reviewer ID' })
  @ApiQuery({ name: 'revieweeId', required: false, description: 'Filter by reviewee ID' })
  @ApiQuery({ name: 'reviewType', required: false, enum: ReviewType, description: 'Filter by review type' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        reviews: { type: 'array', items: { $ref: '#/components/schemas/ReviewResponseDto' } },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async getReviews(
    @Query(ValidationPipe) query: GetReviewsQueryDto,
    @Request() req: any
  ) {
    return this.reviewsService.getReviews(query, req.user);
  }

  @Get('request/:requestId')
  @ApiOperation({ 
    summary: 'Get all reviews for a specific request',
    description: 'Retrieve all reviews (user-to-user and service) for a completed request'
  })
  @ApiParam({ name: 'requestId', description: 'Request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request reviews retrieved successfully',
    type: [ReviewResponseDto]
  })
  @ApiNotFoundResponse({ description: 'Request not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async getReviewsByRequest(
    @Param('requestId') requestId: string,
    @Request() req: any
  ) {
    return this.reviewsService.getReviewsByRequest(requestId, req.user);
  }

  @Get('stats/:userId')
  @ApiOperation({ 
    summary: 'Get review statistics for a user',
    description: 'Get aggregated review statistics including average rating and distribution'
  })
  @ApiParam({ name: 'userId', description: 'User ID to get stats for' })
  @ApiQuery({ name: 'reviewType', required: false, enum: ReviewType, description: 'Filter by review type' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review statistics retrieved successfully',
    type: ReviewStatsDto
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async getReviewStats(
    @Param('userId') userId: string,
    @Query('reviewType') reviewType?: ReviewType
  ) {
    return this.reviewsService.getReviewStats(userId, reviewType);
  }

  @Get('can-review/:requestId')
  @ApiOperation({ 
    summary: 'Check if user can review a request',
    description: 'Check if the current user can submit a specific type of review for a request'
  })
  @ApiParam({ name: 'requestId', description: 'Request ID' })
  @ApiQuery({ name: 'reviewType', required: true, enum: ReviewType, description: 'Type of review to check' })
  @ApiQuery({ name: 'revieweeId', required: false, description: 'Reviewee ID (required for user-to-user reviews)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review eligibility checked successfully',
    schema: {
      type: 'object',
      properties: {
        canReview: { type: 'boolean' },
        reason: { type: 'string', required: false }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Request not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async canUserReview(
    @Param('requestId') requestId: string,
    @Query('reviewType') reviewType: ReviewType,
    @Query('revieweeId') revieweeId: string,
    @Request() req: any
  ) {
    return this.reviewsService.canUserReview(requestId, req.user, reviewType, revieweeId);
  }

  @Put(':reviewId')
  @ApiOperation({ 
    summary: 'Update a review',
    description: 'Update an existing review (only by the original reviewer)'
  })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review updated successfully',
    type: ReviewResponseDto
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Not authorized to update this review' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body(ValidationPipe) updateReviewDto: UpdateReviewDto,
    @Request() req: any
  ) {
    return this.reviewsService.updateReview(reviewId, updateReviewDto, req.user);
  }

  @Delete(':reviewId')
  @ApiOperation({ 
    summary: 'Delete a review',
    description: 'Soft delete a review (only by the original reviewer)'
  })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Not authorized to delete this review' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  async deleteReview(
    @Param('reviewId') reviewId: string,
    @Request() req: any
  ) {
    return this.reviewsService.deleteReview(reviewId, req.user);
  }
}
