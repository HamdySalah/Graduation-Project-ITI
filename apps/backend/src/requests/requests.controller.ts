import {
  Controller,
  Post,
  Get,
  Patch,
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
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRequestDto, UpdateRequestStatusDto, RequestResponseDto, DashboardStatsDto } from '../dto/request.dto';
import { RequestStatus } from '../schemas/patient-request.schema';

@ApiTags('Requests')
@Controller('api/requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new nursing request',
    description: 'Create a new request for nursing services'
  })
  @ApiBody({ type: CreateRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Request created successfully',
    type: RequestResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async createRequest(@Body(ValidationPipe) createRequestDto: CreateRequestDto, @Request() req : any) {
    return this.requestsService.createRequest(createRequestDto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user requests',
    description: 'Retrieve requests for the authenticated user (filtered by role and optional status)'
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter requests by status',
    required: false,
    enum: RequestStatus
  })
  @ApiResponse({
    status: 200,
    description: 'Requests retrieved successfully',
    type: [RequestResponseDto]
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getRequests(@Request() req : any, @Query('status') status?: RequestStatus) {
    return this.requestsService.getRequests(req.user, status);
  }

  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Retrieve dashboard statistics for the authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getDashboardStats(@Request() req : any) {
    return this.requestsService.getDashboardStats(req.user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get request by ID',
    description: 'Retrieve a specific request by its ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Request ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'Request retrieved successfully',
    type: RequestResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiNotFoundResponse({
    description: 'Request not found'
  })
  @ApiForbiddenResponse({
    description: 'Access denied to this request'
  })
  async getRequestById(@Param('id') requestId: string, @Request() req : any) {
    return this.requestsService.getRequestById(requestId, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update request status',
    description: 'Update the status of a specific request (nurses can accept/complete, patients can cancel)'
  })
  @ApiParam({
    name: 'id',
    description: 'Request ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({ type: UpdateRequestStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Request status updated successfully',
    type: RequestResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiNotFoundResponse({
    description: 'Request not found'
  })
  @ApiForbiddenResponse({
    description: 'Access denied or invalid status transition'
  })
  async updateRequestStatus(
    @Param('id') requestId: string,
    @Body(ValidationPipe) updateStatusDto: UpdateRequestStatusDto,
    @Request() req : any
  ) {
    return this.requestsService.updateRequestStatus(requestId, updateStatusDto, req.user);
  }
}
