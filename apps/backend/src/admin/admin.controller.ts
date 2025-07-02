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

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly nursesService: NursesService) {}

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
    // TODO: Implement admin statistics logic
    return {
      totalUsers: 150,
      totalPatients: 100,
      totalNurses: 45,
      verifiedNurses: 40,
      pendingNurses: 5,
      totalRequests: 75,
      pendingRequests: 10,
      completedRequests: 50,
      cancelledRequests: 15,
      monthlyGrowth: {
        users: 12,
        requests: 8
      }
    };
  }
}
