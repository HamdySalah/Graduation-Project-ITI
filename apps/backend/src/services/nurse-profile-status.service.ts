import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../schemas/user.schema';
import { NurseProfile, NurseProfileDocument, ProfileCompletionStatus } from '../schemas/nurse-profile.schema';
import { ProfileSubmission, ProfileSubmissionDocument, SubmissionStatus } from '../schemas/profile-submission.schema';

export interface NurseAccessStatus {
  canAccessPlatform: boolean;
  canAccessDashboard: boolean;
  canViewRequests: boolean;
  canCreateRequests: boolean;
  canAccessProfile: boolean;
  redirectTo?: string;
  reason?: string;
  profileCompletionStatus: ProfileCompletionStatus;
  currentStep?: number;
  nextRequiredAction?: string;
}

@Injectable()
export class NurseProfileStatusService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(NurseProfile.name) private nurseProfileModel: Model<NurseProfileDocument>,
    @InjectModel(ProfileSubmission.name) private profileSubmissionModel: Model<ProfileSubmissionDocument>,
  ) {}

  /**
   * Get comprehensive access status for a nurse
   */
  async getNurseAccessStatus(userId: string): Promise<NurseAccessStatus> {
    const user = await this.userModel.findById(userId);
    if (!user || user.role !== 'nurse') {
      throw new NotFoundException('Nurse not found');
    }

    // Get or create nurse profile
    let nurseProfile = await this.nurseProfileModel.findOne({ userId });
    if (!nurseProfile) {
      nurseProfile = new this.nurseProfileModel({
        userId,
        completionStatus: ProfileCompletionStatus.NOT_STARTED,
        step1Completed: false,
        step2Completed: false,
        step3Completed: false,
      });
      await nurseProfile.save();
    }

    // Check if profile is submitted and under review
    const submission = await this.profileSubmissionModel.findOne({ 
      userId,
      status: { $in: [SubmissionStatus.PENDING, SubmissionStatus.UNDER_REVIEW] }
    });

    return this.calculateAccessStatus(user, nurseProfile, submission);
  }

  /**
   * Calculate access permissions based on user status and profile completion
   */
  private calculateAccessStatus(
    user: UserDocument, 
    nurseProfile: NurseProfileDocument, 
    submission?: ProfileSubmissionDocument
  ): NurseAccessStatus {
    const baseStatus: NurseAccessStatus = {
      canAccessPlatform: false,
      canAccessDashboard: false,
      canViewRequests: false,
      canCreateRequests: false,
      canAccessProfile: true, // Always allow profile access
      profileCompletionStatus: nurseProfile.completionStatus || ProfileCompletionStatus.NOT_STARTED,
    };

    // If user is verified, grant full access
    if (user.status === UserStatus.VERIFIED) {
      return {
        ...baseStatus,
        canAccessPlatform: true,
        canAccessDashboard: true,
        canViewRequests: true,
        canCreateRequests: true,
        nextRequiredAction: 'none',
      };
    }

    // If user is rejected, deny all access
    if (user.status === UserStatus.REJECTED) {
      return {
        ...baseStatus,
        redirectTo: '/account-rejected',
        reason: 'Account has been rejected',
        nextRequiredAction: 'contact_support',
      };
    }

    // For pending users, check profile completion status
    switch (nurseProfile.completionStatus) {
      case ProfileCompletionStatus.NOT_STARTED:
        return {
          ...baseStatus,
          redirectTo: '/nurse-profile-complete',
          reason: 'Profile setup required',
          currentStep: 1,
          nextRequiredAction: 'complete_step_1',
        };

      case ProfileCompletionStatus.STEP_1_COMPLETED:
        return {
          ...baseStatus,
          redirectTo: '/nurse-profile-complete',
          reason: 'Profile setup incomplete',
          currentStep: 2,
          nextRequiredAction: 'complete_step_2',
        };

      case ProfileCompletionStatus.STEP_2_COMPLETED:
        return {
          ...baseStatus,
          redirectTo: '/nurse-profile-complete',
          reason: 'Profile setup incomplete',
          currentStep: 3,
          nextRequiredAction: 'complete_step_3',
        };

      case ProfileCompletionStatus.STEP_3_COMPLETED:
        return {
          ...baseStatus,
          redirectTo: '/nurse-profile-complete',
          reason: 'Profile ready for submission',
          currentStep: 3,
          nextRequiredAction: 'submit_profile',
        };

      case ProfileCompletionStatus.SUBMITTED:
        // Check if there's an active submission
        if (submission) {
          return {
            ...baseStatus,
            redirectTo: '/verification-pending',
            reason: 'Profile under admin review',
            nextRequiredAction: 'wait_for_approval',
          };
        } else {
          // Submission might have been processed, check user status
          return {
            ...baseStatus,
            redirectTo: '/verification-pending',
            reason: 'Verification status unclear',
            nextRequiredAction: 'contact_support',
          };
        }

      case ProfileCompletionStatus.APPROVED:
        // This should match with user.status === 'verified', but handle edge case
        return {
          ...baseStatus,
          canAccessPlatform: true,
          canAccessDashboard: true,
          canViewRequests: true,
          canCreateRequests: true,
          nextRequiredAction: 'none',
        };

      case ProfileCompletionStatus.REJECTED:
        return {
          ...baseStatus,
          redirectTo: '/profile-rejected',
          reason: 'Profile was rejected',
          nextRequiredAction: 'resubmit_profile',
        };

      default:
        return {
          ...baseStatus,
          redirectTo: '/nurse-profile-complete',
          reason: 'Unknown profile status',
          currentStep: 1,
          nextRequiredAction: 'complete_profile',
        };
    }
  }

  /**
   * Check if nurse can access a specific feature
   */
  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    const status = await this.getNurseAccessStatus(userId);
    
    switch (feature) {
      case 'dashboard':
        return status.canAccessDashboard;
      case 'requests':
        return status.canViewRequests;
      case 'create_request':
        return status.canCreateRequests;
      case 'profile':
        return status.canAccessProfile;
      case 'platform':
        return status.canAccessPlatform;
      default:
        return false;
    }
  }

  /**
   * Get the next step in the profile completion process
   */
  async getNextStep(userId: string): Promise<number> {
    const nurseProfile = await this.nurseProfileModel.findOne({ userId });
    if (!nurseProfile) return 1;

    if (!nurseProfile.step1Completed) return 1;
    if (!nurseProfile.step2Completed) return 2;
    if (!nurseProfile.step3Completed) return 3;
    
    // All steps completed
    return 4; // Indicates ready for submission
  }

  /**
   * Update profile completion status
   */
  async updateProfileStatus(userId: string, status: ProfileCompletionStatus): Promise<void> {
    await this.nurseProfileModel.findOneAndUpdate(
      { userId },
      { 
        completionStatus: status,
        lastUpdated: new Date(),
      },
      { upsert: true }
    );
  }

  /**
   * Check if all profile steps are completed
   */
  async isProfileComplete(userId: string): Promise<boolean> {
    const nurseProfile = await this.nurseProfileModel.findOne({ userId });
    return nurseProfile?.step1Completed && 
           nurseProfile?.step2Completed && 
           nurseProfile?.step3Completed || false;
  }

  /**
   * Get profile completion percentage
   */
  async getCompletionPercentage(userId: string): Promise<number> {
    const nurseProfile = await this.nurseProfileModel.findOne({ userId });
    if (!nurseProfile) return 0;

    let completed = 0;
    if (nurseProfile.step1Completed) completed++;
    if (nurseProfile.step2Completed) completed++;
    if (nurseProfile.step3Completed) completed++;

    return Math.round((completed / 3) * 100);
  }

  /**
   * Get user-friendly status message
   */
  async getStatusMessage(userId: string): Promise<string> {
    const status = await this.getNurseAccessStatus(userId);
    
    switch (status.nextRequiredAction) {
      case 'complete_step_1':
        return 'Please complete your basic information to continue.';
      case 'complete_step_2':
        return 'Please upload your verification documents to continue.';
      case 'complete_step_3':
        return 'Please complete your professional profile to continue.';
      case 'submit_profile':
        return 'Your profile is ready! Please submit it for admin review.';
      case 'wait_for_approval':
        return 'Your profile is under review. You\'ll be notified once approved.';
      case 'contact_support':
        return 'Please contact support for assistance with your account.';
      case 'resubmit_profile':
        return 'Please update and resubmit your profile for review.';
      case 'none':
        return 'Welcome! You have full access to the platform.';
      default:
        return 'Please complete your profile setup to access the platform.';
    }
  }
}
