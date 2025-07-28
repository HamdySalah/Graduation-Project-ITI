import { errorHandler, setupGlobalErrorHandlers } from './errorHandler';
import { ErrorCode, CustomError } from './errors';

// Setup global error handling for the application
export const initializeErrorHandling = () => {
  // Setup global error handlers for unhandled errors
  setupGlobalErrorHandlers();

  // Register specific error handlers
  registerErrorHandlers();

  console.log('✅ Error handling system initialized');
};

// Register specific error handlers for different error types
const registerErrorHandlers = () => {
  // Handle authentication errors
  errorHandler.onError(ErrorCode.INVALID_CREDENTIALS, (error) => {
    console.warn('🔒 Invalid credentials detected:', error.userMessage);
    // Could redirect to login page or show specific UI
  });

  errorHandler.onError(ErrorCode.TOKEN_EXPIRED, (error) => {
    console.warn('⏰ Token expired:', error.userMessage);
    // Could automatically redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      // window.location.href = '/login';
    }
  });

  errorHandler.onError(ErrorCode.UNAUTHORIZED, (error) => {
    console.warn('🚫 Unauthorized access:', error.userMessage);
    // Could show unauthorized message or redirect
  });

  // Handle network errors
  errorHandler.onError(ErrorCode.NETWORK_ERROR, (error) => {
    console.warn('🌐 Network error detected:', error.userMessage);
    // Could show offline indicator or retry mechanism
  });

  errorHandler.onError(ErrorCode.SERVER_ERROR, (error) => {
    console.error('🔧 Server error detected:', error.userMessage);
    // Could show maintenance message
  });

  // Handle validation errors
  errorHandler.onError(ErrorCode.VALIDATION_FAILED, (error) => {
    console.warn('📝 Validation error:', error.userMessage);
    // Could focus on the problematic field
  });

  // Handle business logic errors
  errorHandler.onError(ErrorCode.APPLICATION_ALREADY_SUBMITTED, (error) => {
    console.info('ℹ️ Duplicate application:', error.userMessage);
    // Could redirect to applications page
  });

  errorHandler.onError(ErrorCode.NURSE_NOT_VERIFIED, (error) => {
    console.warn('👩‍⚕️ Nurse not verified:', error.userMessage);
    // Could redirect to verification status page
  });

  // Handle file upload errors
  errorHandler.onError(ErrorCode.FILE_TOO_LARGE, (error) => {
    console.warn('📁 File too large:', error.userMessage);
    // Could show file size guidelines
  });

  errorHandler.onError(ErrorCode.INVALID_FILE_TYPE, (error) => {
    console.warn('📄 Invalid file type:', error.userMessage);
    // Could show allowed file types
  });
};

// Error reporting utilities
export const reportError = (error: CustomError, context?: any) => {
  const errorReport = {
    ...error.toJSON(),
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    timestamp: new Date().toISOString()
  };

  // Log to console for development
  console.error('Error Report:', errorReport);

  // In production, you would send this to an error reporting service
  // Example: Sentry, LogRocket, Bugsnag, etc.
  /*
  if (process.env.NODE_ENV === 'production') {
    // Send to error reporting service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    }).catch(console.error);
  }
  */
};

// User-friendly error messages for common scenarios
export const getErrorGuidance = (error: CustomError): string | null => {
  switch (error.code) {
    case ErrorCode.INVALID_CREDENTIALS:
      return 'Double-check your email and password. If you forgot your password, use the "Forgot Password" link.';
    
    case ErrorCode.NETWORK_ERROR:
      return 'Check your internet connection and try again. If the problem persists, the server might be temporarily unavailable.';
    
    case ErrorCode.NURSE_NOT_VERIFIED:
      return 'Your nurse account needs to be verified by an administrator before you can apply to requests. Please wait for approval or contact support.';
    
    case ErrorCode.APPLICATION_ALREADY_SUBMITTED:
      return 'You can view your existing application in the "My Applications" section.';
    
    case ErrorCode.FILE_TOO_LARGE:
      return 'Try compressing your file or use a smaller image. Most files should be under 10MB.';
    
    case ErrorCode.VALIDATION_FAILED:
      return 'Please check all required fields and make sure they contain valid information.';
    
    default:
      return null;
  }
};

// Error recovery suggestions
export const getRecoveryActions = (error: CustomError): Array<{
  label: string;
  action: () => void;
}> => {
  const actions: Array<{ label: string; action: () => void }> = [];

  switch (error.code) {
    case ErrorCode.NETWORK_ERROR:
      actions.push({
        label: 'Retry',
        action: () => window.location.reload()
      });
      break;
    
    case ErrorCode.TOKEN_EXPIRED:
      actions.push({
        label: 'Login Again',
        action: () => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
      });
      break;
    
    case ErrorCode.NURSE_NOT_VERIFIED:
      actions.push({
        label: 'Check Status',
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/verification-status';
          }
        }
      });
      break;
    
    case ErrorCode.APPLICATION_ALREADY_SUBMITTED:
      actions.push({
        label: 'View Applications',
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/applications';
          }
        }
      });
      break;
  }

  return actions;
};

// Development helpers
export const logErrorStats = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Error Handling System Status');
    console.log('✅ Global error handlers: Active');
    console.log('✅ Custom error classes: Available');
    console.log('✅ Error display components: Ready');
    console.log('✅ API error handling: Integrated');
    console.groupEnd();
  }
};

// Initialize error handling when this module is imported
if (typeof window !== 'undefined') {
  // Only run in browser environment
  initializeErrorHandling();
  logErrorStats();
}
