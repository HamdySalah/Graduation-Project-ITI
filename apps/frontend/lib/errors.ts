// Custom Error Classes for the Nursing Platform

export enum ErrorCode {
  // Authentication Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_PENDING = 'ACCOUNT_PENDING',
  
  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  
  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Permission Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ADMIN_ONLY = 'ADMIN_ONLY',
  NURSE_ONLY = 'NURSE_ONLY',
  PATIENT_ONLY = 'PATIENT_ONLY',
  
  // Business Logic Errors
  APPLICATION_ALREADY_SUBMITTED = 'APPLICATION_ALREADY_SUBMITTED',
  REQUEST_ALREADY_ACCEPTED = 'REQUEST_ALREADY_ACCEPTED',
  REQUEST_CANNOT_BE_CANCELLED = 'REQUEST_CANNOT_BE_CANCELLED',
  NURSE_NOT_VERIFIED = 'NURSE_NOT_VERIFIED',
  REVIEW_ALREADY_SUBMITTED = 'REVIEW_ALREADY_SUBMITTED',
  
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // File Upload Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED'
}

export class CustomError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Authentication Errors
export class InvalidCredentialsError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password provided',
      'Invalid email or password. Please check your credentials and try again.',
      401,
      details
    );
  }
}

export class TokenExpiredError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.TOKEN_EXPIRED,
      'Authentication token has expired',
      'Your session has expired. Please log in again.',
      401,
      details
    );
  }
}

export class UnauthorizedError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.UNAUTHORIZED,
      'User is not authorized to perform this action',
      'You are not authorized to perform this action.',
      403,
      details
    );
  }
}

export class AccountSuspendedError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.ACCOUNT_SUSPENDED,
      'User account has been suspended',
      'Your account has been suspended. Please contact support for assistance.',
      403,
      details
    );
  }
}

export class AccountPendingError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.ACCOUNT_PENDING,
      'User account is pending verification',
      'Your account is pending verification. Please wait for admin approval.',
      403,
      details
    );
  }
}

// Validation Errors
export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(
      ErrorCode.VALIDATION_FAILED,
      `Validation failed: ${message}`,
      `Please check your input: ${message}`,
      400,
      details
    );
  }
}

export class RequiredFieldError extends CustomError {
  constructor(fieldName: string, details?: any) {
    super(
      ErrorCode.REQUIRED_FIELD_MISSING,
      `Required field missing: ${fieldName}`,
      `${fieldName} is required. Please provide this information.`,
      400,
      details
    );
  }
}

// Resource Errors
export class ResourceNotFoundError extends CustomError {
  constructor(resourceType: string, resourceId?: string, details?: any) {
    super(
      ErrorCode.RESOURCE_NOT_FOUND,
      `${resourceType} not found${resourceId ? ` with ID: ${resourceId}` : ''}`,
      `The requested ${resourceType.toLowerCase()} could not be found.`,
      404,
      details
    );
  }
}

export class ResourceAlreadyExistsError extends CustomError {
  constructor(resourceType: string, details?: any) {
    super(
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      `${resourceType} already exists`,
      `This ${resourceType.toLowerCase()} already exists.`,
      409,
      details
    );
  }
}

// Business Logic Errors
export class ApplicationAlreadySubmittedError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.APPLICATION_ALREADY_SUBMITTED,
      'Application has already been submitted for this request',
      'You have already applied to this request.',
      409,
      details
    );
  }
}

export class RequestAlreadyAcceptedError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.REQUEST_ALREADY_ACCEPTED,
      'Request has already been accepted by another nurse',
      'This request has already been accepted by another nurse.',
      409,
      details
    );
  }
}

export class NurseNotVerifiedError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.NURSE_NOT_VERIFIED,
      'Nurse account is not verified',
      'Your nurse account needs to be verified before you can apply to requests.',
      403,
      details
    );
  }
}

export class ReviewAlreadySubmittedError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.REVIEW_ALREADY_SUBMITTED,
      'Review has already been submitted for this request',
      'You have already submitted a review for this request.',
      409,
      details
    );
  }
}

// Network Errors
export class NetworkError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.NETWORK_ERROR,
      'Network connection failed',
      'Unable to connect to the server. Please check your internet connection and try again.',
      0,
      details
    );
  }
}

export class ServerError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.SERVER_ERROR,
      'Internal server error occurred',
      'Something went wrong on our end. Please try again later.',
      500,
      details
    );
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(details?: any) {
    super(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Service is temporarily unavailable',
      'The service is temporarily unavailable. Please try again later.',
      503,
      details
    );
  }
}

// File Upload Errors
export class FileTooLargeError extends CustomError {
  constructor(maxSize: string, details?: any) {
    super(
      ErrorCode.FILE_TOO_LARGE,
      `File size exceeds maximum allowed size of ${maxSize}`,
      `File is too large. Maximum allowed size is ${maxSize}.`,
      413,
      details
    );
  }
}

export class InvalidFileTypeError extends CustomError {
  constructor(allowedTypes: string[], details?: any) {
    super(
      ErrorCode.INVALID_FILE_TYPE,
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      `Invalid file type. Please upload one of: ${allowedTypes.join(', ')}.`,
      400,
      details
    );
  }
}

// Error Factory Function
export function createErrorFromResponse(response: Response, errorData?: any): CustomError {
  const status = response.status;
  const statusText = response.statusText;
  
  // Try to extract error message from response data
  let message = 'An error occurred';
  let userMessage = 'Something went wrong. Please try again.';
  
  if (errorData?.message) {
    message = errorData.message;
    userMessage = errorData.userMessage || errorData.message;
  }

  switch (status) {
    case 400:
      if (message.toLowerCase().includes('validation')) {
        return new ValidationError(message, errorData);
      }
      return new CustomError(ErrorCode.VALIDATION_FAILED, message, userMessage, status, errorData);
    
    case 401:
      if (message.toLowerCase().includes('invalid credentials') || 
          message.toLowerCase().includes('invalid email') ||
          message.toLowerCase().includes('invalid password')) {
        return new InvalidCredentialsError(errorData);
      }
      if (message.toLowerCase().includes('token') || message.toLowerCase().includes('expired')) {
        return new TokenExpiredError(errorData);
      }
      return new UnauthorizedError(errorData);
    
    case 403:
      if (message.toLowerCase().includes('suspended')) {
        return new AccountSuspendedError(errorData);
      }
      if (message.toLowerCase().includes('pending')) {
        return new AccountPendingError(errorData);
      }
      return new UnauthorizedError(errorData);
    
    case 404:
      return new ResourceNotFoundError('Resource', undefined, errorData);
    
    case 409:
      if (message.toLowerCase().includes('already applied')) {
        return new ApplicationAlreadySubmittedError(errorData);
      }
      if (message.toLowerCase().includes('already accepted')) {
        return new RequestAlreadyAcceptedError(errorData);
      }
      if (message.toLowerCase().includes('already submitted')) {
        return new ReviewAlreadySubmittedError(errorData);
      }
      return new ResourceAlreadyExistsError('Resource', errorData);
    
    case 413:
      return new FileTooLargeError('10MB', errorData);
    
    case 500:
      return new ServerError(errorData);
    
    case 503:
      return new ServiceUnavailableError(errorData);
    
    default:
      return new CustomError(
        ErrorCode.UNKNOWN_ERROR,
        `HTTP ${status}: ${statusText}`,
        userMessage,
        status,
        errorData
      );
  }
}
