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
  async createRequest(@Body(ValidationPipe) createRequestDto: CreateRequestDto, @Request() req) {
    return this.requestsService.createRequest(createRequestDto, req.user);
  }

  @Get()
  async getRequests(@Request() req, @Query('status') status?: RequestStatus) {
    return this.requestsService.getRequests(req.user, status);
  }

  @Patch(':id/status')
  async updateRequestStatus(
    @Param('id') requestId: string,
    @Body(ValidationPipe) updateStatusDto: UpdateRequestStatusDto,
    @Request() req
  ) {
    return this.requestsService.updateRequestStatus(requestId, updateStatusDto, req.user);
  }
}
