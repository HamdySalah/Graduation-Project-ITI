import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, UserStatus } from '../schemas/user.schema';
import { NurseProfile, NurseProfileDocument } from '../schemas/nurse-profile.schema';
import { PatientRequest, PatientRequestDocument } from '../schemas/patient-request.schema';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(NurseProfile.name) private nurseProfileModel: Model<NurseProfileDocument>,
    @InjectModel(PatientRequest.name) private requestModel: Model<PatientRequestDocument>,
  ) {}

  async getAllUsers(filters: {
    role?: UserRole;
    status?: string;
    page: number;
    limit: number;
    search?: string;
  }) {
    const { role, status, page, limit, search } = filters;
    
    // Build query
    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get users with pagination
    const users = await this.userModel
      .find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Get total count for pagination
    const totalUsers = await this.userModel.countDocuments(query).exec();
    const totalPages = Math.ceil(totalUsers / limit);

    // Enhance user data with additional info
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        
        if (user.role === UserRole.NURSE) {
          const nurseProfile = await this.nurseProfileModel
            .findOne({ userId: user._id })
            .exec();
          
          if (nurseProfile) {
            userObj.nurseProfile = {
              licenseNumber: nurseProfile.licenseNumber,
              specializations: nurseProfile.specializations,
              rating: nurseProfile.rating,
              totalReviews: nurseProfile.totalReviews,
              isAvailable: nurseProfile.isAvailable,
              hourlyRate: nurseProfile.hourlyRate,
            };
          }
        }

        // Get request statistics
        if (user.role === UserRole.PATIENT) {
          const requestCount = await this.requestModel.countDocuments({ patientId: user._id }).exec();
          userObj.requestCount = requestCount;
        } else if (user.role === UserRole.NURSE) {
          const completedJobs = await this.requestModel.countDocuments({ 
            nurseId: user._id, 
            status: 'completed' 
          }).exec();
          userObj.completedJobs = completedJobs;
        }

        return userObj;
      })
    );

    return {
      users: enhancedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        role,
        status,
        search,
      }
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile: any = user.toObject();

    // Add role-specific data
    if (user.role === UserRole.NURSE) {
      const nurseProfile = await this.nurseProfileModel
        .findOne({ userId: user._id })
        .exec();
      
      if (nurseProfile) {
        profile.nurseProfile = nurseProfile.toObject();
      }

      // Get nurse statistics
      const stats = await this.getNurseStats(user._id);
      profile.statistics = stats;

    } else if (user.role === UserRole.PATIENT) {
      // Get patient statistics
      const stats = await this.getPatientStats(user._id);
      profile.statistics = stats;
    }

    // Get recent activity
    profile.recentActivity = await this.getUserRecentActivity(user._id, user.role);

    return profile;
  }

  async updateUser(userId: string, updateData: any) {
    const user = await this.userModel.findById(userId).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for email conflicts if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userModel.findOne({ 
        email: updateData.email,
        _id: { $ne: userId }
      }).exec();
      
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Separate nurse profile data from user data
    const { nurseData, coordinates, ...userData } = updateData;

    // Update location if coordinates provided
    if (coordinates) {
      userData.location = {
        type: 'Point',
        coordinates: coordinates,
      };
    }

    // Update user data
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, userData, { new: true })
      .select('-password')
      .exec();

    // Update nurse profile if user is a nurse and nurse data provided
    if (user.role === UserRole.NURSE && nurseData) {
      await this.nurseProfileModel
        .findOneAndUpdate(
          { userId: user._id },
          nurseData,
          { new: true, upsert: true }
        )
        .exec();
    }

    return {
      message: 'User updated successfully',
      user: updatedUser,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has active requests
    const activeRequests = await this.requestModel.countDocuments({
      $or: [
        { patientId: userId, status: { $in: ['pending', 'accepted'] } },
        { nurseId: userId, status: { $in: ['pending', 'accepted'] } }
      ]
    }).exec();

    if (activeRequests > 0) {
      throw new BadRequestException('Cannot delete user with active requests');
    }

    // Delete user and related data
    await this.userModel.findByIdAndDelete(userId).exec();
    
    if (user.role === UserRole.NURSE) {
      await this.nurseProfileModel.findOneAndDelete({ userId }).exec();
    }

    return {
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  async updateUserStatus(userId: string, status: string, reason?: string) {
    const user = await this.userModel.findById(userId).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate status
    const validStatuses = ['pending', 'verified', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    user.status = status as UserStatus;
    await user.save();

    // Update nurse profile if applicable
    if (user.role === UserRole.NURSE && status === 'verified') {
      await this.nurseProfileModel
        .findOneAndUpdate(
          { userId: user._id },
          { 
            verifiedAt: new Date(),
            // verifiedBy: adminUserId, // TODO: Add admin user ID
          }
        )
        .exec();
    }

    return {
      message: `User status updated to ${status}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
      reason,
    };
  }

  async suspendUser(userId: string, reason: string, duration?: number) {
    const user = await this.userModel.findById(userId).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = UserStatus.SUSPENDED;
    await user.save();

    // TODO: Implement suspension duration logic
    // TODO: Cancel active requests if necessary

    return {
      message: 'User suspended successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
      suspension: {
        reason,
        duration,
        suspendedAt: new Date(),
      }
    };
  }

  async reactivateUser(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.SUSPENDED) {
      throw new BadRequestException('User is not suspended');
    }

    user.status = UserStatus.VERIFIED;
    await user.save();

    return {
      message: 'User reactivated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
      reactivatedAt: new Date(),
    };
  }

  async getUserStats() {
    const totalUsers = await this.userModel.countDocuments().exec();
    
    const usersByRole = await this.userModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).exec();

    const usersByStatus = await this.userModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).exec();

    // Get registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await this.userModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    }).exec();

    const registrationTrends = await this.userModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]).exec();

    return {
      overview: {
        totalUsers,
        recentRegistrations,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        usersByStatus: usersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      trends: {
        registrations: registrationTrends,
      }
    };
  }

  private async getNurseStats(nurseId: any) {
    const totalJobs = await this.requestModel.countDocuments({ nurseId }).exec();
    const completedJobs = await this.requestModel.countDocuments({
      nurseId,
      status: 'completed'
    }).exec();
    const activeJobs = await this.requestModel.countDocuments({
      nurseId,
      status: 'accepted'
    }).exec();

    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    return {
      totalJobs,
      completedJobs,
      activeJobs,
      completionRate,
      // TODO: Add earnings, ratings, etc.
    };
  }

  private async getPatientStats(patientId: any) {
    const totalRequests = await this.requestModel.countDocuments({ patientId }).exec();
    const completedRequests = await this.requestModel.countDocuments({
      patientId,
      status: 'completed'
    }).exec();
    const activeRequests = await this.requestModel.countDocuments({
      patientId,
      status: { $in: ['pending', 'accepted'] }
    }).exec();

    const successRate = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

    return {
      totalRequests,
      completedRequests,
      activeRequests,
      successRate,
      // TODO: Add spending, ratings given, etc.
    };
  }

  private async getUserRecentActivity(userId: any, role: UserRole) {
    const activities: any[] = [];

    if (role === UserRole.PATIENT) {
      const recentRequests = await this.requestModel
        .find({ patientId: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('nurseId', 'name')
        .exec();

      activities.push(...recentRequests.map(request => ({
        type: 'request',
        action: `Request ${request.status}`,
        description: request.title,
        timestamp: request.createdAt,
        details: {
          requestId: request._id,
          status: request.status,
          nurse: request.nurseId ? (request.nurseId as any).name : null,
        }
      })));

    } else if (role === UserRole.NURSE) {
      const recentJobs = await this.requestModel
        .find({ nurseId: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('patientId', 'name')
        .exec();

      activities.push(...recentJobs.map(request => ({
        type: 'job',
        action: `Job ${request.status}`,
        description: request.title,
        timestamp: request.createdAt,
        details: {
          requestId: request._id,
          status: request.status,
          patient: (request.patientId as any).name,
        }
      })));
    }

    return activities;
  }
}