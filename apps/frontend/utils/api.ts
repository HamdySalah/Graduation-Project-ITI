import axios from 'axios';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

console.log('API URL:', API_URL); // Debug API URL

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if you need to send cookies
  timeout: 15000, // 15 seconds timeout
});

// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    // Debug response data in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('Status:', response.status);
      console.log('Data:', response.data);
      console.log('Headers:', response.headers);
      console.groupEnd();
    }
    return response;
  },
  (error) => {
    // Create a structured error log
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      request: error.config?.data ? JSON.parse(error.config.data) : {},
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    };
    
    // Log detailed error information
    console.group('API Error');
    console.error(errorDetails);
    console.groupEnd();
    
    // Add a descriptive property to the error object for easier handling
    if (error.response) {
      // Server responded with error status
      error.isApiError = true;
      
      // Add specific error types for easier handling in components
      if (error.response.status === 400) error.isValidationError = true;
      if (error.response.status === 401) error.isAuthError = true;
      if (error.response.status === 403) error.isPermissionError = true;
      if (error.response.status === 404) error.isNotFoundError = true;
      if (error.response.status === 409) error.isConflictError = true;
      if (error.response.status >= 500) error.isServerError = true;
      
      // Extract error messages for easy access
      if (error.response.data) {
        // Handle different error formats
        if (typeof error.response.data === 'string') {
          error.errorMessage = error.response.data;
        } else if (error.response.data.message) {
          if (Array.isArray(error.response.data.message)) {
            error.errorMessage = error.response.data.message.join(', ');
            error.errorMessages = error.response.data.message;
          } else {
            error.errorMessage = error.response.data.message;
          }
        } else if (error.response.data.error) {
          error.errorMessage = error.response.data.error;
        }
      }
    } else if (error.request) {
      // No response received
      error.isNetworkError = true;
      error.errorMessage = 'No response received from server. Please check your connection.';
    } else {
      // Error in request configuration
      error.isRequestError = true;
      error.errorMessage = 'Error in request configuration.';
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      error.errorMessage = 'Network error. Please check your internet connection or ensure the backend server is running.';
    }
    
    // Handle expired token or unauthorized errors
    if (error.response?.status === 401) {
      // Clear token and user from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page if not already there
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
