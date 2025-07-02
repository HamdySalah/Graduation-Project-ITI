import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserStatus } from '../schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request context');
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user account is verified (except for patients who can use the system while pending)
    if (user.role !== UserRole.PATIENT && user.status !== UserStatus.VERIFIED) {
      this.logger.warn(`User ${user.email} with status ${user.status} attempted to access protected resource`);
      throw new ForbiddenException('Account not verified');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(`User ${user.email} with role ${user.role} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`);
      throw new ForbiddenException(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}

export const Roles = (...roles: UserRole[]) => {
  const SetMetadata = require('@nestjs/common').SetMetadata;
  return SetMetadata('roles', roles);
};
