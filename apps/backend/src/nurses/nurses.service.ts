import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, UserStatus } from '../schemas/user.schema';
import { NurseProfile, NurseProfileDocument } from '../schemas/nurse-profile.schema';
import { PatientRequest, PatientRequestDocument } from '../schemas/patient-request.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { Application, ApplicationDocument } from '../schemas/application.schema';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { GetNearbyNursesDto } from '../dto/request.dto';

@Injectable()
export class NursesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(NurseProfile.name) private nurseProfileModel: Model<NurseProfileDocument>,
    @InjectModel(PatientRequest.name) private patientRequestModel: Model<PatientRequestDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async getNearbyNurses(getNearbyNursesDto: GetNearbyNursesDto) {
    const { latitude, longitude, radius = 10, specializations } = getNearbyNursesDto;

    // Build query for location
    const locationQuery: any = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude], // [longitude, latitude]
          },
          $maxDistance: radius * 1000, // Convert km to meters
        },
      },
      role: UserRole.NURSE,
      status: UserStatus.VERIFIED,
    };

    // Find nearby nurses
    const nurses = await this.userModel
      .find(locationQuery)
      .select('-password')
      .exec();

    // Get nurse profiles with specialization filter if provided
    const nurseIds = nurses.map(nurse => nurse._id);
    let nurseProfileQuery: any = { userId: { $in: nurseIds }, isAvailable: true };

    if (specializations && specializations.length > 0) {
      nurseProfileQuery.specializations = { $in: specializations };
    }

    const nurseProfiles = await this.nurseProfileModel
      .find(nurseProfileQuery)
      .populate('userId', '-password')
      .exec();

    // Combine user and profile data
    const result = nurseProfiles.map(profile => ({
      id: profile.userId._id,
      name: (profile.userId as any).name,
      email: (profile.userId as any).email,
      phone: (profile.userId as any).phone,
      location: (profile.userId as any).location,
      address: (profile.userId as any).address,
      profileImage: (profile.userId as any).profileImage,
      licenseNumber: profile.licenseNumber,
      yearsOfExperience: profile.yearsOfExperience,
      specializations: profile.specializations,
      education: profile.education,
      certifications: profile.certifications,
      rating: profile.rating,
      totalReviews: profile.totalReviews,
      completedJobs: profile.completedJobs,
      hourlyRate: profile.hourlyRate,
      bio: profile.bio,
      languages: profile.languages,
      isAvailable: profile.isAvailable,
    }));

    return result;
  }

  async verifyNurse(nurseId: string, adminUser: UserDocument) {
    // Check if admin has permission
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can verify nurses');
    }

    // Find the nurse
    const nurse = await this.userModel.findById(nurseId).exec();
    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    if (nurse.role !== UserRole.NURSE) {
      throw new ForbiddenException('User is not a nurse');
    }

    // Update nurse status
    nurse.status = UserStatus.VERIFIED;
    await nurse.save();

    // Update nurse profile
    try {
      const nurseProfile = await this.nurseProfileModel.findOne({ userId: nurseId }).exec();
      if (nurseProfile) {
        nurseProfile.verifiedAt = new Date();
        nurseProfile.verifiedBy = adminUser._id;
        await nurseProfile.save();
      }
    } catch (profileError) {
      console.error('Error updating nurse profile during verification:', profileError);
      // Don't fail the verification if profile update fails
      // The user is already verified in the main user record
    }

    // Send notification to nurse
    try {
      await this.notificationsService.notifyNurseApproved(nurseId);
    } catch (notificationError) {
      console.error('Failed to send nurse approval notification:', notificationError);
      // Don't fail the verification if notification fails
    }

    return {
      message: 'Nurse verified successfully',
      nurse: {
        id: nurse._id,
        name: nurse.name,
        email: nurse.email,
        status: nurse.status,
      },
    };
  }

  async getPendingNurses() {
    const pendingNurses = await this.userModel
      .find({ role: UserRole.NURSE, status: UserStatus.PENDING })
      .select('-password')
      .exec();

    const nurseIds = pendingNurses.map(nurse => nurse._id);
    const nurseProfiles = await this.nurseProfileModel
      .find({ userId: { $in: nurseIds } })
      .exec();

    // Create a map of profiles by userId for easier lookup
    const profileMap = new Map();
    nurseProfiles.forEach(profile => {
      profileMap.set(profile.userId.toString(), profile);
    });

    const result = pendingNurses.map(nurse => {
      const profile = profileMap.get(nurse._id.toString());

      return {
        id: nurse._id.toString(),
        name: nurse.name,
        email: nurse.email,
        phone: nurse.phone,
        location: nurse.location,
        address: nurse.address,
        status: nurse.status,
        createdAt: nurse.createdAt,

        // Profile data (if exists)
        ...(profile && {
          licenseNumber: profile.licenseNumber,
          yearsOfExperience: profile.yearsOfExperience,
          specializations: profile.specializations,
          education: profile.education,
          certifications: profile.certifications,
          documents: profile.documents,
          hourlyRate: profile.hourlyRate,
          bio: profile.bio,
          languages: profile.languages,
          completionStatus: profile.completionStatus,
          step1Completed: profile.step1Completed,
          step2Completed: profile.step2Completed,
          step3Completed: profile.step3Completed,
          submittedAt: profile.submittedAt,
        }),
      };
    });

    return result;
  }

  async getNurseById(nurseId: string) {
    console.log('🔍 getNurseById called with ID:', nurseId);

    // Find the nurse user
    const nurse = await this.userModel
      .findById(nurseId)
      .select('-password')
      .exec();

    console.log('🔍 Found nurse:', nurse ? 'Yes' : 'No');

    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    if (nurse.role !== UserRole.NURSE) {
      throw new NotFoundException('User is not a nurse');
    }

    // Get nurse profile
    const profile = await this.nurseProfileModel
      .findOne({ userId: nurse._id })
      .exec();

    // Build response object
    const nurseData = {
      id: nurse._id.toString(),
      name: nurse.name,
      email: nurse.email,
      phone: nurse.phone,
      location: nurse.location,
      address: nurse.address,
      status: nurse.status,
      createdAt: nurse.createdAt,
      profileImage: nurse.profileImage,

      // Profile data (if exists)
      ...(profile && {
        licenseNumber: profile.licenseNumber,
        yearsOfExperience: profile.yearsOfExperience,
        specializations: profile.specializations,
        education: profile.education,
        certifications: profile.certifications,
        documents: profile.documents,
        hourlyRate: profile.hourlyRate,
        bio: profile.bio,
        languages: profile.languages,
        rating: profile.rating,
        totalReviews: profile.totalReviews,
        completedJobs: profile.completedJobs,
        isAvailable: profile.isAvailable,
        completionStatus: profile.completionStatus,
        step1Completed: profile.step1Completed,
        step2Completed: profile.step2Completed,
        step3Completed: profile.step3Completed,
        submittedAt: profile.submittedAt,
        verifiedAt: profile.verifiedAt,
      }),
    };

    return {
      success: true,
      message: 'Nurse profile retrieved successfully',
      data: nurseData,
    };
  }

  async rejectNurse(nurseId: string, adminUser: UserDocument, rejectionReason?: string) {
    // Check if admin has permission
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can reject nurses');
    }

    // Find the nurse
    const nurse = await this.userModel.findById(nurseId).exec();
    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    if (nurse.role !== UserRole.NURSE) {
      throw new ForbiddenException('User is not a nurse');
    }

    // Update nurse status to rejected
    nurse.status = UserStatus.REJECTED;
    await nurse.save();

    // Update nurse profile with rejection details
    try {
      const nurseProfile = await this.nurseProfileModel.findOne({ userId: nurseId }).exec();
      if (nurseProfile) {
        nurseProfile.rejectedAt = new Date();
        nurseProfile.rejectedBy = adminUser._id;
        nurseProfile.rejectionReason = rejectionReason || 'No reason provided';
        await nurseProfile.save();
      }
    } catch (profileError) {
      console.error('Error updating nurse profile during rejection:', profileError);
      // Don't fail the rejection if profile update fails
      // The user is already rejected in the main user record
    }

    // Send notification to nurse
    try {
      await this.notificationsService.notifyNurseRejected(nurseId, rejectionReason);
    } catch (notificationError) {
      console.error('Failed to send nurse rejection notification:', notificationError);
      // Don't fail the rejection if notification fails
    }

    return {
      message: 'Nurse application rejected successfully',
      nurse: {
        id: nurse._id,
        name: nurse.name,
        email: nurse.email,
        status: nurse.status,
        rejectionReason: rejectionReason,
      },
    };
  }

  async toggleAvailability(user: UserDocument) {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException('Only nurses can toggle availability');
    }

    const nurseProfile = await this.nurseProfileModel.findOne({ userId: user._id }).exec();
    if (!nurseProfile) {
      throw new NotFoundException('Nurse profile not found');
    }

    nurseProfile.isAvailable = !nurseProfile.isAvailable;
    await nurseProfile.save();

    return {
      message: `Availability ${nurseProfile.isAvailable ? 'enabled' : 'disabled'} successfully`,
      isAvailable: nurseProfile.isAvailable,
    };
  }

  async getNurseStats(nurseId: string) {
    try {
      console.log('🎯 Getting nurse stats for ID:', nurseId);

      // Verify nurse exists
      const nurse = await this.userModel.findById(nurseId).exec();
      if (!nurse) {
        throw new NotFoundException('Nurse not found');
      }

      // Get completed applications for this nurse
      const completedApplications = await this.applicationModel
        .find({
          nurseId: nurseId,
          status: 'accepted'
        })
        .populate({
          path: 'requestId',
          match: { status: 'completed' }
        })
        .exec();

      // Filter out applications where the request is not completed
      const validCompletedApplications = completedApplications.filter(app => app.requestId);

      // Calculate total earnings (sum of prices from completed applications)
      const totalEarnings = validCompletedApplications.reduce((sum, app) => {
        return sum + (app.price || 0);
      }, 0);

      // Get review stats for this nurse
      const reviews = await this.reviewModel.find({ nurseId: nurseId }).exec();
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

      const stats = {
        completedRequests: validCompletedApplications.length,
        totalEarnings: totalEarnings,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews: totalReviews
      };

      console.log('📊 Nurse stats calculated:', stats);

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('❌ Error getting nurse stats:', error);
      throw error;
    }
  }
}
