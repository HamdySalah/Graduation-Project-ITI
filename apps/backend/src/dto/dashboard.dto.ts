import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class DashboardOverviewDto {
  @ApiProperty({
    description: 'User information',
    example: {
      id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'nurse',
      status: 'verified'
    }
  })
  user: any;

  @ApiProperty({
    description: 'Role-specific overview data',
    example: {
      totalJobs: 25,
      rating: 4.8,
      isAvailable: true
    }
  })
  @IsOptional()
  nurse?: any;

  @ApiProperty({
    description: 'Patient-specific overview data',
    example: {
      totalRequests: 10,
      activeRequests: 2
    }
  })
  @IsOptional()
  patient?: any;

  @ApiProperty({
    description: 'Admin-specific overview data',
    example: {
      totalUsers: 1500,
      pendingNurses: 25,
      totalRequests: 500
    }
  })
  @IsOptional()
  admin?: any;
}

export class DashboardStatsDto {
  @ApiProperty({
    description: 'Patient statistics',
    example: {
      totalRequests: 10,
      pendingRequests: 2,
      completedRequests: 7,
      successRate: 70
    }
  })
  @IsOptional()
  patient?: {
    totalRequests: number;
    pendingRequests: number;
    acceptedRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    successRate: number;
  };

  @ApiProperty({
    description: 'Nurse statistics',
    example: {
      totalAssignedRequests: 25,
      completedRequests: 20,
      activeRequests: 3,
      completionRate: 80,
      rating: 4.8
    }
  })
  @IsOptional()
  nurse?: {
    totalAssignedRequests: number;
    completedRequests: number;
    activeRequests: number;
    availableRequests: number;
    completionRate: number;
    rating: number;
    totalReviews: number;
    isAvailable: boolean;
    hourlyRate: number;
  };

  @ApiProperty({
    description: 'Admin statistics',
    example: {
      requests: { total: 500, pending: 50, completed: 400 },
      users: { total: 1500, patients: 1200, nurses: 280 },
      nurses: { total: 280, pending: 25, verified: 250 }
    }
  })
  @IsOptional()
  admin?: {
    requests: {
      total: number;
      pending: number;
      active: number;
      completed: number;
      cancelled: number;
    };
    users: {
      total: number;
      patients: number;
      nurses: number;
      admins: number;
    };
    nurses: {
      total: number;
      pending: number;
      verified: number;
      rejected: number;
    };
    systemHealth: {
      status: string;
      uptime: number;
      memoryUsage: any;
    };
  };
}

export class RecentActivityDto {
  @ApiProperty({
    description: 'Activity ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'Activity type',
    example: 'request'
  })
  type: string;

  @ApiProperty({
    description: 'Activity action',
    example: 'Request completed'
  })
  action: string;

  @ApiProperty({
    description: 'Activity description',
    example: 'Home care nursing service'
  })
  description: string;

  @ApiProperty({
    description: 'Activity status',
    example: 'completed'
  })
  status: string;

  @ApiProperty({
    description: 'Activity timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Additional activity details',
    example: { nurse: 'Jane Smith', patient: 'John Doe' }
  })
  @IsOptional()
  details?: any;
}

export class AnalyticsDto {
  @ApiProperty({
    description: 'Patient analytics data',
    example: {
      requestTrends: [{ date: '2024-01-15', count: 5 }],
      totalSpent: 1500,
      averageResponseTime: 45
    }
  })
  @IsOptional()
  patient?: {
    requestTrends: any[];
    totalSpent: number;
    averageResponseTime: number;
  };

  @ApiProperty({
    description: 'Nurse analytics data',
    example: {
      requestTrends: [{ date: '2024-01-15', count: 3 }],
      earnings: { total: 5000, thisMonth: 1200 },
      performanceMetrics: { completionRate: 95, averageRating: 4.8 }
    }
  })
  @IsOptional()
  nurse?: {
    requestTrends: any[];
    earnings: {
      total: number;
      thisMonth: number;
      lastMonth: number;
      trend: any[];
    };
    performanceMetrics: {
      completionRate: number;
      averageRating: number;
      responseTime: number;
    };
  };

  @ApiProperty({
    description: 'Admin analytics data',
    example: {
      systemTrends: [{ date: '2024-01-15', requests: 25, users: 10 }],
      userGrowth: [{ date: '2024-01-15', patients: 8, nurses: 2 }],
      platformMetrics: { totalRevenue: 50000, userRetention: 85 }
    }
  })
  @IsOptional()
  admin?: {
    systemTrends: any[];
    userGrowth: any[];
    platformMetrics: {
      totalRevenue: number;
      averageRequestValue: number;
      userRetention: number;
    };
  };
}

export class NotificationDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'Notification type',
    example: 'request_update'
  })
  type: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Request Status Updated'
  })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your nursing request has been accepted by a nurse.'
  })
  message: string;

  @ApiProperty({
    description: 'Read status',
    example: false
  })
  read: boolean;

  @ApiProperty({
    description: 'Notification timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: Date;
}
