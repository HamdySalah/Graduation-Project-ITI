import React, { useState } from 'react';
import { apiService } from '../lib/api';
import ErrorDisplay, { InlineError } from './ErrorDisplay';
import { 
  CustomError, 
  InvalidCredentialsError, 
  ValidationError, 
  RequiredFieldError,
  NetworkError 
} from '../lib/errors';
import { errorHandler, handleValidationError } from '../lib/errorHandler';

interface LoginFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: CustomError) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<CustomError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setGeneralError(null);
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      const validationError = handleValidationError(fieldErrors);
      setGeneralError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiService.login(formData.email, formData.password);
      
      if (result && result.user) {
        // Success
        if (onSuccess) {
          onSuccess(result.user);
        }
      } else {
        throw new InvalidCredentialsError();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let customError: CustomError;
      
      if (error instanceof CustomError) {
        customError = error;
      } else if (error.message?.toLowerCase().includes('invalid credentials')) {
        customError = new InvalidCredentialsError();
      } else if (error.message?.toLowerCase().includes('network') || 
                 error.name === 'TypeError') {
        customError = new NetworkError();
      } else {
        customError = errorHandler.handleError(error);
      }

      setGeneralError(customError);
      
      if (onError) {
        onError(customError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear general error when user makes changes
    if (generalError) {
      setGeneralError(null);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Sign In
      </h2>

      {/* General Error Display */}
      {generalError && (
        <ErrorDisplay
          error={generalError}
          className="mb-6"
          onDismiss={() => setGeneralError(null)}
          onRetry={() => {
            setGeneralError(null);
            handleSubmit(new Event('submit') as any);
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.email 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          <InlineError error={fieldErrors.email} />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.password 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          <InlineError error={fieldErrors.password} />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          } text-white`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Additional Links */}
      <div className="mt-6 text-center">
        <a 
          href="/forgot-password" 
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Forgot your password?
        </a>
      </div>
      
      <div className="mt-2 text-center">
        <span className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-800">
            Sign up
          </a>
        </span>
      </div>
    </div>
  );
};

export default LoginForm;
