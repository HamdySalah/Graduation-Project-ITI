import {
  Controller,
  Get,
  Patch,
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
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';
import { NursesService } from './nurses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../schemas/user.schema';
import { GetNearbyNursesDto } from '../dto/request.dto';

@ApiTags('Nurses')
@Controller('api/nurses')
export class NursesController {
  constructor(private readonly nursesService: NursesService) {}

  @Get('nearby')
  @ApiOperation({
    summary: 'Find nearby nurses',
    description: 'Search for available nurses within a specified radius based on location and optional specializations'
  })
  @ApiQuery({
    name: 'latitude',
    description: 'Latitude coordinate for search center',
    example: 30.033,
    type: Number
  })
  @ApiQuery({
    name: 'longitude',
    description: 'Longitude coordinate for search center',
    example: 31.233,
    type: Number
  })
  @ApiQuery({
    name: 'radius',
    description: 'Search radius in kilometers (default: 10)',
    example: 10,
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'specializations',
    description: 'Filter by nurse specializations',
    required: false,
    isArray: true,
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'List of nearby nurses retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Jane Smith' },
          email: { type: 'string', example: 'jane.smith@example.com' },
          phone: { type: 'string', example: '+1234567890' },
          rating: { type: 'number', example: 4.5 },
          yearsOfExperience: { type: 'number', example: 5 },
          specializations: { type: 'array', items: { type: 'string' } },
          hourlyRate: { type: 'number', example: 50 },
          isAvailable: { type: 'boolean', example: true }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters'
  })
  async getNearbyNurses(@Query(ValidationPipe) getNearbyNursesDto: GetNearbyNursesDto) {
    return this.nursesService.getNearbyNurses(getNearbyNursesDto);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Verify a nurse (Admin only)',
    description: 'Verify a nurse\'s credentials and activate their account'
  })
  @ApiParam({
    name: 'id',
    description: 'Nurse ID to verify',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'Nurse verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Nurse verified successfully' },
        nurse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            status: { type: 'string', example: 'verified' }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only admins can verify nurses'
  })
  @ApiNotFoundResponse({
    description: 'Nurse not found'
  })
  async verifyNurse(@Param('id') nurseId: string, @Request() req : any) {
    return this.nursesService.verifyNurse(nurseId, req.user);
  }

  @Patch('availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Toggle nurse availability (Nurse only)',
    description: 'Toggle the availability status of the authenticated nurse'
  })
  @ApiResponse({
    status: 200,
    description: 'Availability status updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Availability enabled successfully' },
        isAvailable: { type: 'boolean', example: true }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only nurses can toggle availability'
  })
  @ApiNotFoundResponse({
    description: 'Nurse profile not found'
  })
  async toggleAvailability(@Request() req : any) {
    return this.nursesService.toggleAvailability(req.user);
  }
}
