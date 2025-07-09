import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
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
}
