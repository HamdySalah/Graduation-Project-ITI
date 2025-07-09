import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

/**
 * Type-safe extraction of data from API responses
 * Safely extracts the token and user data regardless of nesting structure
 */
export function extractAuthData(response: AxiosResponse) {
  try {
    const responseData = response.data;
    
    // Handle different response structures
    // 1. Direct structure: { access_token, user }
    // 2. Nested structure: { data: { access_token, user } }
    const access_token = responseData?.access_token || responseData?.data?.access_token;
    const user = responseData?.user || responseData?.data?.user;
    
    // Check if we have valid data
    if (!access_token || !user) {
      console.warn('Invalid auth response structure:', responseData);
      return null;
    }
    
    return { access_token, user };
  } catch (err) {
    console.error('Failed to extract auth data:', err);
    return null;
  }
}

/**
 * Safe error handler for API calls
 * Returns a user-friendly error message and handles specific error cases
 */
export function handleApiError(error: any): string {
  // If it's already a string, return it
  if (typeof error === 'string') return error;
  
  // Handle Axios errors with our extended properties
  if (error.isApiError) {
    // Use our pre-processed error message if available
    if (error.errorMessage) return error.errorMessage;
    
    // Handle specific status codes
    if (error.isValidationError) return 'Please check your input and try again.';
    if (error.isAuthError) return 'Authentication failed. Please log in again.';
    if (error.isPermissionError) return 'You do not have permission to perform this action.';
    if (error.isNotFoundError) return 'The requested resource was not found.';
    if (error.isConflictError) return 'This operation caused a conflict, possibly a duplicate entry.';
    if (error.isServerError) return 'The server encountered an error. Please try again later.';
  }
  
  // Handle network errors
  if (error.isNetworkError || error.message === 'Network Error') {
    return 'Network error. Please check your internet connection.';
  }
  
  // Extract message from various error formats
  if (error.response?.data?.message) {
    const message = error.response.data.message;
    return Array.isArray(message) ? message.join(', ') : message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  // Default error message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Show appropriate toast notifications for API responses
 */
export function showApiResponseToast(response: AxiosResponse, successMessage?: string) {
  // Show success toast if provided
  if (successMessage) {
    toast.success(successMessage, { duration: 5000 });
    return true;
  }
  return false;
}

/**
 * Show appropriate toast notifications for API errors
 */
export function showApiErrorToast(error: any, defaultMessage?: string) {
  const errorMessage = handleApiError(error);
  toast.error(errorMessage || defaultMessage || 'An error occurred', { duration: 5000 });
  return errorMessage;
}

/**
 * Handle API data safely with proper error handling
 * @param promise - The API promise to handle
 * @param options - Additional options for handling the response
 */
export async function safeApiCall<T>(
  promise: Promise<AxiosResponse<T>>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
  }
) {
  try {
    const response = await promise;
    
    if (options?.successMessage) {
      showApiResponseToast(response, options.successMessage);
    }
    
    if (options?.onSuccess) {
      options.onSuccess(response.data);
    }
    
    return { data: response.data, error: null, response };
  } catch (error) {
    const errorMsg = showApiErrorToast(error, options?.errorMessage);
    
    if (options?.onError) {
      options.onError(error);
    }
    
    return { data: null, error, errorMessage: errorMsg };
  }
}
