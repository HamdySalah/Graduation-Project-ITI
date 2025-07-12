import {
  Controller,
  Get,
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
  ApiBearerAuth,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../schemas/user.schema';
import { ServiceType } from '../schemas/patient-request.schema';
import { SpecializationType } from '../schemas/nurse-profile.schema';
import { Transform } from 'class-transformer';

@ApiTags('Search')
@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('nurses')
  @ApiOperation({
    summary: 'Advanced nurse search',
    description: 'Search for nurses with advanced filtering options'
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query (name, specialization, location)',
    required: false,
    example: 'pediatric nurse cairo'
  })
  @ApiQuery({
    name: 'latitude',
    description: 'Latitude for location-based search',
    required: false,
    example: 30.033333
  })
  @ApiQuery({
    name: 'longitude',
    description: 'Longitude for location-based search',
    required: false,
    example: 31.233334
  })
  @ApiQuery({
    name: 'radius',
    description: 'Search radius in kilometers',
    required: false,
    example: 10
  })
  @ApiQuery({
    name: 'specializations',
    description: 'Comma-separated list of specializations',
    required: false,
    example: 'pediatric,icu'
  })
  @ApiQuery({
    name: 'minRating',
    description: 'Minimum rating filter',
    required: false,
    example: 4.0
  })
  @ApiQuery({
    name: 'maxHourlyRate',
    description: 'Maximum hourly rate filter',
    required: false,
    example: 100
  })
  @ApiQuery({
    name: 'minExperience',
    description: 'Minimum years of experience',
    required: false,
    example: 2
  })
  @ApiQuery({
    name: 'availableOnly',
    description: 'Show only available nurses',
    required: false,
    example: true
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort by field',
    required: false,
    enum: ['rating', 'hourlyRate', 'experience', 'distance'],
    example: 'rating'
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort order',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Results per page',
    required: false,
    example: 10
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nurses search results retrieved successfully'
  })
  async searchNurses(
    @Query('q') query?: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number,
    @Query('specializations') specializations?: string,
    @Query('minRating') minRating?: number,
    @Query('maxHourlyRate') maxHourlyRate?: number,
    @Query('minExperience') minExperience?: number,
    @Query('availableOnly') availableOnly?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.searchService.searchNurses({
      query,
      location: latitude && longitude ? { latitude, longitude, radius: radius || 10 } : undefined,
      specializations: specializations ? specializations.split(',') : undefined,
      minRating,
      maxHourlyRate,
      minExperience,
      availableOnly,
      sortBy: sortBy || 'rating',
      sortOrder: sortOrder || 'desc',
      page: page || 1,
      limit: limit || 10
    });
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Advanced request search',
    description: 'Search for service requests with advanced filtering (Nurses only)'
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query (title, description, location)',
    required: false,
    example: 'wound care zamalek'
  })
  @ApiQuery({
    name: 'serviceTypes',
    description: 'Comma-separated list of service types',
    required: false,
    example: 'wound_care,elderly_care'
  })
  @ApiQuery({
    name: 'urgencyLevel',
    description: 'Urgency level filter',
    required: false,
    enum: ['low', 'medium', 'high'],
    example: 'high'
  })
  @ApiQuery({
    name: 'minBudget',
    description: 'Minimum budget filter',
    required: false,
    example: 50
  })
  @ApiQuery({
    name: 'maxBudget',
    description: 'Maximum budget filter',
    required: false,
    example: 200
  })
  @ApiQuery({
    name: 'dateFrom',
    description: 'Scheduled date from (ISO string)',
    required: false,
    example: '2024-01-15T00:00:00Z'
  })
  @ApiQuery({
    name: 'dateTo',
    description: 'Scheduled date to (ISO string)',
    required: false,
    example: '2024-01-30T23:59:59Z'
  })
  @ApiQuery({
    name: 'latitude',
    description: 'Latitude for location-based search',
    required: false,
    example: 30.033333
  })
  @ApiQuery({
    name: 'longitude',
    description: 'Longitude for location-based search',
    required: false,
    example: 31.233334
  })
  @ApiQuery({
    name: 'radius',
    description: 'Search radius in kilometers',
    required: false,
    example: 15
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort by field',
    required: false,
    enum: ['createdAt', 'scheduledDate', 'budget', 'urgencyLevel'],
    example: 'createdAt'
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort order',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Results per page',
    required: false,
    example: 10
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Requests search results retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async searchRequests(
    @Request() req: any,
    @Query('q') query?: string,
    @Query('serviceTypes') serviceTypes?: string,
    @Query('urgencyLevel') urgencyLevel?: string,
    @Query('minBudget') minBudget?: number,
    @Query('maxBudget') maxBudget?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.searchService.searchRequests({
      query,
      serviceTypes: serviceTypes ? serviceTypes.split(',') : undefined,
      urgencyLevel,
      minBudget,
      maxBudget,
      dateRange: dateFrom && dateTo ? { from: new Date(dateFrom), to: new Date(dateTo) } : undefined,
      location: latitude && longitude ? { latitude, longitude, radius: radius || 15 } : undefined,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      page: page || 1,
      limit: limit || 10,
      userId: req.user._id,
      userRole: req.user.role
    });
  }

  @Get('global')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Global search',
    description: 'Search across nurses, requests, and other entities'
  })
  @ApiQuery({
    name: 'q',
    description: 'Global search query',
    required: true,
    example: 'pediatric nurse cairo'
  })
  @ApiQuery({
    name: 'type',
    description: 'Search type filter',
    required: false,
    enum: ['nurses', 'requests', 'all'],
    example: 'all'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Results per page',
    required: false,
    example: 20
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global search results retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async globalSearch(
    @Request() req: any,
    @Query('q') query: string,
    @Query('type') type?: 'nurses' | 'requests' | 'all',
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.searchService.globalSearch({
      query,
      type: type || 'all',
      page: page || 1,
      limit: limit || 20,
      userId: req.user._id,
      userRole: req.user.role
    });
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Get search suggestions',
    description: 'Get search suggestions based on partial query'
  })
  @ApiQuery({
    name: 'q',
    description: 'Partial search query',
    required: true,
    example: 'pedi'
  })
  @ApiQuery({
    name: 'type',
    description: 'Suggestion type',
    required: false,
    enum: ['specializations', 'locations', 'services', 'all'],
    example: 'specializations'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of suggestions',
    required: false,
    example: 5
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search suggestions retrieved successfully'
  })
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('type') type?: 'specializations' | 'locations' | 'services' | 'all',
    @Query('limit') limit?: number
  ) {
    return this.searchService.getSearchSuggestions({
      query,
      type: type || 'all',
      limit: limit || 5
    });
  }
}
