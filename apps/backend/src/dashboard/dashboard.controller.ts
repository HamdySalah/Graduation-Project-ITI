import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiQuery
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../schemas/user.schema';

@ApiTags('Dashboard')
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get dashboard overview',
    description: 'Get comprehensive dashboard overview based on user role'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getDashboardOverview(@Request() req: any) {
    return this.dashboardService.getDashboardOverview(req.user);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Get detailed statistics based on user role'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getDashboardStats(@Request() req: any) {
    return this.dashboardService.getDashboardStats(req.user);
  }

  @Get('recent-activities')
  @ApiOperation({
    summary: 'Get recent activities',
    description: 'Get recent activities and notifications for the user'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of activities to retrieve',
    required: false,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Recent activities retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getRecentActivities(@Request() req: any, @Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivities(req.user, limit || 10);
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get analytics data',
    description: 'Get analytics and charts data for dashboard'
  })
  @ApiQuery({
    name: 'period',
    description: 'Time period for analytics',
    required: false,
    example: '30d'
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getAnalytics(@Request() req: any, @Query('period') period?: string) {
    return this.dashboardService.getAnalytics(req.user, period || '30d');
  }

  @Get('notifications')
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Get notifications for the authenticated user'
  })
  @ApiQuery({
    name: 'unread',
    description: 'Filter for unread notifications only',
    required: false,
    example: true
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getNotifications(@Request() req: any, @Query('unread') unread?: boolean) {
    return this.dashboardService.getNotifications(req.user, unread);
  }

  // Admin-specific dashboard endpoints
  @Get('admin/system-health')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get system health status',
    description: 'Get system health and performance metrics (Admin only)'
  })
  @ApiResponse({
    status: 200,
    description: 'System health retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getSystemHealth(@Request() req: any) {
    return this.dashboardService.getSystemHealth();
  }

  @Get('admin/user-analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user analytics',
    description: 'Get comprehensive user analytics (Admin only)'
  })
  @ApiResponse({
    status: 200,
    description: 'User analytics retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getUserAnalytics(@Request() req: any) {
    return this.dashboardService.getUserAnalytics();
  }
}
