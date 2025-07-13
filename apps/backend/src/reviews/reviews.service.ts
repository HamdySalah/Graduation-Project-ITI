import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { PatientRequest, PatientRequestDocument, RequestStatus } from '../schemas/patient-request.schema';
import { NurseProfile, NurseProfileDocument } from '../schemas/nurse-profile.schema';
import { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PatientRequest.name) private requestModel: Model<PatientRequestDocument>,
    @InjectModel(NurseProfile.name) private nurseProfileModel: Model<NurseProfileDocument>,
  ) {}

  async createReview(createReviewDto: CreateReviewDto, patient: UserDocument) {
    const { requestId, nurseId, rating, comment, aspectRatings, wouldRecommend } = createReviewDto;

    // Verify the request exists and is completed
    const request = await this.requestModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== RequestStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed requests');
    }

    if (!request.patientId.equals(patient._id)) {
      throw new ForbiddenException('You can only review your own requests');
    }

    if (!request.nurseId || !request.nurseId.equals(nurseId)) {
      throw new BadRequestException('Nurse ID does not match the request');
    }

    // Check if review already exists for this request
    const existingReview = await this.reviewModel.findOne({ requestId }).exec();
    if (existingReview) {
      throw new BadRequestException('Review already exists for this request');
    }

    // Verify nurse exists
    const nurse = await this.userModel.findById(nurseId).exec();
    if (!nurse || nurse.role !== UserRole.NURSE) {
      throw new NotFoundException('Nurse not found');
    }

    // Create the review
    const review = await this.reviewModel.create({
      patientId: patient._id,
      nurseId,
      requestId,
      rating,
      comment,
      aspectRatings,
      wouldRecommend
    });

    // Update nurse's rating statistics
    await this.updateNurseRatingStats(nurseId);

    // Populate and return the review
    return this.reviewModel
      .findById(review._id)
      .populate('patient', 'name profileImage')
      .populate('nurse', 'name profileImage')
      .populate('request', 'title serviceType scheduledDate')
      .exec();
  }

  async getNurseReviews(nurseId: string, options: {
    page: number;
    limit: number;
    minRating?: number;
  }) {
    const { page, limit, minRating } = options;

    // Verify nurse exists
    const nurse = await this.userModel.findById(nurseId).exec();
    if (!nurse || nurse.role !== UserRole.NURSE) {
      throw new NotFoundException('Nurse not found');
    }

    // Build query
    const query: any = { nurseId };
    if (minRating) {
      query.rating = { $gte: minRating };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get reviews with pagination
    const reviews = await this.reviewModel
      .find(query)
      .populate('patient', 'name profileImage')
      .populate('request', 'title serviceType scheduledDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Get total count
    const totalReviews = await this.reviewModel.countDocuments(query).exec();
    const totalPages = Math.ceil(totalReviews / limit);

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    };
  }

  async getPatientReviews(patientId: string, options: {
    page: number;
    limit: number;
  }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const reviews = await this.reviewModel
      .find({ patientId })
      .populate('nurse', 'name profileImage')
      .populate('request', 'title serviceType scheduledDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalReviews = await this.reviewModel.countDocuments({ patientId }).exec();
    const totalPages = Math.ceil(totalReviews / limit);

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    };
  }

  async getNurseReviewStats(nurseId: string) {
    // Verify nurse exists
    const nurse = await this.userModel.findById(nurseId).exec();
    if (!nurse || nurse.role !== UserRole.NURSE) {
      throw new NotFoundException('Nurse not found');
    }

    // Get aggregated statistics
    const stats = await this.reviewModel.aggregate([
      { $match: { nurseId: nurse._id } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          },
          averageAspectRatings: {
            $avg: {
              professionalism: '$aspectRatings.professionalism',
              punctuality: '$aspectRatings.punctuality',
              communication: '$aspectRatings.communication',
              skillLevel: '$aspectRatings.skillLevel'
            }
          },
          recommendationRate: {
            $avg: { $cond: ['$wouldRecommend', 1, 0] }
          }
        }
      }
    ]).exec();

    if (!stats.length) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageAspectRatings: null,
        recommendationRate: 0
      };
    }

    const stat = stats[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stat.ratingDistribution.forEach((rating: number) => {
      distribution[rating]++;
    });

    return {
      totalReviews: stat.totalReviews,
      averageRating: Math.round(stat.averageRating * 10) / 10,
      ratingDistribution: distribution,
      averageAspectRatings: stat.averageAspectRatings,
      recommendationRate: Math.round(stat.recommendationRate * 100)
    };
  }

  async updateReview(reviewId: string, updateReviewDto: UpdateReviewDto, patient: UserDocument) {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!review.patientId.equals(patient._id)) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Check if review is within update window (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (review.createdAt < thirtyDaysAgo) {
      throw new BadRequestException('Reviews can only be updated within 30 days of creation');
    }

    // Update the review
    Object.assign(review, updateReviewDto);
    await review.save();

    // Update nurse's rating statistics
    await this.updateNurseRatingStats(review.nurseId);

    return this.reviewModel
      .findById(review._id)
      .populate('patient', 'name profileImage')
      .populate('nurse', 'name profileImage')
      .populate('request', 'title serviceType scheduledDate')
      .exec();
  }

  async deleteReview(reviewId: string, patient: UserDocument) {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!review.patientId.equals(patient._id)) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // Check if review is within deletion window (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (review.createdAt < thirtyDaysAgo) {
      throw new BadRequestException('Reviews can only be deleted within 30 days of creation');
    }

    const nurseId = review.nurseId;
    await this.reviewModel.findByIdAndDelete(reviewId).exec();

    // Update nurse's rating statistics
    await this.updateNurseRatingStats(nurseId);

    return { message: 'Review deleted successfully' };
  }

  async getPendingReviews(patientId: string) {
    // Get completed requests that don't have reviews yet
    const completedRequests = await this.requestModel
      .find({
        patientId,
        status: RequestStatus.COMPLETED,
        nurseId: { $exists: true }
      })
      .populate('nurseId', 'name profileImage')
      .sort({ completedAt: -1 })
      .exec();

    // Filter out requests that already have reviews
    const reviewedRequestIds = await this.reviewModel
      .find({ patientId })
      .distinct('requestId')
      .exec();

    const pendingReviews = completedRequests.filter(
      request => !reviewedRequestIds.some(id => id.equals(request._id))
    );

    return pendingReviews.map(request => ({
      requestId: request._id,
      title: request.title,
      serviceType: request.serviceType,
      scheduledDate: request.scheduledDate,
      completedAt: request.completedAt,
      nurse: request.nurseId
    }));
  }

  private async updateNurseRatingStats(nurseId: any) {
    const stats = await this.reviewModel.aggregate([
      { $match: { nurseId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]).exec();

    const nurseProfile = await this.nurseProfileModel.findOne({ userId: nurseId }).exec();
    if (nurseProfile && stats.length > 0) {
      nurseProfile.totalReviews = stats[0].totalReviews;
      nurseProfile.rating = Math.round(stats[0].averageRating * 10) / 10;
      await nurseProfile.save();
    }
  }
}
