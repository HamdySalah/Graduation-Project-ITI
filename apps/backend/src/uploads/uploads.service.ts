import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import { existsSync, unlinkSync, createReadStream } from 'fs';
import { Response } from 'express';

@Injectable()
export class UploadsService {
  private readonly uploadsPath = join(process.cwd(), 'uploads');

  async handleProfileImageUpload(file: Express.Multer.File, user: any) {
    const fileUrl = `/uploads/profiles/${file.filename}`;

    return {
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        filename: file.filename,
        originalName: file.originalname,
        fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedAt: new Date(),
      },
    };
  }

  async handleNurseDocumentsUpload(files: Express.Multer.File[], user: any) {
    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      fileUrl: `/uploads/nurse-documents/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(),
    }));

    return {
      success: true,
      message: 'Nurse documents uploaded successfully',
      data: uploadedFiles,
    };
  }

  async handleRequestAttachmentsUpload(files: Express.Multer.File[], requestId: string, user: any) {
    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      fileUrl: `/uploads/request-attachments/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(),
    }));

    return {
      success: true,
      message: 'Request attachments uploaded successfully',
      data: {
        requestId,
        files: uploadedFiles,
      },
    };
  }

  async getFile(directory: string, filename: string, res?: Response) {
    const filePath = join(this.uploadsPath, directory, filename);
    
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    if (res) {
      // Stream the file directly to response
      const fileStream = createReadStream(filePath);
      return fileStream.pipe(res);
    }

    return {
      success: true,
      message: 'File found',
      filePath,
    };
  }

  async deleteFile(directory: string, filename: string, user: any) {
    const filePath = join(this.uploadsPath, directory, filename);
    
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      unlinkSync(filePath);
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to delete file');
    }
  }

  async getUserFiles(userId: string) {
    // This would typically query a database to get user's files
    // For now, return a simple response
    return {
      success: true,
      message: 'User files retrieved successfully',
      data: {
        userId,
        files: [],
      },
    };
  }

  // Helper method to serve files with proper headers
  async serveFile(directory: string, filename: string, res: Response) {
    const filePath = join(this.uploadsPath, directory, filename);
    
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    // Set appropriate headers
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    switch (fileExtension) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'doc':
        contentType = 'application/msword';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const fileStream = createReadStream(filePath);
    return fileStream.pipe(res);
  }
}
