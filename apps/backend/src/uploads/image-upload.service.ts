import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
// Import sharp conditionally to handle cases where it's not installed
let sharp: any;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp not available, image processing will be skipped');
  sharp = null;
}

@Injectable()
export class ImageUploadService {
  private readonly logger = new Logger(ImageUploadService.name);
  private readonly uploadPath: string;
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  constructor(private configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'uploads', 'images');
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadPath}`);
    }
  }

  getMulterConfig(): multer.Options {
    return {
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files (JPEG, PNG, WebP) are allowed'), false);
        }
      },
      limits: {
        fileSize: this.maxFileSize,
        files: 5, // Maximum 5 files per request
      },
    };
  }

  async processImage(filePath: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
  }): Promise<string> {
    try {
      const { width = 800, height = 600, quality = 80 } = options || {};

      // Get original file extension and create processed filename
      const originalExt = path.extname(filePath);
      const baseName = path.basename(filePath, originalExt);
      const processedFileName = `processed-${baseName}.jpg`; // Always convert to JPG for consistency
      const processedPath = path.join(this.uploadPath, processedFileName);

      this.logger.log(`Processing image: ${filePath} -> ${processedPath}`);

      // Check if Sharp is available
      if (!sharp) {
        this.logger.warn('Sharp not available, skipping image processing');
        // Just rename the file without processing
        const newFileName = `processed-${path.basename(filePath)}`;
        const newPath = path.join(this.uploadPath, newFileName);
        fs.renameSync(filePath, newPath);
        return newFileName;
      }

      await sharp(filePath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toFile(processedPath);

      // Remove original file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      this.logger.log(`Image processed successfully: ${processedFileName}`);
      return processedFileName;
    } catch (error) {
      this.logger.error(`Error processing image: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);

      // Fallback: just rename the file without processing
      try {
        const fallbackFileName = `fallback-${path.basename(filePath)}`;
        const fallbackPath = path.join(this.uploadPath, fallbackFileName);
        fs.renameSync(filePath, fallbackPath);
        this.logger.log(`Image processing failed, using fallback: ${fallbackFileName}`);
        return fallbackFileName;
      } catch (fallbackError) {
        this.logger.error(`Fallback also failed: ${fallbackError.message}`);
        throw new BadRequestException('Failed to process image');
      }
    }
  }

  async deleteImage(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadPath, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Image deleted: ${filename}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting image: ${error.message}`);
    }
  }

  getImageUrl(filename: string): string {
    return `/uploads/images/${filename}`;
  }

  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size too large. Maximum size is 5MB');
    }
  }

  async saveImageMetadata(imageData: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedBy: string;
    requestId?: string;
  }) {
    // This could be saved to database if needed
    this.logger.log(`Image metadata saved: ${JSON.stringify(imageData)}`);
    return imageData;
  }
}
