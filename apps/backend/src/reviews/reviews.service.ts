import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument, ReviewType, ReviewerRole } from '../schemas/review.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { PatientRequest, PatientRequestDocument, RequestStatus } from '../schemas/patient-request.schema';
import { CreateReviewDto, UpdateReviewDto, GetReviewsQueryDto } from '../dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PatientRequest.name) private requestModel: Model<PatientRequestDocument>,
  ) {}

  async createReview(createReviewDto: CreateReviewDto, user: UserDocument) {
    const { requestId, revieweeId, reviewType, rating, feedback } = createReviewDto;

    // Verify the request exists and is completed
    const request = await this.requestModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== RequestStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed requests');
    }

    // Verify user is part of this request
    const isPatient = request.patientId.equals(user._id);
    const isNurse = request.nurseId && request.nurseId.equals(user._id);
    
    if (!isPatient && !isNurse) {
      throw new ForbiddenException('You can only review requests you were involved in');
    }

    const reviewerRole = isPatient ? ReviewerRole.PATIENT : ReviewerRole.NURSE;

    // Validate review type and reviewee
    if (reviewType === ReviewType.USER_TO_USER) {
      if (!revieweeId) {
        throw new BadRequestException('Reviewee ID is required for user-to-user reviews');
      }

      // Verify reviewee is the other party in the request
      const expectedRevieweeId = isPatient ? request.nurseId : request.patientId;
      if (!expectedRevieweeId || !expectedRevieweeId.equals(revieweeId)) {
        throw new BadRequestException('Invalid reviewee for this request');
      }

      // Verify reviewee exists
      const reviewee = await this.userModel.findById(revieweeId).exec();
      if (!reviewee) {
        throw new NotFoundException('Reviewee not found');
      }
    } else if (reviewType === ReviewType.SERVICE_REVIEW) {
      if (revieweeId) {
        throw new BadRequestException('Reviewee ID should not be provided for service reviews');
      }
    }

    // Check for duplicate reviews (prevent same user from reviewing same request/reviewee/type combination)
    const duplicateQuery: any = {
      requestId,
      reviewerId: user._id,
      reviewType,
    };

    if (reviewType === ReviewType.USER_TO_USER) {
      duplicateQuery.revieweeId = revieweeId;
    }

    const existingReview = await this.reviewModel.findOne(duplicateQuery).exec();
    if (existingReview) {
      throw new BadRequestException('You have already submitted this type of review for this request');
    }

    // Create the review
    const reviewData: any = {
      requestId,
      reviewerId: user._id,
      reviewerRole,
      reviewType,
      rating,
      feedback,
    };

    if (reviewType === ReviewType.USER_TO_USER) {
      reviewData.revieweeId = revieweeId;
    }

    const review = await this.reviewModel.create(reviewData);

    return this.formatReviewResponse(review);
  }

  async updateReview(reviewId: string, updateReviewDto: UpdateReviewDto, user: UserDocument) {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the reviewer can update their own review
    if (!review.reviewerId.equals(user._id)) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Update the review
    const updateData: any = {};
    if (updateReviewDto.rating !== undefined) {
      updateData.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.feedback !== undefined) {
      updateData.feedback = updateReviewDto.feedback;
    }

    const updatedReview = await this.reviewModel.findByIdAndUpdate(
      reviewId,
      updateData,
      { new: true }
    ).exec();

    return this.formatReviewResponse(updatedReview!);
  }

  async deleteReview(reviewId: string, user: UserDocument) {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the reviewer can delete their own review
    if (!review.reviewerId.equals(user._id)) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // Soft delete by setting isActive to false
    await this.reviewModel.findByIdAndUpdate(reviewId, { isActive: false }).exec();
    
    return { message: 'Review deleted successfully' };
  }

  async getReviews(query: GetReviewsQueryDto, user?: UserDocument) {
    const { requestId, reviewerId, revieweeId, reviewType, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Build query
    const searchQuery: any = {};
    if (requestId) searchQuery.requestId = requestId;
    if (reviewerId) searchQuery.reviewerId = reviewerId;
    if (revieweeId) searchQuery.revieweeId = revieweeId;
    if (reviewType) searchQuery.reviewType = reviewType;

    // Only show active reviews
    searchQuery.isActive = true;

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(searchQuery)
        .populate('reviewer', 'name email')
        .populate('reviewee', 'name email')
        .populate('request', 'title serviceType scheduledDate')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(searchQuery).exec()
    ]);

    return {
      reviews: reviews.map(review => this.formatReviewResponse(review)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getReviewsByRequest(requestId: string, user?: UserDocument) {
    const request = await this.requestModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Get all reviews for this request
    const reviews = await this.reviewModel
      .find({ requestId, isActive: true })
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .sort({ submittedAt: -1 })
      .exec();

    return reviews.map(review => this.formatReviewResponse(review));
  }

  async getReviewStats(userId: string, reviewType?: ReviewType) {
    const query: any = { revieweeId: userId, isActive: true };
    if (reviewType) {
      query.reviewType = reviewType;
    }

    const reviews = await this.reviewModel.find(query).exec();
    
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews: reviews.length,
      ratingDistribution
    };
  }

  async canUserReview(requestId: string, user: UserDocument, reviewType: ReviewType, revieweeId?: string) {
    // Check if request exists and is completed
    const request = await this.requestModel.findById(requestId).exec();
    if (!request || request.status !== RequestStatus.COMPLETED) {
      return { canReview: false, reason: 'Request not found or not completed' };
    }

    // Check if user is part of this request
    const isPatient = request.patientId.equals(user._id);
    const isNurse = request.nurseId && request.nurseId.equals(user._id);
    
    if (!isPatient && !isNurse) {
      return { canReview: false, reason: 'You were not involved in this request' };
    }

    // Check for existing review
    const duplicateQuery: any = {
      requestId,
      reviewerId: user._id,
      reviewType,
    };

    if (reviewType === ReviewType.USER_TO_USER && revieweeId) {
      duplicateQuery.revieweeId = revieweeId;
    }

    const existingReview = await this.reviewModel.findOne(duplicateQuery).exec();
    if (existingReview) {
      return { canReview: false, reason: 'You have already submitted this type of review for this request' };
    }

    return { canReview: true };
  }

  private formatReviewResponse(review: ReviewDocument): any {
    return {
      id: review._id.toString(),
      requestId: review.requestId.toString(),
      reviewerId: review.reviewerId.toString(),
      reviewerRole: review.reviewerRole,
      revieweeId: review.revieweeId?.toString(),
      reviewType: review.reviewType,
      rating: review.rating,
      feedback: review.feedback,
      submittedAt: review.submittedAt,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      reviewer: (review as any).reviewer,
      reviewee: (review as any).reviewee,
      request: (review as any).request,
    };
  }
}
