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
import { CreateReviewDto, UpdateReviewDto, ReviewResponseDto } from '../dto/review.dto';

@ApiTags('Reviews')
@Controller('api/reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Create a review for a nurse',
    description: 'Patients can create reviews for nurses after completed services'
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review created successfully',
    type: ReviewResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or review already exists for this request'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only patients can create reviews'
  })
  async createReview(
    @Body(ValidationPipe) createReviewDto: CreateReviewDto,
    @Request() req: any
  ) {
    return this.reviewsService.createReview(createReviewDto, req.user);
  }

  @Get('nurse/:nurseId')
  @ApiOperation({
    summary: 'Get reviews for a specific nurse',
    description: 'Retrieve all reviews for a nurse with pagination and filtering'
  })
  @ApiParam({
    name: 'nurseId',
    description: 'Nurse ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of reviews per page',
    required: false,
    example: 10
  })
  @ApiQuery({
    name: 'rating',
    description: 'Filter by minimum rating',
    required: false,
    example: 4
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews retrieved successfully'
  })
  @ApiNotFoundResponse({
    description: 'Nurse not found'
  })
  async getNurseReviews(
    @Param('nurseId') nurseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') minRating?: number
  ) {
    return this.reviewsService.getNurseReviews(nurseId, {
      page: page || 1,
      limit: limit || 10,
      minRating
    });
  }

  @Get('patient/my-reviews')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Get patient\'s own reviews',
    description: 'Retrieve all reviews written by the authenticated patient'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of reviews per page',
    required: false,
    example: 10
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patient reviews retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only patients can access their reviews'
  })
  async getPatientReviews(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.reviewsService.getPatientReviews(req.user._id, {
      page: page || 1,
      limit: limit || 10
    });
  }

  @Get('stats/nurse/:nurseId')
  @ApiOperation({
    summary: 'Get review statistics for a nurse',
    description: 'Get aggregated review statistics including average ratings and distribution'
  })
  @ApiParam({
    name: 'nurseId',
    description: 'Nurse ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review statistics retrieved successfully'
  })
  @ApiNotFoundResponse({
    description: 'Nurse not found'
  })
  async getNurseReviewStats(@Param('nurseId') nurseId: string) {
    return this.reviewsService.getNurseReviewStats(nurseId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Update a review',
    description: 'Patients can update their own reviews within 30 days'
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review updated successfully',
    type: ReviewResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or review cannot be updated'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only the review author can update the review'
  })
  @ApiNotFoundResponse({
    description: 'Review not found'
  })
  async updateReview(
    @Param('id') reviewId: string,
    @Body(ValidationPipe) updateReviewDto: UpdateReviewDto,
    @Request() req: any
  ) {
    return this.reviewsService.updateReview(reviewId, updateReviewDto, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Delete a review',
    description: 'Patients can delete their own reviews within 30 days'
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review deleted successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only the review author can delete the review'
  })
  @ApiNotFoundResponse({
    description: 'Review not found'
  })
  async deleteReview(@Param('id') reviewId: string, @Request() req: any) {
    return this.reviewsService.deleteReview(reviewId, req.user);
  }

  @Get('pending-reviews')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Get pending reviews for patient',
    description: 'Get completed requests that haven\'t been reviewed yet'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending reviews retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only patients can access pending reviews'
  })
  async getPendingReviews(@Request() req: any) {
    return this.reviewsService.getPendingReviews(req.user._id);
  }
}
