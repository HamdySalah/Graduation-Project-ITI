import { Controller, Get, UseGuards } from '@nestjs/common';
import { NursesService } from '../nurses/nurses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../schemas/user.schema';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly nursesService: NursesService) {}

  @Get('pending-nurses')
  async getPendingNurses() {
    return this.nursesService.getPendingNurses();
  }
}
