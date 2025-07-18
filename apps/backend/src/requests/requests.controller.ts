import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRequestDto, UpdateRequestStatusDto } from '../dto/request.dto';
import { RequestStatus } from '../schemas/patient-request.schema';

@Controller('api/requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  async createRequest(@Body(ValidationPipe) createRequestDto: CreateRequestDto, @Request() req : any) {
    console.log('🔍 Controller createRequest called');
    console.log('🔍 req.user:', req.user);
    console.log('🔍 createRequestDto:', createRequestDto);
    return this.requestsService.createRequest(createRequestDto, req.user);
  }

  @Get()
  async getRequests(@Request() req : any, @Query('status') status?: RequestStatus) {
    return this.requestsService.getRequests(req.user, status);
  }

  @Get(':id')
  async getRequestById(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.getRequestById(id, req.user);
  }

  @Get('dashboard/stats')
  async getDashboardStats(@Request() req : any) {
    return this.requestsService.getDashboardStats(req.user);
  }

  @Get(':id')
  async getRequestById(@Param('id') requestId: string, @Request() req : any) {
    return this.requestsService.getRequestById(requestId, req.user);
  }

  @Patch(':id/status')
  async updateRequestStatus(
    @Param('id') requestId: string,
    @Body(ValidationPipe) updateStatusDto: UpdateRequestStatusDto,
    @Request() req : any
  ) {
    return this.requestsService.updateRequestStatus(requestId, updateStatusDto, req.user);
  }
}
