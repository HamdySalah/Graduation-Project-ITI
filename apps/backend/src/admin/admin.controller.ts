import { Controller, Get, Post, Put, Param, Request, Body, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse
} from '@nestjs/swagger';
import { NursesService } from '../nurses/nurses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { PatientRequest } from '../schemas/patient-request.schema';
import { NurseProfile } from '../schemas/nurse-profile.schema';

@ApiTags('Admin')
@Controller('api/admin')
// @UseGuards(JwtAuthGuard)
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(
    private readonly nursesService: NursesService,
    @InjectModel(User.name) private userModel: Model<any>,
    @InjectModel(PatientRequest.name) private requestModel: Model<any>,
    @InjectModel(NurseProfile.name) private nurseProfileModel: Model<any>,
  ) {}

  @Get('pending-nurses')
  @ApiOperation({
    summary: 'Get pending nurse verifications (Admin only)',
    description: 'Retrieve a list of nurses waiting for verification'
  })
  @ApiResponse({
    status: 200,
    description: 'Pending nurses retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Jane Smith' },
          email: { type: 'string', example: 'jane.smith@example.com' },
          phone: { type: 'string', example: '+1234567890' },
          licenseNumber: { type: 'string', example: 'NL123456789' },
          yearsOfExperience: { type: 'number', example: 5 },
          specializations: { type: 'array', items: { type: 'string' } },
          education: { type: 'string', example: 'Bachelor of Science in Nursing' },
          certifications: { type: 'array', items: { type: 'string' } },
          documents: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only admins can access this endpoint'
  })
  async getPendingNurses() {
    return this.nursesService.getPendingNurses();
  }

  @Post('verify-nurse/:nurseId')
  @ApiOperation({
    summary: 'Verify a nurse (Admin only)',
    description: 'Approve a nurse for the platform'
  })
  @ApiParam({
    name: 'nurseId',
    description: 'ID of the nurse to verify',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Nurse verified successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only admins can verify nurses'
  })
  async verifyNurse(@Param('nurseId') nurseId: string, @Request() req: any) {
    // For now, create a mock admin user since we removed auth
    const mockAdmin = { role: 'admin', _id: 'admin-id' };
    return this.nursesService.verifyNurse(nurseId, mockAdmin as any);
  }

  @Post('reject-nurse/:nurseId')
  @ApiOperation({
    summary: 'Reject a nurse (Admin only)',
    description: 'Reject a nurse application'
  })
  @ApiParam({
    name: 'nurseId',
    description: 'ID of the nurse to reject',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Nurse rejected successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only admins can reject nurses'
  })
  async rejectNurse(@Param('nurseId') nurseId: string, @Request() req: any) {
    // For now, create a mock admin user since we removed auth
    const mockAdmin = { role: 'admin', _id: 'admin-id' };
    return this.nursesService.rejectNurse(nurseId, mockAdmin as any);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get admin dashboard statistics (Admin only)',
    description: 'Retrieve comprehensive statistics for the admin dashboard'
  })
  @ApiResponse({
    status: 200,
    description: 'Admin statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 150 },
        totalPatients: { type: 'number', example: 100 },
        totalNurses: { type: 'number', example: 45 },
        verifiedNurses: { type: 'number', example: 40 },
        pendingNurses: { type: 'number', example: 5 },
        totalRequests: { type: 'number', example: 75 },
        pendingRequests: { type: 'number', example: 10 },
        completedRequests: { type: 'number', example: 50 },
        cancelledRequests: { type: 'number', example: 15 },
        monthlyGrowth: {
          type: 'object',
          properties: {
            users: { type: 'number', example: 12 },
            requests: { type: 'number', example: 8 }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only admins can access this endpoint'
  })
  async getAdminStats() {
    // Dynamic admin statistics
    const [
      totalUsers,
      totalPatients,
      totalNurses,
      verifiedNurses,
      pendingNurses,
      totalRequests,
      pendingRequests,
      completedRequests,
      cancelledRequests
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ role: 'patient' }).exec(),
      this.userModel.countDocuments({ role: 'nurse' }).exec(),
      this.userModel.countDocuments({ role: 'nurse', status: 'verified' }).exec(),
      this.userModel.countDocuments({ role: 'nurse', status: 'pending' }).exec(),
      this.requestModel.countDocuments().exec(),
      this.requestModel.countDocuments({ status: 'pending' }).exec(),
      this.requestModel.countDocuments({ status: 'completed' }).exec(),
      this.requestModel.countDocuments({ status: 'cancelled' }).exec(),
    ]);

    // Calculate monthly growth (users and requests in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [usersLastMonth, requestsLastMonth] = await Promise.all([
      this.userModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }).exec(),
      this.requestModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }).exec(),
    ]);

    return {
      totalUsers,
      totalPatients,
      totalNurses,
      verifiedNurses,
      pendingNurses,
      totalRequests,
      pendingRequests,
      completedRequests,
      cancelledRequests,
      monthlyGrowth: {
        users: usersLastMonth,
        requests: requestsLastMonth,
      },
    };
  }

  @Get('users')
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description: 'Retrieve all users for admin dashboard'
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully'
  })
  async getAllUsers() {
    try {
      const users = await this.userModel.find({}).select('-password').exec();
      console.log(`Found ${users.length} users in database`);
      return {
        success: true,
        data: users,
        total: users.length
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get comprehensive analytics data (Admin only)',
    description: 'Retrieve detailed analytics including user growth, revenue, top nurses, and geographic data'
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully'
  })
  async getAnalytics() {
    // Get date ranges for analytics
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // User growth data (last 6 months)
    const userGrowthData = await this.getUserGrowthData(sixMonthsAgo, now);

    // Request statistics
    const requestStats = await this.getRequestStats();

    // Revenue data (mock for now - would need payment integration)
    const revenueData = await this.getRevenueData();

    // Top performing nurses
    const topNurses = await this.getTopNurses();

    // Geographic distribution
    const geographicData = await this.getGeographicData();

    return {
      userGrowth: userGrowthData,
      requestStats,
      revenueData,
      topNurses,
      geographicData
    };
  }

  private async getUserGrowthData(startDate: Date, endDate: Date) {
    const months = [];
    const patients = [];
    const nurses = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthName);

      const [patientCount, nurseCount] = await Promise.all([
        this.userModel.countDocuments({
          role: 'patient',
          createdAt: { $gte: monthStart, $lt: monthEnd }
        }).exec(),
        this.userModel.countDocuments({
          role: 'nurse',
          createdAt: { $gte: monthStart, $lt: monthEnd }
        }).exec()
      ]);

      patients.push(patientCount);
      nurses.push(nurseCount);
    }

    return {
      labels: months,
      patients,
      nurses
    };
  }

  private async getRequestStats() {
    const [total, completed, cancelled, pending] = await Promise.all([
      this.requestModel.countDocuments().exec(),
      this.requestModel.countDocuments({ status: 'completed' }).exec(),
      this.requestModel.countDocuments({ status: 'cancelled' }).exec(),
      this.requestModel.countDocuments({ status: 'pending' }).exec()
    ]);

    const successRate = total > 0 ? ((completed / total) * 100) : 0;

    return {
      total,
      completed,
      cancelled,
      pending,
      successRate: Math.round(successRate * 10) / 10
    };
  }

  private async getRevenueData() {
    // Mock revenue data - in a real app, this would come from payment records
    const completedRequests = await this.requestModel.countDocuments({ status: 'completed' }).exec();
    const averageJobValue = 127.5; // Mock average job value in EGP
    const totalRevenue = completedRequests * averageJobValue;

    // Generate monthly revenue for last 6 months
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthlyCompletedRequests = await this.requestModel.countDocuments({
        status: 'completed',
        createdAt: { $gte: monthStart, $lt: monthEnd }
      }).exec();

      monthlyRevenue.push(monthlyCompletedRequests * averageJobValue);
    }

    return {
      totalRevenue: Math.round(totalRevenue),
      monthlyRevenue,
      averageJobValue
    };
  }

  private async getTopNurses() {
    // Get nurses with completed requests count
    const topNurses = await this.userModel.aggregate([
      { $match: { role: 'nurse', status: 'verified' } },
      {
        $lookup: {
          from: 'patientrequests',
          localField: '_id',
          foreignField: 'assignedNurse',
          as: 'completedRequests'
        }
      },
      {
        $addFields: {
          completedJobs: {
            $size: {
              $filter: {
                input: '$completedRequests',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          }
        }
      },
      { $match: { completedJobs: { $gt: 0 } } },
      { $sort: { completedJobs: -1 } },
      { $limit: 5 },
      {
        $project: {
          id: '$_id',
          name: 1,
          rating: { $ifNull: ['$rating', 4.5] }, // Default rating if not set
          completedJobs: 1,
          totalEarnings: { $multiply: ['$completedJobs', 127.5] } // Mock earnings calculation
        }
      }
    ]).exec();

    return topNurses;
  }

  private async getGeographicData() {
    // Get geographic distribution based on user addresses
    const geographicData = await this.userModel.aggregate([
      { $match: { role: 'patient' } },
      {
        $group: {
          _id: '$address',
          patientCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { area: '$_id' },
          pipeline: [
            { $match: { role: 'nurse', $expr: { $eq: ['$address', '$$area'] } } }
          ],
          as: 'nurses'
        }
      },
      {
        $lookup: {
          from: 'patientrequests',
          let: { area: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$address', '$$area'] } } }
          ],
          as: 'requests'
        }
      },
      {
        $project: {
          area: '$_id',
          requestCount: { $size: '$requests' },
          nurseCount: { $size: '$nurses' }
        }
      },
      { $sort: { requestCount: -1 } },
      { $limit: 10 }
    ]).exec();

    // If no data, return mock data for common Cairo areas
    if (geographicData.length === 0) {
      return [
        { area: 'New Cairo', requestCount: 0, nurseCount: 0 },
        { area: 'Maadi', requestCount: 0, nurseCount: 0 },
        { area: 'Zamalek', requestCount: 0, nurseCount: 0 },
        { area: 'Heliopolis', requestCount: 0, nurseCount: 0 }
      ];
    }

    return geographicData;
  }

  @Get('nurse-details/:nurseId')
  @ApiOperation({
    summary: 'Get detailed nurse information (Admin only)',
    description: 'Get comprehensive nurse profile data for admin review'
  })
  @ApiParam({
    name: 'nurseId',
    description: 'ID of the nurse to get details for',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Nurse details retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only admins can access nurse details'
  })
  async getNurseDetails(@Param('nurseId') nurseId: string) {
    try {
      console.log('🔍 [BACKEND] Getting nurse details for ID:', nurseId);
      console.log('🔍 [BACKEND] Nurse ID type:', typeof nurseId);
      console.log('🔍 [BACKEND] Nurse ID length:', nurseId.length);

      // Find the user
      console.log('🔍 [BACKEND] Searching for user in database...');
      const user = await this.userModel.findById(nurseId).select('-password');

      if (!user) {
        console.log('❌ [BACKEND] User not found with ID:', nurseId);

        // Check if any users exist and show some examples
        const totalUsers = await this.userModel.countDocuments();
        console.log('📊 [BACKEND] Total users in database:', totalUsers);

        const sampleUsers = await this.userModel.find({}).limit(3).select('_id name email role');
        console.log('📋 [BACKEND] Sample users:');
        sampleUsers.forEach(u => {
          console.log(`   - ${u._id} | ${u.name} | ${u.email} | ${u.role}`);
        });

        throw new NotFoundException('Nurse not found');
      }

      console.log('✅ [BACKEND] User found:', {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });

      if (user.role !== 'nurse') {
        console.log('❌ [BACKEND] User is not a nurse, role is:', user.role);
        throw new BadRequestException('User is not a nurse');
      }

      // Find the nurse profile with all completion data
      console.log('🔍 [BACKEND] Searching for nurse profile...');
      const nurseProfile = await this.nurseProfileModel.findOne({ userId: nurseId });

      if (!nurseProfile) {
        console.log('❌ [BACKEND] Nurse profile not found for user ID:', nurseId);

        // Check if any profiles exist
        const totalProfiles = await this.nurseProfileModel.countDocuments();
        console.log('📊 [BACKEND] Total nurse profiles in database:', totalProfiles);

        const sampleProfiles = await this.nurseProfileModel.find({}).limit(3).select('userId completionStatus licenseNumber');
        console.log('📋 [BACKEND] Sample nurse profiles:');
        sampleProfiles.forEach(p => {
          console.log(`   - UserID: ${p.userId} | Status: ${p.completionStatus} | License: ${p.licenseNumber}`);
        });
      } else {
        console.log('✅ [BACKEND] Nurse profile found:', {
          profileId: nurseProfile._id.toString(),
          userId: nurseProfile.userId.toString(),
          completionStatus: nurseProfile.completionStatus,
          step1: nurseProfile.step1Completed,
          step2: nurseProfile.step2Completed,
          step3: nurseProfile.step3Completed,
          licenseNumber: nurseProfile.licenseNumber
        });
      }

      // Combine user and profile data with proper structure
      const nurseDetails = {
        // Basic user information
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        address: user.address,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,

        // Profile completion data (if exists)
        ...(nurseProfile && {
          // Step 1 data
          fullName: nurseProfile.fullName,
          emailAddress: nurseProfile.emailAddress,
          step1Completed: nurseProfile.step1Completed,
          step1CompletedAt: nurseProfile.step1CompletedAt,

          // Step 2 data
          licenseNumber: nurseProfile.licenseNumber,
          licenseExpirationDate: nurseProfile.licenseExpirationDate,
          licenseDocument: nurseProfile.licenseDocument,
          backgroundCheckDocument: nurseProfile.backgroundCheckDocument,
          resumeDocument: nurseProfile.resumeDocument,
          step2Completed: nurseProfile.step2Completed,
          step2CompletedAt: nurseProfile.step2CompletedAt,

          // Step 3 data
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
          step3Completed: nurseProfile.step3Completed,
          step3CompletedAt: nurseProfile.step3CompletedAt,

          // Legacy fields
          yearsOfExperience: nurseProfile.yearsOfExperience,
          specializations: nurseProfile.specializations,
          education: nurseProfile.education,
          certifications: nurseProfile.certifications,
          rating: nurseProfile.rating,
          totalReviews: nurseProfile.totalReviews,
          completedJobs: nurseProfile.completedJobs,
          isAvailable: nurseProfile.isAvailable,
          hourlyRate: nurseProfile.hourlyRate,
          bio: nurseProfile.bio,
          languages: nurseProfile.languages,

          // Profile status
          completionStatus: nurseProfile.completionStatus,
          submittedAt: nurseProfile.submittedAt,
          adminNotes: nurseProfile.adminNotes,
          rejectionReason: nurseProfile.rejectionReason,
          lastUpdated: nurseProfile.lastUpdated,
        }),
      };

      console.log('✅ [BACKEND] Nurse details constructed successfully for:', user.email);
      console.log('🔍 [BACKEND] Final nurse details object keys:', Object.keys(nurseDetails));
      console.log('🔍 [BACKEND] Sample fields:', {
        id: nurseDetails.id,
        name: nurseDetails.name,
        email: nurseDetails.email,
        fullName: nurseDetails.fullName,
        completionStatus: nurseDetails.completionStatus
      });

      const response = {
        success: true,
        message: 'Nurse details retrieved successfully',
        data: nurseDetails,
      };

      console.log('📤 [BACKEND] Sending response with success:', response.success);
      console.log('📤 [BACKEND] Response data keys:', Object.keys(response.data));

      return response;
    } catch (error) {
      console.error('❌ [BACKEND] Error getting nurse details:', error);
      console.error('❌ [BACKEND] Error stack:', error.stack);
      throw error;
    }
  }

  @Put('nurse-notes/:nurseId')
  @ApiOperation({
    summary: 'Update nurse admin notes (Admin only)',
    description: 'Update internal admin notes for a nurse'
  })
  @ApiParam({
    name: 'nurseId',
    description: 'ID of the nurse to update notes for',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Nurse notes updated successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only admins can update nurse notes'
  })
  async updateNurseNotes(@Param('nurseId') nurseId: string, @Body() body: { adminNotes: string }) {
    try {
      console.log('Updating nurse notes for ID:', nurseId);

      // Find the user
      const user = await this.userModel.findById(nurseId);
      if (!user) {
        throw new NotFoundException('Nurse not found');
      }

      if (user.role !== 'nurse') {
        throw new BadRequestException('User is not a nurse');
      }

      // Update nurse profile with admin notes
      await this.nurseProfileModel.findOneAndUpdate(
        { userId: nurseId },
        {
          adminNotes: body.adminNotes,
          lastUpdated: new Date(),
        },
        { upsert: true }
      );

      console.log('Nurse notes updated successfully');

      return {
        success: true,
        message: 'Nurse notes updated successfully',
      };
    } catch (error) {
      console.error('Error updating nurse notes:', error);
      throw error;
    }
  }
}
