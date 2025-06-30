import { Controller, Get, Patch, Param, Query, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { NursesService } from './nurses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../schemas/user.schema';
import { GetNearbyNursesDto } from '../dto/request.dto';

@Controller('api/nurses')
export class NursesController {
  constructor(private readonly nursesService: NursesService) {}

  @Get('nearby')
  async getNearbyNurses(@Query(ValidationPipe) getNearbyNursesDto: GetNearbyNursesDto) {
    return this.nursesService.getNearbyNurses(getNearbyNursesDto);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async verifyNurse(@Param('id') nurseId: string, @Request() req : any) {
    return this.nursesService.verifyNurse(nurseId, req.user);
  }

  @Patch('availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  async toggleAvailability(@Request() req : any) {
    return this.nursesService.toggleAvailability(req.user);
  }
}
