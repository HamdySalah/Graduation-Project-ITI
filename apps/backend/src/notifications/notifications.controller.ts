import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../schemas/user.schema';
import { NotificationType, NotificationPriority } from '../schemas/notification.schema';
import { CreateNotificationDto, NotificationResponseDto } from '../dto/notification.dto';

@ApiTags('Notifications')
@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Retrieve notifications for the authenticated user with filtering and pagination'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of notifications per page',
    required: false,
    example: 20
  })
  @ApiQuery({
    name: 'unread',
    description: 'Filter for unread notifications only',
    required: false,
    example: true
  })
  @ApiQuery({
    name: 'type',
    description: 'Filter by notification type',
    required: false,
    enum: NotificationType
  })
  @ApiQuery({
    name: 'priority',
    description: 'Filter by notification priority',
    required: false,
    enum: NotificationPriority
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getNotifications(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unread') unread?: boolean,
    @Query('type') type?: NotificationType,
    @Query('priority') priority?: NotificationPriority
  ) {
    return this.notificationsService.getUserNotifications(req.user._id, {
      page: page || 1,
      limit: limit || 20,
      unread,
      type,
      priority
    });
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notifications count',
    description: 'Get the count of unread notifications for the authenticated user'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        unreadCount: { type: 'number', example: 5 }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user._id);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read'
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiNotFoundResponse({
    description: 'Notification not found'
  })
  @ApiForbiddenResponse({
    description: 'Access denied to this notification'
  })
  async markAsRead(@Param('id') notificationId: string, @Request() req: any) {
    return this.notificationsService.markAsRead(notificationId, req.user._id);
  }

  @Patch('mark-all-read')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications for the authenticated user as read'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user._id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a specific notification'
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiNotFoundResponse({
    description: 'Notification not found'
  })
  @ApiForbiddenResponse({
    description: 'Access denied to this notification'
  })
  async deleteNotification(@Param('id') notificationId: string, @Request() req: any) {
    return this.notificationsService.deleteNotification(notificationId, req.user._id);
  }

  @Delete('clear-all')
  @ApiOperation({
    summary: 'Clear all notifications',
    description: 'Delete all notifications for the authenticated user'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications cleared successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async clearAllNotifications(@Request() req: any) {
    return this.notificationsService.clearAllNotifications(req.user._id);
  }

  // Admin endpoints
  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Broadcast notification to users',
    description: 'Send a notification to multiple users (Admin only)'
  })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Broadcast notification sent successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Admin access required'
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data'
  })
  async broadcastNotification(
    @Body(ValidationPipe) createNotificationDto: CreateNotificationDto,
    @Request() req: any
  ) {
    return this.notificationsService.broadcastNotification(createNotificationDto, req.user);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get notification statistics',
    description: 'Get notification statistics and analytics (Admin only)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification statistics retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Admin access required'
  })
  async getNotificationStats(@Request() req: any) {
    return this.notificationsService.getNotificationStats();
  }

  @Get('preferences')
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Get notification preferences for the authenticated user'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification preferences retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getNotificationPreferences(@Request() req: any) {
    return this.notificationsService.getNotificationPreferences(req.user._id);
  }

  @Patch('preferences')
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Update notification preferences for the authenticated user'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        emailNotifications: { type: 'boolean', example: true },
        pushNotifications: { type: 'boolean', example: true },
        smsNotifications: { type: 'boolean', example: false },
        notificationTypes: {
          type: 'object',
          properties: {
            request_created: { type: 'boolean', example: true },
            request_accepted: { type: 'boolean', example: true },
            request_completed: { type: 'boolean', example: true },
            review_received: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification preferences updated successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async updateNotificationPreferences(
    @Body() preferences: any,
    @Request() req: any
  ) {
    return this.notificationsService.updateNotificationPreferences(req.user._id, preferences);
  }
}
