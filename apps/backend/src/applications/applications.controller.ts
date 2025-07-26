import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../dto/application.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async applyToRequest(@Body() createApplicationDto: CreateApplicationDto, @Request() req) {
    return this.applicationsService.applyToRequest(createApplicationDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('request/:requestId')
  async getApplicationsByRequest(@Param('requestId') requestId: string, @Request() req) {
    return this.applicationsService.getApplicationsByRequest(requestId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('nurse')
  async getApplicationsByNurse(@Request() req) {
    return this.applicationsService.getApplicationsByNurse(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/status')
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicationStatusDto,
    @Request() req
  ) {
    return this.applicationsService.updateApplicationStatus(id, updateDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateApplication(
    @Param('id') id: string,
    @Body() updateDto: { price: number, estimatedTime: number },
    @Request() req: any
  ) {
    return this.applicationsService.updateApplication(id, updateDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async cancelApplication(@Param('id') id: string, @Request() req: any) {
    return this.applicationsService.cancelApplication(id, req.user);
  }
}
