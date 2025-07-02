import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  details?: any;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      return {
        statusCode: status,
        timestamp,
        path,
        method,
        message: this.extractMessage(exceptionResponse),
        error: exception.name,
      };
    }

    // Handle MongoDB errors
    if (this.isMongoError(exception)) {
      return this.handleMongoError(exception, timestamp, path, method);
    }

    // Handle validation errors
    if (exception instanceof Error && exception.name === 'ValidationError') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
        method,
        message: 'Validation failed',
        error: 'ValidationError',
        details: exception.message,
      };
    }

    // Handle unknown errors
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
      method,
      message: 'Internal server error',
      error: 'InternalServerError',
    };
  }

  private extractMessage(exceptionResponse: any): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object') {
      return exceptionResponse.message || exceptionResponse.error || 'Unknown error';
    }

    return 'Unknown error';
  }

  private isMongoError(exception: unknown): exception is MongoError {
    return exception instanceof Error && exception.name.includes('Mongo');
  }

  private handleMongoError(
    error: MongoError,
    timestamp: string,
    path: string,
    method: string,
  ): ErrorResponse {
    // Handle duplicate key error
    if (error.message.includes('duplicate key')) {
      return {
        statusCode: HttpStatus.CONFLICT,
        timestamp,
        path,
        method,
        message: 'Resource already exists',
        error: 'DuplicateKeyError',
      };
    }

    // Handle validation error
    if (error.message.includes('validation')) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
        method,
        message: 'Invalid data provided',
        error: 'ValidationError',
      };
    }

    // Default MongoDB error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
      method,
      message: 'Database error occurred',
      error: 'DatabaseError',
    };
  }

  private logError(exception: unknown, request: Request, errorResponse: ErrorResponse): void {
    const { statusCode, message } = errorResponse;
    const { method, url, ip, headers } = request;

    const logMessage = `${method} ${url} - ${statusCode} - ${ip} - ${JSON.stringify(message)}`;

    if (statusCode >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : exception);
    } else if (statusCode >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }

    // Log additional context for debugging
    if (statusCode >= 500) {
      this.logger.debug('Request headers:', JSON.stringify(headers, null, 2));
      this.logger.debug('Exception details:', exception);
    }
  }
}
