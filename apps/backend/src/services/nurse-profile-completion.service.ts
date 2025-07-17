import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../schemas/user.schema';
import { NurseProfile, NurseProfileDocument, ProfileCompletionStatus } from '../schemas/nurse-profile.schema';
import { ProfileSubmission, ProfileSubmissionDocument, SubmissionStatus } from '../schemas/profile-submission.schema';
import { 
  Step1BasicInfoDto, 
  Step2VerificationDto, 
  Step3CompleteProfileDto,
  ProfileCompletionStatusDto,
  AdminReviewDto 
} from '../dto/nurse-profile-completion.dto';

@Injectable()
export class NurseProfileCompletionService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(NurseProfile.name) private nurseProfileModel: Model<NurseProfileDocument>,
    @InjectModel(ProfileSubmission.name) private profileSubmissionModel: Model<ProfileSubmissionDocument>,
  ) {}

  // Get current profile completion status
  async getProfileStatus(userId: string): Promise<ProfileCompletionStatusDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException(`User not found with ID: ${userId}`);
    }
    if (user.role !== 'nurse') {
      throw new BadRequestException(`User is not a nurse. Current role: ${user.role}, User ID: ${userId}, Email: ${user.email}`);
    }

    let nurseProfile = await this.nurseProfileModel.findOne({ userId });
    if (!nurseProfile) {
      // Create initial nurse profile if it doesn't exist
      nurseProfile = new this.nurseProfileModel({
        userId,
        completionStatus: ProfileCompletionStatus.NOT_STARTED,
        step1Completed: false,
        step2Completed: false,
        step3Completed: false,
      });
      await nurseProfile.save();
    }

    return {
      status: nurseProfile.completionStatus || ProfileCompletionStatus.NOT_STARTED,
      step1Completed: nurseProfile.step1Completed || false,
      step2Completed: nurseProfile.step2Completed || false,
      step3Completed: nurseProfile.step3Completed || false,
      submittedAt: nurseProfile.submittedAt?.toISOString(),
    };
  }

  // Step 1: Save basic information
  async saveStep1(userId: string, data: Step1BasicInfoDto): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user || user.role !== 'nurse') {
      throw new BadRequestException('User is not a nurse');
    }

    // Update user's basic information
    await this.userModel.findByIdAndUpdate(userId, {
      name: data.fullName,
      email: data.emailAddress,
    });

    // Update or create nurse profile (upsert)
    await this.nurseProfileModel.findOneAndUpdate(
      { userId },
      {
        fullName: data.fullName,
        emailAddress: data.emailAddress,
        step1Completed: true,
        step1CompletedAt: new Date(),
        completionStatus: ProfileCompletionStatus.STEP_1_COMPLETED,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  // Step 2: Save verification documents
  async saveStep2(userId: string, data: Step2VerificationDto): Promise<void> {
    // Use upsert so nurse profile is created if missing
    await this.nurseProfileModel.findOneAndUpdate(
      { userId },
      {
        licenseNumber: data.licenseNumber,
        licenseExpirationDate: new Date(data.licenseExpirationDate),
        licenseDocument: data.licenseDocument,
        backgroundCheckDocument: data.backgroundCheckDocument,
        resumeDocument: data.resumeDocument,
        step2Completed: true,
        step2CompletedAt: new Date(),
        completionStatus: ProfileCompletionStatus.STEP_2_COMPLETED,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  // Step 3: Save complete profile
  async saveStep3(userId: string, data: Step3CompleteProfileDto): Promise<void> {
    const nurseProfile = await this.nurseProfileModel.findOne({ userId });
    if (!nurseProfile) {
      throw new NotFoundException('Nurse profile not found');
    }

    if (!nurseProfile.step1Completed || !nurseProfile.step2Completed) {
      throw new BadRequestException('Previous steps must be completed first');
    }

    await this.nurseProfileModel.findOneAndUpdate(
      { userId },
      {
        certificationName: data.certificationName,
        issuingOrganization: data.issuingOrganization,
        certificationLicenseNumber: data.certificationLicenseNumber,
        certificationExpirationDate: data.certificationExpirationDate ? new Date(data.certificationExpirationDate) : undefined,
        skills: data.skills,
        workExperience: data.workExperience,
        institutionName: data.institutionName,
        degree: data.degree,
        graduationDate: data.graduationDate ? new Date(data.graduationDate) : undefined,
        additionalDocuments: data.additionalDocuments,
        step3Completed: true,
        step3CompletedAt: new Date(),
        completionStatus: ProfileCompletionStatus.STEP_3_COMPLETED,
        lastUpdated: new Date(),
      }
    );
  }

  // Submit profile for admin review
  async submitProfile(userId: string): Promise<void> {
    const nurseProfile = await this.nurseProfileModel.findOne({ userId });
    if (!nurseProfile) {
      throw new NotFoundException('Nurse profile not found');
    }

    if (!nurseProfile.step1Completed || !nurseProfile.step2Completed || !nurseProfile.step3Completed) {
      throw new BadRequestException('All steps must be completed before submission');
    }

    // Update profile status
    await this.nurseProfileModel.findOneAndUpdate(
      { userId },
      {
        completionStatus: ProfileCompletionStatus.SUBMITTED,
        submittedAt: new Date(),
        lastUpdated: new Date(),
      }
    );

    // Update user status to pending
    await this.userModel.findByIdAndUpdate(userId, {
      status: UserStatus.PENDING,
    });

    // Create submission record for admin review
    const submission = new this.profileSubmissionModel({
      userId,
      nurseProfileId: nurseProfile._id,
      status: SubmissionStatus.PENDING,
      submittedAt: new Date(),
      adminNotified: false,
      nurseNotified: false,
      priority: 'normal',
      actionHistory: [],
    });

    await submission.save();
  }

  // Get profile data for a specific step
  async getStepData(userId: string, step: number): Promise<any> {
    const nurseProfile = await this.nurseProfileModel.findOne({ userId });
    if (!nurseProfile) {
      throw new NotFoundException('Nurse profile not found');
    }

    switch (step) {
      case 1:
        return {
          fullName: nurseProfile.fullName,
          emailAddress: nurseProfile.emailAddress,
        };
      case 2:
        return {
          licenseNumber: nurseProfile.licenseNumber,
          licenseExpirationDate: nurseProfile.licenseExpirationDate,
          licenseDocument: nurseProfile.licenseDocument,
          backgroundCheckDocument: nurseProfile.backgroundCheckDocument,
          resumeDocument: nurseProfile.resumeDocument,
        };
      case 3:
        return {
          certificationName: nurseProfile.certificationName,
          issuingOrganization: nurseProfile.issuingOrganization,
          certificationLicenseNumber: nurseProfile.certificationLicenseNumber,
          certificationExpirationDate: nurseProfile.certificationExpirationDate,
          skills: nurseProfile.skills,
          workExperience: nurseProfile.workExperience,
          institutionName: nurseProfile.institutionName,
          degree: nurseProfile.degree,
          graduationDate: nurseProfile.graduationDate,
          additionalDocuments: nurseProfile.additionalDocuments,
        };
      default:
        throw new BadRequestException('Invalid step number');
    }
  }

  // Check if user can access a specific step
  async canAccessStep(userId: string, step: number): Promise<boolean> {
    const status = await this.getProfileStatus(userId);
    
    switch (step) {
      case 1:
        return true; // Always can access step 1
      case 2:
        return status.step1Completed;
      case 3:
        return status.step1Completed && status.step2Completed;
      default:
        return false;
    }
  }
}
