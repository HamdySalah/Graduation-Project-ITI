import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpStatus,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NurseProfileCompletionService } from '../services/nurse-profile-completion.service';
import { 
  Step1BasicInfoDto, 
  Step2VerificationDto, 
  Step3CompleteProfileDto,
  ProfileCompletionStatusDto 
} from '../dto/nurse-profile-completion.dto';

@ApiTags('Nurse Profile Completion')
@Controller('api/nurse-profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NurseProfileCompletionController {
  constructor(
    private readonly profileCompletionService: NurseProfileCompletionService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get profile completion status' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Profile completion status retrieved successfully',
    type: ProfileCompletionStatusDto
  })
  async getProfileStatus(@Request() req): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: ProfileCompletionStatusDto;
  }> {
    const userId = req.user.sub;
    const status = await this.profileCompletionService.getProfileStatus(userId);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Profile status retrieved successfully',
      data: status,
    };
  }

  @Get('step/:stepNumber')
  @ApiOperation({ summary: 'Get data for a specific step' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Step data retrieved successfully'
  })
  async getStepData(
    @Request() req,
    @Param('stepNumber') stepNumber: string
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    const userId = req.user.sub;
    const step = parseInt(stepNumber);
    
    if (step < 1 || step > 3) {
      throw new BadRequestException('Step number must be between 1 and 3');
    }

    // Check if user can access this step
    const canAccess = await this.profileCompletionService.canAccessStep(userId, step);
    if (!canAccess) {
      throw new ForbiddenException('Previous steps must be completed first');
    }

    const data = await this.profileCompletionService.getStepData(userId, step);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Step ${step} data retrieved successfully`,
      data,
    };
  }

  @Post('step1')
  @ApiOperation({ summary: 'Save Step 1: Basic Information' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Step 1 saved successfully'
  })
  async saveStep1(
    @Request() req,
    @Body() data: Step1BasicInfoDto
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
  }> {
    const userId = req.user.sub;
    
    if (req.user.role !== 'nurse') {
      throw new ForbiddenException('Only nurses can complete profile');
    }

    await this.profileCompletionService.saveStep1(userId, data);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Step 1 completed successfully',
    };
  }

  @Post('step2')
  @ApiOperation({ summary: 'Save Step 2: Verification Documents' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Step 2 saved successfully'
  })
  async saveStep2(
    @Request() req,
    @Body() data: Step2VerificationDto
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
  }> {
    const userId = req.user.sub;
    
    if (req.user.role !== 'nurse') {
      throw new ForbiddenException('Only nurses can complete profile');
    }

    // Check if user can access step 2
    const canAccess = await this.profileCompletionService.canAccessStep(userId, 2);
    if (!canAccess) {
      throw new ForbiddenException('Step 1 must be completed first');
    }

    await this.profileCompletionService.saveStep2(userId, data);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Step 2 completed successfully',
    };
  }

  @Post('step3')
  @ApiOperation({ summary: 'Save Step 3: Complete Profile' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Step 3 saved successfully'
  })
  async saveStep3(
    @Request() req,
    @Body() data: Step3CompleteProfileDto
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
  }> {
    const userId = req.user.sub;
    
    if (req.user.role !== 'nurse') {
      throw new ForbiddenException('Only nurses can complete profile');
    }

    // Check if user can access step 3
    const canAccess = await this.profileCompletionService.canAccessStep(userId, 3);
    if (!canAccess) {
      throw new ForbiddenException('Previous steps must be completed first');
    }

    await this.profileCompletionService.saveStep3(userId, data);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Step 3 completed successfully',
    };
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit profile for admin review' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Profile submitted successfully'
  })
  async submitProfile(@Request() req): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
  }> {
    const userId = req.user.sub;
    
    if (req.user.role !== 'nurse') {
      throw new ForbiddenException('Only nurses can submit profile');
    }

    await this.profileCompletionService.submitProfile(userId);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Profile submitted for review successfully',
    };
  }

  @Get('can-access/:stepNumber')
  @ApiOperation({ summary: 'Check if user can access a specific step' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Access check completed'
  })
  async canAccessStep(
    @Request() req,
    @Param('stepNumber') stepNumber: string
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: { canAccess: boolean };
  }> {
    const userId = req.user.sub;
    const step = parseInt(stepNumber);
    
    if (step < 1 || step > 3) {
      throw new BadRequestException('Step number must be between 1 and 3');
    }

    const canAccess = await this.profileCompletionService.canAccessStep(userId, step);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Access check for step ${step} completed`,
      data: { canAccess },
    };
  }
}
