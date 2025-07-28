import React from 'react';
import { CustomError, ErrorCode } from '../lib/errors';
import { formatErrorForUI } from '../lib/errorHandler';

interface ErrorDisplayProps {
  error: CustomError | Error | string | null;
  className?: string;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  className = '',
  showDetails = false,
  onRetry,
  onDismiss
}) => {
  if (!error) return null;

  const getErrorIcon = (error: CustomError | Error | string) => {
    if (typeof error === 'string') return '⚠️';
    
    if (error instanceof CustomError) {
      switch (error.code) {
        case ErrorCode.INVALID_CREDENTIALS:
        case ErrorCode.UNAUTHORIZED:
          return '🔒';
        case ErrorCode.NETWORK_ERROR:
        case ErrorCode.SERVICE_UNAVAILABLE:
          return '🌐';
        case ErrorCode.VALIDATION_FAILED:
        case ErrorCode.REQUIRED_FIELD_MISSING:
          return '📝';
        case ErrorCode.RESOURCE_NOT_FOUND:
          return '🔍';
        case ErrorCode.SERVER_ERROR:
          return '🔧';
        case ErrorCode.FILE_TOO_LARGE:
        case ErrorCode.INVALID_FILE_TYPE:
          return '📁';
        default:
          return '⚠️';
      }
    }
    
    return '⚠️';
  };

  const getErrorColor = (error: CustomError | Error | string) => {
    if (typeof error === 'string') return 'red';
    
    if (error instanceof CustomError) {
      switch (error.code) {
        case ErrorCode.INVALID_CREDENTIALS:
        case ErrorCode.UNAUTHORIZED:
        case ErrorCode.ACCOUNT_SUSPENDED:
          return 'red';
        case ErrorCode.ACCOUNT_PENDING:
        case ErrorCode.NURSE_NOT_VERIFIED:
          return 'yellow';
        case ErrorCode.NETWORK_ERROR:
        case ErrorCode.SERVICE_UNAVAILABLE:
          return 'blue';
        case ErrorCode.VALIDATION_FAILED:
        case ErrorCode.REQUIRED_FIELD_MISSING:
          return 'orange';
        default:
          return 'red';
      }
    }
    
    return 'red';
  };

  const errorMessage = formatErrorForUI(error);
  const errorIcon = getErrorIcon(error);
  const errorColor = getErrorColor(error);

  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800'
  };

  const buttonColorClasses = {
    red: 'bg-red-100 text-red-800 hover:bg-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    orange: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[errorColor]} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl" role="img" aria-label="Error icon">
            {errorIcon}
          </span>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {error instanceof CustomError ? getErrorTitle(error.code) : 'Error'}
          </h3>
          <div className="mt-2 text-sm">
            <p>{errorMessage}</p>
          </div>
          
          {showDetails && error instanceof CustomError && error.details && (
            <div className="mt-3 text-xs">
              <details>
                <summary className="cursor-pointer font-medium">Technical Details</summary>
                <pre className="mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            </div>
          )}
          
          {(onRetry || onDismiss) && (
            <div className="mt-4 flex space-x-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${buttonColorClasses[errorColor]}`}
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const getErrorTitle = (code: ErrorCode): string => {
  switch (code) {
    case ErrorCode.INVALID_CREDENTIALS:
      return 'Invalid Credentials';
    case ErrorCode.TOKEN_EXPIRED:
      return 'Session Expired';
    case ErrorCode.UNAUTHORIZED:
      return 'Access Denied';
    case ErrorCode.ACCOUNT_SUSPENDED:
      return 'Account Suspended';
    case ErrorCode.ACCOUNT_PENDING:
      return 'Account Pending';
    case ErrorCode.VALIDATION_FAILED:
      return 'Validation Error';
    case ErrorCode.REQUIRED_FIELD_MISSING:
      return 'Required Field Missing';
    case ErrorCode.RESOURCE_NOT_FOUND:
      return 'Not Found';
    case ErrorCode.RESOURCE_ALREADY_EXISTS:
      return 'Already Exists';
    case ErrorCode.APPLICATION_ALREADY_SUBMITTED:
      return 'Already Applied';
    case ErrorCode.REQUEST_ALREADY_ACCEPTED:
      return 'Request Taken';
    case ErrorCode.NURSE_NOT_VERIFIED:
      return 'Verification Required';
    case ErrorCode.NETWORK_ERROR:
      return 'Connection Error';
    case ErrorCode.SERVER_ERROR:
      return 'Server Error';
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 'Service Unavailable';
    case ErrorCode.FILE_TOO_LARGE:
      return 'File Too Large';
    case ErrorCode.INVALID_FILE_TYPE:
      return 'Invalid File Type';
    default:
      return 'Error';
  }
};

// Inline error component for forms
export const InlineError: React.FC<{ error: string | null; className?: string }> = ({ 
  error, 
  className = '' 
}) => {
  if (!error) return null;
  
  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {error}
    </p>
  );
};

// Toast-style error notification
export const ErrorToast: React.FC<{
  error: CustomError | Error | string | null;
  onDismiss: () => void;
  duration?: number;
}> = ({ error, onDismiss, duration = 5000 }) => {
  React.useEffect(() => {
    if (error && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [error, duration, onDismiss]);

  if (!error) return null;

  const errorMessage = formatErrorForUI(error);
  const errorIcon = error instanceof CustomError ? 
    (error.code === ErrorCode.NETWORK_ERROR ? '🌐' : '⚠️') : '⚠️';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <span className="text-xl mr-3" role="img" aria-label="Error">
            {errorIcon}
          </span>
          <div className="flex-1">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-2 inline-flex text-red-400 hover:text-red-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
