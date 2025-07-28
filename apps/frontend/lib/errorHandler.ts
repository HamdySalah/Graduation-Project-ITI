import { CustomError, ErrorCode, createErrorFromResponse } from './errors';

// Error Handler Utility
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Map<ErrorCode, (error: CustomError) => void> = new Map();

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Register callback for specific error codes
  public onError(code: ErrorCode, callback: (error: CustomError) => void): void {
    this.errorCallbacks.set(code, callback);
  }

  // Handle error and execute registered callbacks
  public handleError(error: Error | CustomError): CustomError {
    let customError: CustomError;

    if (error instanceof CustomError) {
      customError = error;
    } else {
      // Convert regular Error to CustomError
      customError = new CustomError(
        ErrorCode.UNKNOWN_ERROR,
        error.message,
        'An unexpected error occurred. Please try again.',
        500,
        { originalError: error.name }
      );
    }

    // Log error for debugging
    console.error('Error handled:', customError.toJSON());

    // Execute registered callback if exists
    const callback = this.errorCallbacks.get(customError.code);
    if (callback) {
      callback(customError);
    }

    return customError;
  }

  // Handle API response errors
  public async handleApiError(response: Response): Promise<CustomError> {
    let errorData: any = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch (parseError) {
      console.warn('Failed to parse error response:', parseError);
      errorData = { message: response.statusText };
    }

    const customError = createErrorFromResponse(response, errorData);
    return this.handleError(customError);
  }

  // Handle network errors
  public handleNetworkError(error: any): CustomError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.handleError(new CustomError(
        ErrorCode.NETWORK_ERROR,
        'Network request failed',
        'Unable to connect to the server. Please check your internet connection.',
        0,
        error
      ));
    }

    if (error.name === 'AbortError') {
      return this.handleError(new CustomError(
        ErrorCode.TIMEOUT,
        'Request timeout',
        'The request took too long to complete. Please try again.',
        408,
        error
      ));
    }

    return this.handleError(error);
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleAuthError = (error: any): CustomError => {
  if (error.message?.toLowerCase().includes('invalid credentials')) {
    return errorHandler.handleError(new CustomError(
      ErrorCode.INVALID_CREDENTIALS,
      'Invalid credentials provided',
      'Invalid email or password. Please check your credentials and try again.',
      401
    ));
  }

  if (error.message?.toLowerCase().includes('token expired')) {
    return errorHandler.handleError(new CustomError(
      ErrorCode.TOKEN_EXPIRED,
      'Authentication token expired',
      'Your session has expired. Please log in again.',
      401
    ));
  }

  return errorHandler.handleError(error);
};

export const handleValidationError = (fieldErrors: Record<string, string>): CustomError => {
  const firstError = Object.entries(fieldErrors)[0];
  const fieldName = firstError?.[0] || 'field';
  const errorMessage = firstError?.[1] || 'Validation failed';

  return errorHandler.handleError(new CustomError(
    ErrorCode.VALIDATION_FAILED,
    `Validation failed for ${fieldName}: ${errorMessage}`,
    `Please check your ${fieldName}: ${errorMessage}`,
    400,
    fieldErrors
  ));
};

export const handleFileUploadError = (file: File, maxSize: number, allowedTypes: string[]): CustomError | null => {
  if (file.size > maxSize) {
    return errorHandler.handleError(new CustomError(
      ErrorCode.FILE_TOO_LARGE,
      `File size ${file.size} exceeds maximum ${maxSize}`,
      `File is too large. Maximum allowed size is ${Math.round(maxSize / 1024 / 1024)}MB.`,
      413,
      { fileSize: file.size, maxSize }
    ));
  }

  const fileType = file.type;
  if (!allowedTypes.includes(fileType)) {
    return errorHandler.handleError(new CustomError(
      ErrorCode.INVALID_FILE_TYPE,
      `File type ${fileType} not allowed`,
      `Invalid file type. Please upload one of: ${allowedTypes.join(', ')}.`,
      400,
      { fileType, allowedTypes }
    ));
  }

  return null;
};

// Error boundary helper for React components
export const withErrorBoundary = (error: Error, errorInfo: any) => {
  const customError = errorHandler.handleError(error);
  
  // You can send this to an error reporting service
  console.error('React Error Boundary caught an error:', {
    error: customError.toJSON(),
    errorInfo
  });

  return customError;
};

// Setup global error handlers
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    const customError = errorHandler.handleError(event.reason);
    
    // Prevent the default browser error handling
    event.preventDefault();
    
    // You could show a toast notification here
    console.warn('Unhandled error:', customError.userMessage);
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    const customError = errorHandler.handleError(event.error);
    
    // You could show a toast notification here
    console.warn('Uncaught error:', customError.userMessage);
  });
};

// Error message formatter for UI
export const formatErrorForUI = (error: CustomError | Error | string): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof CustomError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    // Try to make common error messages more user-friendly
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    if (message.includes('timeout')) {
      return 'The request took too long. Please try again.';
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'You are not authorized to perform this action.';
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return 'Access denied. You do not have permission to perform this action.';
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource could not be found.';
    }
    
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Retry mechanism for failed operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw errorHandler.handleError(lastError);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw errorHandler.handleError(lastError!);
};
