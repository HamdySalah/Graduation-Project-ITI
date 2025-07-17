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
  ForbiddenException,
  UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NurseProfileCompletionService } from '../services/nurse-profile-completion.service';
import {
  Step1BasicInfoDto,
  Step2VerificationDto,
  Step3CompleteProfileDto,
  ProfileCompletionStatusDto
} from '../dto/nurse-profile-completion.dto';

// File upload configuration for documents
const documentFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/)) {
    return callback(new BadRequestException('Only PDF, DOC, DOCX, and image files are allowed!'), false);
  }
  callback(null, true);
};

const createDocumentStorage = () => {
  return diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(process.cwd(), 'uploads', 'nurse-documents');
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
    }
  });
};

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
    const userId = req.user.id;
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
    const userId = req.user.id;
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
    const userId = req.user.id;
    
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
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'licenseDocument', maxCount: 1 },
    { name: 'backgroundCheckDocument', maxCount: 1 },
    { name: 'resumeDocument', maxCount: 1 },
  ], {
    storage: createDocumentStorage(),
    fileFilter: documentFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
    }
  }))
  @ApiOperation({ summary: 'Save Step 2: Verification Documents' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Step 2 saved successfully'
  })
  async saveStep2(
    @Request() req,
    @Body() body: any,
    @UploadedFiles() files: { [fieldname: string]: Express.Multer.File[] }
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
  }> {
    const userId = req.user.id;

    if (req.user.role !== 'nurse') {
      throw new ForbiddenException('Only nurses can complete profile');
    }

    // Check if user can access step 2
    const canAccess = await this.profileCompletionService.canAccessStep(userId, 2);
    if (!canAccess) {
      throw new ForbiddenException('Step 1 must be completed first');
    }

    // Validate required fields
    if (!body.licenseNumber || !body.licenseExpirationDate) {
      throw new BadRequestException('License number and expiration date are required');
    }

    // Process uploaded files
    const fileMap: { [key: string]: any } = {};
    if (files) {
      // Handle licenseDocument
      if (files.licenseDocument && files.licenseDocument[0]) {
        const file = files.licenseDocument[0];
        fileMap.licenseDocument = {
          fileName: file.filename,
          originalName: file.originalname,
          fileUrl: `/api/uploads/nurse-documents/${file.filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
        };
      }

      // Handle backgroundCheckDocument
      if (files.backgroundCheckDocument && files.backgroundCheckDocument[0]) {
        const file = files.backgroundCheckDocument[0];
        fileMap.backgroundCheckDocument = {
          fileName: file.filename,
          originalName: file.originalname,
          fileUrl: `/api/uploads/nurse-documents/${file.filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
        };
      }

      // Handle resumeDocument
      if (files.resumeDocument && files.resumeDocument[0]) {
        const file = files.resumeDocument[0];
        fileMap.resumeDocument = {
          fileName: file.filename,
          originalName: file.originalname,
          fileUrl: `/api/uploads/nurse-documents/${file.filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
        };
      }
    }

    // Create Step2VerificationDto with form data and file info
    const step2Data: Step2VerificationDto = {
      licenseNumber: body.licenseNumber,
      licenseExpirationDate: body.licenseExpirationDate,
      licenseDocument: fileMap.licenseDocument,
      backgroundCheckDocument: fileMap.backgroundCheckDocument,
      resumeDocument: fileMap.resumeDocument,
    };

    await this.profileCompletionService.saveStep2(userId, step2Data);
    
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
    const userId = req.user.id;
    
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
    const userId = req.user.id;
    
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
    const userId = req.user.id;
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
