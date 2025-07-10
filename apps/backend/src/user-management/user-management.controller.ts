import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe
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
import { UserManagementService } from './user-management.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../schemas/user.schema';

@ApiTags('User Management')
@Controller('api/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve all users with filtering and pagination (Admin only)'
  })
  @ApiQuery({
    name: 'role',
    description: 'Filter users by role',
    required: false,
    enum: UserRole
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter users by status',
    required: false,
    example: 'verified'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of users per page',
    required: false,
    example: 10
  })
  @ApiQuery({
    name: 'search',
    description: 'Search users by name or email',
    required: false,
    example: 'john'
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied - Admin role required'
  })
  async getAllUsers(
    @Query('role') role?: UserRole,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string
  ) {
    return this.userManagementService.getAllUsers({
      role,
      status,
      page: page || 1,
      limit: limit || 10,
      search
    });
  }

  @Get('profile/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user profile by ID',
    description: 'Retrieve detailed user profile information (Admin only)'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied - Admin role required'
  })
  @ApiNotFoundResponse({
    description: 'User not found'
  })
  async getUserProfile(@Param('id') userId: string) {
    return this.userManagementService.getUserProfile(userId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user information',
    description: 'Update user profile and settings (Admin only)'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({
    description: 'User update data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        phone: { type: 'string', example: '+1234567890' },
        status: { type: 'string', example: 'verified' },
        address: { type: 'string', example: '123 Main St' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied - Admin role required'
  })
  @ApiNotFoundResponse({
    description: 'User not found'
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data'
  })
  async updateUser(@Param('id') userId: string, @Body(ValidationPipe) updateData: any) {
    return this.userManagementService.updateUser(userId, updateData);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete user account',
    description: 'Permanently delete a user account (Admin only)'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied - Admin role required'
  })
  @ApiNotFoundResponse({
    description: 'User not found'
  })
  async deleteUser(@Param('id') userId: string) {
    return this.userManagementService.deleteUser(userId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user status',
    description: 'Update user verification status (Admin only)'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({
    description: 'Status update data',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'verified' },
        reason: { type: 'string', example: 'Documents verified' }
      },
      required: ['status']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied - Admin role required'
  })
  @ApiNotFoundResponse({
    description: 'User not found'
  })
  async updateUserStatus(
    @Param('id') userId: string, 
    @Body(ValidationPipe) statusData: { status: string; reason?: string }
  ) {
    return this.userManagementService.updateUserStatus(userId, statusData.status, statusData.reason);
  }

  @Patch(':id/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Suspend user account',
    description: 'Temporarily suspend a user account (Admin only)'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({
    description: 'Suspension data',
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: 'Policy violation' },
        duration: { type: 'number', example: 30 }
      },
      required: ['reason']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User suspended successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied - Admin role required'
  })
  @ApiNotFoundResponse({
    description: 'User not found'
  })
  async suspendUser(
    @Param('id') userId: string, 
    @Body(ValidationPipe) suspensionData: { reason: string; duration?: number }
  ) {
    return this.userManagementService.suspendUser(userId, suspensionData.reason, suspensionData.duration);
  }

  @Patch(':id/reactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reactivate suspended user',
    description: 'Reactivate a suspended user account (Admin only)'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'User reactivated successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied - Admin role required'
  })
  @ApiNotFoundResponse({
    description: 'User not found'
  })
  async reactivateUser(@Param('id') userId: string) {
    return this.userManagementService.reactivateUser(userId);
  }

  @Get('stats/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user statistics overview',
    description: 'Get comprehensive user statistics (Admin only)'
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied - Admin role required'
  })
  async getUserStats() {
    return this.userManagementService.getUserStats();
  }
}
