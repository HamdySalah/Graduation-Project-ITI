import { 
  Controller, 
  Get, 
  UseGuards, 
  Request,
  HttpStatus,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NurseProfileStatusService, NurseAccessStatus } from '../services/nurse-profile-status.service';

@ApiTags('Nurse Profile Status')
@Controller('api/nurse-profile-status')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NurseProfileStatusController {
  constructor(
    private readonly nurseProfileStatusService: NurseProfileStatusService,
  ) {}

  @Get('access-status')
  @ApiOperation({ summary: 'Get comprehensive nurse access status' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Access status retrieved successfully'
  })
  async getAccessStatus(@Request() req): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: NurseAccessStatus;
  }> {
    const userId = req.user.id;
    
    if (req.user.role !== 'nurse') {
      throw new ForbiddenException('Only nurses can check access status');
    }

    const accessStatus = await this.nurseProfileStatusService.getNurseAccessStatus(userId);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Access status retrieved successfully',
      data: accessStatus,
    };
  }

  @Get('next-step')
  @ApiOperation({ summary: 'Get next required step in profile completion' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Next step retrieved successfully'
  })
  async getNextStep(@Request() req): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      nextStep: number;
      completionPercentage: number;
      statusMessage: string;
    };
  }> {
    const userId = req.user.id;
    
    if (req.user.role !== 'nurse') {
      throw new ForbiddenException('Only nurses can check profile steps');
    }

    const [nextStep, completionPercentage, statusMessage] = await Promise.all([
      this.nurseProfileStatusService.getNextStep(userId),
      this.nurseProfileStatusService.getCompletionPercentage(userId),
      this.nurseProfileStatusService.getStatusMessage(userId),
    ]);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Next step information retrieved successfully',
      data: {
        nextStep,
        completionPercentage,
        statusMessage,
      },
    };
  }

  @Get('can-access/:feature')
  @ApiOperation({ summary: 'Check if nurse can access a specific feature' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Feature access check completed'
  })
  async canAccessFeature(
    @Request() req,
    @Request() { params }: { params: { feature: string } }
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: { canAccess: boolean; feature: string };
  }> {
    const userId = req.user.id;
    const feature = params.feature;
    
    if (req.user.role !== 'nurse') {
      throw new ForbiddenException('Only nurses can check feature access');
    }

    const canAccess = await this.nurseProfileStatusService.canAccessFeature(userId, feature);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Feature access check for ${feature} completed`,
      data: { canAccess, feature },
    };
  }

  @Get('completion-percentage')
  @ApiOperation({ summary: 'Get profile completion percentage' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Completion percentage retrieved successfully'
  })
  async getCompletionPercentage(@Request() req): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: { percentage: number; isComplete: boolean };
  }> {
    const userId = req.user.id;
    
    if (req.user.role !== 'nurse') {
      throw new ForbiddenException('Only nurses can check completion percentage');
    }

    const [percentage, isComplete] = await Promise.all([
      this.nurseProfileStatusService.getCompletionPercentage(userId),
      this.nurseProfileStatusService.isProfileComplete(userId),
    ]);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Completion percentage retrieved successfully',
      data: { percentage, isComplete },
    };
  }

  @Get('status-message')
  @ApiOperation({ summary: 'Get user-friendly status message' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Status message retrieved successfully'
  })
  async getStatusMessage(@Request() req): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: { statusMessage: string };
  }> {
    const userId = req.user.id;
    
    if (req.user.role !== 'nurse') {
      throw new ForbiddenException('Only nurses can check status message');
    }

    const statusMessage = await this.nurseProfileStatusService.getStatusMessage(userId);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Status message retrieved successfully',
      data: { statusMessage },
    };
  }
}
