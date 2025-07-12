import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, UserStatus } from '../schemas/user.schema';
import { PatientRequest, PatientRequestDocument, RequestStatus } from '../schemas/patient-request.schema';
import { NurseProfile, NurseProfileDocument } from '../schemas/nurse-profile.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PatientRequest.name) private requestModel: Model<PatientRequestDocument>,
    @InjectModel(NurseProfile.name) private nurseProfileModel: Model<NurseProfileDocument>,
  ) {}

  async getDashboardOverview(user: UserDocument) {
    const overview: any = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        joinedAt: user.createdAt,
      }
    };

    switch (user.role) {
      case UserRole.PATIENT:
        overview.patient = await this.getPatientOverview(user);
        break;
      case UserRole.NURSE:
        overview.nurse = await this.getNurseOverview(user);
        break;
      case UserRole.ADMIN:
        overview.admin = await this.getAdminOverview();
        break;
    }

    return overview;
  }

  async getDashboardStats(user: UserDocument) {
    const stats: any = {};

    if (user.role === UserRole.PATIENT) {
      const totalRequests = await this.requestModel.countDocuments({ patientId: user._id }).exec();
      const pendingRequests = await this.requestModel.countDocuments({ 
        patientId: user._id, 
        status: RequestStatus.PENDING 
      }).exec();
      const acceptedRequests = await this.requestModel.countDocuments({ 
        patientId: user._id, 
        status: RequestStatus.ACCEPTED 
      }).exec();
      const completedRequests = await this.requestModel.countDocuments({ 
        patientId: user._id, 
        status: RequestStatus.COMPLETED 
      }).exec();
      const cancelledRequests = await this.requestModel.countDocuments({ 
        patientId: user._id, 
        status: RequestStatus.CANCELLED 
      }).exec();

      stats.patient = {
        totalRequests,
        pendingRequests,
        acceptedRequests,
        completedRequests,
        cancelledRequests,
        successRate: totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0,
      };

    } else if (user.role === UserRole.NURSE) {
      const totalAssignedRequests = await this.requestModel.countDocuments({ nurseId: user._id }).exec();
      const completedRequests = await this.requestModel.countDocuments({ 
        nurseId: user._id, 
        status: RequestStatus.COMPLETED 
      }).exec();
      const activeRequests = await this.requestModel.countDocuments({ 
        nurseId: user._id, 
        status: RequestStatus.ACCEPTED 
      }).exec();
      const availableRequests = await this.requestModel.countDocuments({ 
        status: RequestStatus.PENDING 
      }).exec();

      // Get nurse profile for additional stats
      const nurseProfile = await this.nurseProfileModel.findOne({ userId: user._id }).exec();

      stats.nurse = {
        totalAssignedRequests,
        completedRequests,
        activeRequests,
        availableRequests,
        completionRate: totalAssignedRequests > 0 ? Math.round((completedRequests / totalAssignedRequests) * 100) : 0,
        rating: nurseProfile?.rating || 0,
        totalReviews: nurseProfile?.totalReviews || 0,
        isAvailable: nurseProfile?.isAvailable || false,
        hourlyRate: nurseProfile?.hourlyRate || 0,
      };

    } else if (user.role === UserRole.ADMIN) {
      const totalRequests = await this.requestModel.countDocuments().exec();
      const pendingRequests = await this.requestModel.countDocuments({ status: RequestStatus.PENDING }).exec();
      const completedRequests = await this.requestModel.countDocuments({ status: RequestStatus.COMPLETED }).exec();
      const activeRequests = await this.requestModel.countDocuments({ status: RequestStatus.ACCEPTED }).exec();
      
      const totalUsers = await this.userModel.countDocuments().exec();
      const totalPatients = await this.userModel.countDocuments({ role: UserRole.PATIENT }).exec();
      const totalNurses = await this.userModel.countDocuments({ role: UserRole.NURSE }).exec();
      const pendingNurses = await this.userModel.countDocuments({ 
        role: UserRole.NURSE, 
        status: UserStatus.PENDING 
      }).exec();
      const verifiedNurses = await this.userModel.countDocuments({ 
        role: UserRole.NURSE, 
        status: UserStatus.VERIFIED 
      }).exec();

      stats.admin = {
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          active: activeRequests,
          completed: completedRequests,
          cancelled: totalRequests - pendingRequests - activeRequests - completedRequests,
        },
        users: {
          total: totalUsers,
          patients: totalPatients,
          nurses: totalNurses,
          admins: totalUsers - totalPatients - totalNurses,
        },
        nurses: {
          total: totalNurses,
          pending: pendingNurses,
          verified: verifiedNurses,
          rejected: totalNurses - pendingNurses - verifiedNurses,
        },
        systemHealth: {
          status: 'healthy',
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        }
      };
    }

    return stats;
  }

  async getRecentActivities(user: UserDocument, limit: number = 10) {
    const activities: any[] = [];

    if (user.role === UserRole.PATIENT) {
      // Get recent requests for patient
      const recentRequests = await this.requestModel
        .find({ patientId: user._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('nurseId', 'name')
        .exec();

      activities.push(...recentRequests.map(request => ({
        id: request._id,
        type: 'request',
        action: `Request ${request.status}`,
        description: request.title,
        status: request.status,
        timestamp: request.createdAt,
        nurse: request.nurseId ? (request.nurseId as any).name : null,
      })));

    } else if (user.role === UserRole.NURSE) {
      // Get recent assigned requests for nurse
      const recentRequests = await this.requestModel
        .find({ 
          $or: [
            { nurseId: user._id },
            { status: RequestStatus.PENDING }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('patientId', 'name')
        .exec();

      activities.push(...recentRequests.map(request => ({
        id: request._id,
        type: 'request',
        action: request.nurseId?.equals(user._id) ? `Request ${request.status}` : 'New request available',
        description: request.title,
        status: request.status,
        timestamp: request.createdAt,
        patient: (request.patientId as any).name,
      })));

    } else if (user.role === UserRole.ADMIN) {
      // Get recent system activities for admin
      const recentRequests = await this.requestModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit / 2)
        .populate('patientId nurseId', 'name')
        .exec();

      const recentUsers = await this.userModel
        .find({ role: { $ne: UserRole.ADMIN } })
        .sort({ createdAt: -1 })
        .limit(limit / 2)
        .exec();

      activities.push(...recentRequests.map(request => ({
        id: request._id,
        type: 'request',
        action: `Request ${request.status}`,
        description: request.title,
        status: request.status,
        timestamp: request.createdAt,
        patient: (request.patientId as any).name,
        nurse: request.nurseId ? (request.nurseId as any).name : null,
      })));

      activities.push(...recentUsers.map(user => ({
        id: user._id,
        type: 'user',
        action: `New ${user.role} registered`,
        description: user.name,
        status: user.status,
        timestamp: user.createdAt,
      })));
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, limit);
  }

  private async getPatientOverview(user: UserDocument) {
    const totalRequests = await this.requestModel.countDocuments({ patientId: user._id }).exec();
    const activeRequests = await this.requestModel.countDocuments({ 
      patientId: user._id, 
      status: { $in: [RequestStatus.PENDING, RequestStatus.ACCEPTED] }
    }).exec();

    return {
      totalRequests,
      activeRequests,
      quickActions: [
        { label: 'Create New Request', action: 'create-request', icon: 'plus' },
        { label: 'View My Requests', action: 'view-requests', icon: 'list' },
        { label: 'Find Nurses', action: 'find-nurses', icon: 'search' },
      ]
    };
  }

  private async getNurseOverview(user: UserDocument) {
    const nurseProfile = await this.nurseProfileModel.findOne({ userId: user._id }).exec();
    const totalJobs = await this.requestModel.countDocuments({ nurseId: user._id }).exec();
    const availableJobs = await this.requestModel.countDocuments({ status: RequestStatus.PENDING }).exec();

    return {
      isAvailable: nurseProfile?.isAvailable || false,
      rating: nurseProfile?.rating || 0,
      totalJobs,
      availableJobs,
      quickActions: [
        { label: 'Toggle Availability', action: 'toggle-availability', icon: 'power' },
        { label: 'View Available Jobs', action: 'view-jobs', icon: 'briefcase' },
        { label: 'My Schedule', action: 'view-schedule', icon: 'calendar' },
      ]
    };
  }

  private async getAdminOverview() {
    const totalUsers = await this.userModel.countDocuments().exec();
    const pendingNurses = await this.userModel.countDocuments({ 
      role: UserRole.NURSE, 
      status: UserStatus.PENDING 
    }).exec();
    const totalRequests = await this.requestModel.countDocuments().exec();

    return {
      totalUsers,
      pendingNurses,
      totalRequests,
      quickActions: [
        { label: 'Verify Nurses', action: 'verify-nurses', icon: 'check-circle' },
        { label: 'User Management', action: 'user-management', icon: 'users' },
        { label: 'System Reports', action: 'system-reports', icon: 'chart-bar' },
      ]
    };
  }

  async getAnalytics(user: UserDocument, period: string = '30d') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics: any = {};

    if (user.role === UserRole.PATIENT) {
      // Patient analytics
      const requestTrends = await this.getRequestTrends(user._id, startDate, 'patient');
      analytics.patient = {
        requestTrends,
        totalSpent: 0, // TODO: Calculate from completed requests
        averageResponseTime: 0, // TODO: Calculate average time from request to acceptance
      };

    } else if (user.role === UserRole.NURSE) {
      // Nurse analytics
      const requestTrends = await this.getRequestTrends(user._id, startDate, 'nurse');
      const earnings = await this.calculateEarnings(user._id, startDate);

      analytics.nurse = {
        requestTrends,
        earnings,
        performanceMetrics: {
          completionRate: 0, // TODO: Calculate
          averageRating: 0, // TODO: Calculate
          responseTime: 0, // TODO: Calculate
        }
      };

    } else if (user.role === UserRole.ADMIN) {
      // Admin analytics
      const systemTrends = await this.getSystemTrends(startDate);
      const userGrowth = await this.getUserGrowthTrends(startDate);

      analytics.admin = {
        systemTrends,
        userGrowth,
        platformMetrics: {
          totalRevenue: 0, // TODO: Calculate
          averageRequestValue: 0, // TODO: Calculate
          userRetention: 0, // TODO: Calculate
        }
      };
    }

    return analytics;
  }

  async getNotifications(user: UserDocument, unreadOnly?: boolean) {
    // TODO: Implement notification system
    // For now, return mock notifications based on user role
    const notifications: any[] = [];

    if (user.role === UserRole.PATIENT) {
      notifications.push({
        id: '1',
        type: 'request_update',
        title: 'Request Status Updated',
        message: 'Your nursing request has been accepted by a nurse.',
        read: false,
        timestamp: new Date(),
      });
    } else if (user.role === UserRole.NURSE) {
      notifications.push({
        id: '2',
        type: 'new_request',
        title: 'New Request Available',
        message: 'A new nursing request is available in your area.',
        read: false,
        timestamp: new Date(),
      });
    } else if (user.role === UserRole.ADMIN) {
      notifications.push({
        id: '3',
        type: 'nurse_verification',
        title: 'Nurse Verification Pending',
        message: 'New nurse registrations require verification.',
        read: false,
        timestamp: new Date(),
      });
    }

    return unreadOnly ? notifications.filter(n => !n.read) : notifications;
  }

  async getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Get database connection status
    const dbStats = {
      connected: true, // TODO: Check actual DB connection
      responseTime: 0, // TODO: Measure DB response time
    };

    return {
      status: 'healthy',
      uptime: {
        seconds: uptime,
        formatted: this.formatUptime(uptime),
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      database: dbStats,
      api: {
        status: 'operational',
        responseTime: 0, // TODO: Calculate average response time
      }
    };
  }

  async getUserAnalytics() {
    const totalUsers = await this.userModel.countDocuments().exec();
    const usersByRole = await this.userModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).exec();

    const usersByStatus = await this.userModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).exec();

    // Get user registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const registrationTrends = await this.userModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]).exec();

    return {
      overview: {
        totalUsers,
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

  private parsePeriod(period: string): number {
    const match = period.match(/(\d+)([dwmy])/);
    if (!match) return 30;

    const [, num, unit] = match;
    const value = parseInt(num);

    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 30;
    }
  }

  private async getRequestTrends(userId: any, startDate: Date, userType: 'patient' | 'nurse') {
    const matchCondition = userType === 'patient'
      ? { patientId: userId, createdAt: { $gte: startDate } }
      : { nurseId: userId, createdAt: { $gte: startDate } };

    return await this.requestModel.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]).exec();
  }

  private async calculateEarnings(nurseId: any, startDate: Date) {
    // TODO: Implement earnings calculation based on completed requests
    return {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      trend: []
    };
  }

  private async getSystemTrends(startDate: Date) {
    return await this.requestModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]).exec();
  }

  private async getUserGrowthTrends(startDate: Date) {
    return await this.userModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]).exec();
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }
}
