import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ImageUploadController } from './image-upload.controller';
import { ImageUploadService } from './image-upload.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uploadPath = require('path').join(process.cwd(), 'uploads', 'images');
        const fs = require('fs');

        // Ensure upload directory exists
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        return {
          storage: require('multer').diskStorage({
            destination: (req, file, cb) => {
              cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              const ext = require('path').extname(file.originalname);
              cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
          }),
          fileFilter: (req, file, cb) => {
            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (allowedMimeTypes.includes(file.mimetype)) {
              cb(null, true);
            } else {
              cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'), false);
            }
          },
          limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
            files: 5, // Maximum 5 files per request
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadsController, ImageUploadController],
  providers: [UploadsService, ImageUploadService],
  exports: [UploadsService, ImageUploadService],
})
export class UploadsModule {}
