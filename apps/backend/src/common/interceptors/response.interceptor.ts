import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => this.transformResponse(data, request, response)),
      tap(() => {
        const duration = Date.now() - startTime;
        this.logRequest(request, response, duration);
      }),
    );
  }

  private transformResponse(data: any, request: Request, response: Response): ApiResponse<T> {
    const statusCode = response.statusCode;
    const timestamp = new Date().toISOString();
    const path = request.url;

    // If data is already in the expected format, return as is
    if (data && typeof data === 'object' && 'success' in data && 'statusCode' in data) {
      return data;
    }

    // Transform the response
    return {
      success: statusCode < 400,
      statusCode,
      message: this.getSuccessMessage(request.method, statusCode),
      data,
      timestamp,
      path,
    };
  }

  private getSuccessMessage(method: string, statusCode: number): string {
    if (statusCode === 201) {
      return 'Resource created successfully';
    }

    if (statusCode === 204) {
      return 'Resource deleted successfully';
    }

    switch (method) {
      case 'GET':
        return 'Data retrieved successfully';
      case 'POST':
        return 'Resource created successfully';
      case 'PUT':
      case 'PATCH':
        return 'Resource updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      default:
        return 'Operation completed successfully';
    }
  }

  private logRequest(request: Request, response: Response, duration: number): void {
    const { method, url, ip } = request;
    const { statusCode } = response;
    const userAgent = request.get('User-Agent') || '';

    const logMessage = `${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - ${userAgent}`;

    if (statusCode >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }
}
