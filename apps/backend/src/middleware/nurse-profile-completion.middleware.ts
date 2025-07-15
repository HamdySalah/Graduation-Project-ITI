import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { NurseProfileStatusService } from '../services/nurse-profile-status.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
    status: string;
  };
}

@Injectable()
export class NurseProfileCompletionMiddleware implements NestMiddleware {
  constructor(
    private readonly nurseProfileStatusService: NurseProfileStatusService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Only apply to authenticated requests with nurse users
    if (!req.user || req.user.role !== 'nurse') {
      return next();
    }

    // Skip middleware for profile completion and auth-related endpoints
    const allowedPaths = [
      '/api/auth',
      '/api/nurse-profile',
      '/api/profile',
      '/api/users/profile',
      '/api/dashboard/overview', // Allow basic dashboard access for status checking
    ];

    const isAllowedPath = allowedPaths.some(path => req.path.startsWith(path));
    if (isAllowedPath) {
      return next();
    }

    try {
      // Check nurse access status
      const accessStatus = await this.nurseProfileStatusService.getNurseAccessStatus(req.user.sub);

      // If nurse cannot access platform features, block the request
      if (!accessStatus.canAccessPlatform) {
        const errorMessage = accessStatus.reason || 'Profile completion required';
        const redirectTo = accessStatus.redirectTo || '/nurse-profile-complete';
        
        throw new ForbiddenException({
          message: errorMessage,
          redirectTo,
          nextAction: accessStatus.nextRequiredAction,
          currentStep: accessStatus.currentStep,
          statusCode: 403,
        });
      }

      // Check specific feature access for certain endpoints
      if (req.path.startsWith('/api/requests') && !accessStatus.canViewRequests) {
        throw new ForbiddenException({
          message: 'Complete your profile to access requests',
          redirectTo: '/nurse-profile-complete',
          statusCode: 403,
        });
      }

      if (req.path.startsWith('/api/nurses') && !accessStatus.canAccessPlatform) {
        throw new ForbiddenException({
          message: 'Complete your profile to access nurse features',
          redirectTo: '/nurse-profile-complete',
          statusCode: 403,
        });
      }

      // Add access status to request for use in controllers
      (req as any).nurseAccessStatus = accessStatus;

      next();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      // For other errors, allow the request but log the issue
      console.error('Error in NurseProfileCompletionMiddleware:', error);
      next();
    }
  }
}

// Decorator to check specific nurse permissions
export function RequireNurseAccess(feature: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args.find(arg => arg && arg.user);
      
      if (req && req.user && req.user.role === 'nurse') {
        const nurseAccessStatus = req.nurseAccessStatus;
        
        if (!nurseAccessStatus) {
          throw new ForbiddenException('Access status not available');
        }

        let hasAccess = false;
        switch (feature) {
          case 'dashboard':
            hasAccess = nurseAccessStatus.canAccessDashboard;
            break;
          case 'requests':
            hasAccess = nurseAccessStatus.canViewRequests;
            break;
          case 'create_request':
            hasAccess = nurseAccessStatus.canCreateRequests;
            break;
          case 'platform':
            hasAccess = nurseAccessStatus.canAccessPlatform;
            break;
          default:
            hasAccess = nurseAccessStatus.canAccessPlatform;
        }

        if (!hasAccess) {
          throw new ForbiddenException({
            message: `Complete your profile to access ${feature}`,
            redirectTo: nurseAccessStatus.redirectTo || '/nurse-profile-complete',
            nextAction: nurseAccessStatus.nextRequiredAction,
          });
        }
      }

      return method.apply(this, args);
    };
  };
}
