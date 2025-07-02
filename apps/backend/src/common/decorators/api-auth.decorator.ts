import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../auth/roles.guard';
import { UserRole } from '../../schemas/user.schema';

export function ApiAuth(...roles: UserRole[]) {
  const decorators = [
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' }),
  ];

  if (roles.length > 0) {
    decorators.push(
      UseGuards(RolesGuard),
      Roles(...roles),
      ApiForbiddenResponse({ description: 'Insufficient permissions' }),
    );
  }

  return applyDecorators(...decorators);
}
