import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Request,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImageUploadService } from './image-upload.service';

@ApiTags('Image Upload')
@Controller('api/uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ImageUploadController {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  @Post('images')
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  @UseInterceptors(FilesInterceptor('images', 5))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    try {
      const uploadedImages = [];

      for (const file of files) {
        // Validate each file
        this.imageUploadService.validateImageFile(file);

        // Process the image (resize, compress)
        const processedFilename = await this.imageUploadService.processImage(file.path, {
          width: 800,
          height: 600,
          quality: 80,
        });

        // Save metadata
        const imageMetadata = await this.imageUploadService.saveImageMetadata({
          filename: processedFilename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: req.user._id.toString(),
        });

        uploadedImages.push({
          filename: processedFilename,
          originalName: file.originalname,
          url: this.imageUploadService.getImageUrl(processedFilename),
          size: file.size,
        });
      }

      return {
        success: true,
        message: 'Images uploaded successfully',
        data: {
          images: uploadedImages,
          count: uploadedImages.length,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  @Get('test')
  @ApiOperation({ summary: 'Test upload endpoint' })
  async testUpload() {
    const uploadPath = path.join(process.cwd(), 'uploads', 'images');
    const exists = fs.existsSync(uploadPath);

    return {
      success: true,
      message: 'Upload endpoint is working',
      uploadPath,
      directoryExists: exists,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('image')
  @ApiOperation({ summary: 'Upload single image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    console.log('📸 Upload image called with file:', file ? file.originalname : 'No file');

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      console.log('📸 File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      });

      // Validate file
      this.imageUploadService.validateImageFile(file);
      console.log('📸 File validation passed');

      // For now, skip image processing to avoid Sharp issues
      console.log('📸 Skipping image processing for now...');
      const processedFilename = path.basename(file.path);
      console.log('📸 Using original filename:', processedFilename);

      // Save metadata
      await this.imageUploadService.saveImageMetadata({
        filename: processedFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: req.user._id.toString(),
      });

      const result = {
        success: true,
        message: 'Image uploaded successfully',
        data: {
          filename: processedFilename,
          originalName: file.originalname,
          url: this.imageUploadService.getImageUrl(processedFilename),
          size: file.size,
        },
      };

      console.log('📸 Upload successful:', result);
      return result;
    } catch (error) {
      console.error('📸 Upload error:', error);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  @Get('images/:filename')
  @ApiOperation({ summary: 'Get image by filename' })
  @ApiResponse({ status: 200, description: 'Image retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const imagePath = path.join(process.cwd(), 'uploads', 'images', filename);
      
      if (!fs.existsSync(imagePath)) {
        throw new NotFoundException('Image not found');
      }

      // Set appropriate headers
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Stream the file
      const imageStream = fs.createReadStream(imagePath);
      imageStream.pipe(res);
    } catch (error) {
      throw new NotFoundException('Image not found');
    }
  }

  @Delete('images/:filename')
  @ApiOperation({ summary: 'Delete image by filename' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async deleteImage(
    @Param('filename') filename: string,
    @Request() req: any,
  ) {
    try {
      await this.imageUploadService.deleteImage(filename);

      return {
        success: true,
        message: 'Image deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }
}
