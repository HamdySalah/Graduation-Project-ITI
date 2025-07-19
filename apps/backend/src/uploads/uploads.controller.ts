import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Request,
  Response,
  BadRequestException,
  HttpStatus
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../schemas/user.schema';

// File upload configuration
const imageFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return callback(new BadRequestException('Only image files are allowed!'), false);
  }
  callback(null, true);
};

const documentFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/)) {
    return callback(new BadRequestException('Only PDF, DOC, DOCX, and image files are allowed!'), false);
  }
  callback(null, true);
};

const createStorage = (destination: string) => {
  return diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(process.cwd(), 'uploads', destination);
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

@ApiTags('File Uploads')
@Controller('api/uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('image', {
    storage: createStorage('profiles'),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  }))
  @ApiOperation({
    summary: 'Upload profile image',
    description: 'Upload a profile image for the authenticated user'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile image file',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Profile image file (JPG, PNG, GIF, WebP - max 5MB)'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Profile image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Profile image uploaded successfully' },
        filename: { type: 'string', example: 'image-1642234567890-123456789.jpg' },
        url: { type: 'string', example: '/api/uploads/profiles/image-1642234567890-123456789.jpg' },
        size: { type: 'number', example: 1024000 }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.uploadsService.handleProfileImageUpload(file, req.user);
  }

  @Post('nurse-documents')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @UseInterceptors(FilesInterceptor('documents', 10, {
    storage: createStorage('nurse-documents'),
    fileFilter: documentFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
    }
  }))
  @ApiOperation({
    summary: 'Upload nurse verification documents',
    description: 'Upload verification documents for nurse profile (Nurses only)'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Nurse verification documents',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          },
          description: 'Verification documents (PDF, DOC, DOCX, images - max 10MB each, up to 10 files)'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Documents uploaded successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Only nurses can upload verification documents'
  })
  async uploadNurseDocuments(@UploadedFiles() files: Express.Multer.File[], @Request() req: any) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.uploadsService.handleNurseDocumentsUpload(files, req.user);
  }

  @Post('request-attachments/:requestId')
  @UseInterceptors(FilesInterceptor('attachments', 5, {
    storage: createStorage('request-attachments'),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/)) {
        return callback(new BadRequestException('Only images and documents are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per file
    }
  }))
  @ApiOperation({
    summary: 'Upload request attachments',
    description: 'Upload attachments for a specific request'
  })
  @ApiParam({
    name: 'requestId',
    description: 'Request ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Request attachments',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        attachments: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          },
          description: 'Request attachments (images, PDF, DOC - max 5MB each, up to 5 files)'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Attachments uploaded successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied to this request'
  })
  async uploadRequestAttachments(
    @Param('requestId') requestId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.uploadsService.handleRequestAttachmentsUpload(files, requestId, req.user);
  }

  @Get('profiles/:filename')
  @ApiOperation({
    summary: 'Get profile image',
    description: 'Retrieve a profile image file'
  })
  @ApiParam({
    name: 'filename',
    description: 'Image filename',
    example: 'image-1642234567890-123456789.jpg'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile image retrieved successfully'
  })
  @ApiNotFoundResponse({
    description: 'Image not found'
  })
  async getProfileImage(@Param('filename') filename: string, @Response() res: ExpressResponse) {
    return this.uploadsService.serveFile('profiles', filename, res);
  }

  @Get('nurse-documents/:filename')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get nurse document',
    description: 'Retrieve a nurse verification document (Nurses and Admins only)'
  })
  @ApiParam({
    name: 'filename',
    description: 'Document filename',
    example: 'documents-1642234567890-123456789.pdf'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied to nurse documents'
  })
  @ApiNotFoundResponse({
    description: 'Document not found'
  })
  async getNurseDocument(@Param('filename') filename: string, @Response() res: ExpressResponse) {
    return this.uploadsService.serveFile('nurse-documents', filename, res);
  }

  @Get('request-attachments/:filename')
  @ApiOperation({
    summary: 'Get request attachment',
    description: 'Retrieve a request attachment file'
  })
  @ApiParam({
    name: 'filename',
    description: 'Attachment filename',
    example: 'attachments-1642234567890-123456789.pdf'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attachment retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiNotFoundResponse({
    description: 'Attachment not found'
  })
  async getRequestAttachment(@Param('filename') filename: string, @Response() res: ExpressResponse) {
    return this.uploadsService.serveFile('request-attachments', filename, res);
  }

  @Delete('profiles/:filename')
  @ApiOperation({
    summary: 'Delete profile image',
    description: 'Delete a profile image (only own images)'
  })
  @ApiParam({
    name: 'filename',
    description: 'Image filename',
    example: 'image-1642234567890-123456789.jpg'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile image deleted successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Access denied to this image'
  })
  @ApiNotFoundResponse({
    description: 'Image not found'
  })
  async deleteProfileImage(@Param('filename') filename: string, @Request() req: any) {
    return this.uploadsService.deleteFile('profiles', filename, req.user);
  }

  @Get('my-files')
  @ApiOperation({
    summary: 'Get user\'s uploaded files',
    description: 'Get list of files uploaded by the authenticated user'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User files retrieved successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getUserFiles(@Request() req: any) {
    return this.uploadsService.getUserFiles(req.user._id);
  }
}
