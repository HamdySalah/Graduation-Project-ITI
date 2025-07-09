import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { 
  extractAuthData, 
  handleApiError, 
  showApiErrorToast, 
  safeApiCall 
} from '../utils/apiHelpers';

// Define types
export type UserRole = 'admin' | 'nurse' | 'patient';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

export type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  coordinates: [number, number];
  address?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  specializations?: string[];
  education?: string;
  certifications?: string[];
  hourlyRate?: number;
  bio?: string;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      // The API utility will automatically add the token to requests
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      // Debug the response in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Login response:', response);
        console.log('Response structure:', JSON.stringify(response.data, null, 2));
      }
      
      // Handle different response structures
      const responseData = response.data;
      const access_token = responseData?.access_token || responseData?.data?.access_token;
      const user = responseData?.user || responseData?.data?.user;
      
      if (!access_token || !user) {
        console.error('Invalid login response format:', response.data);
        setError('The server response was invalid. Please try again or contact support.');
        return;
      }
      
      // Store auth data
      setToken(access_token);
      setUser(user);
      
      // Store in localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show success message
      toast.success('Login successful!', { duration: 3000 });
      
      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'nurse') {
        router.push('/nurse/dashboard');
      } else {
        router.push('/dashboard');
      }
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error cases
      let errorMessage: string;
      
      if (err.response?.status === 401) {
        // Check if it's specifically about unverified email
        if (err.response?.data?.message?.includes('email not verified')) {
          errorMessage = 'Your email is not verified. Please check your inbox for a verification email or request a new one.';
        } else {
          errorMessage = 'Invalid email or password. Please try again.';
        }
      } else if (err.response?.status === 403) {
        errorMessage = 'Your account has been disabled. Please contact support.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection or try again later.';
      } else {
        errorMessage = err.response?.data?.message || err.message || 'An error occurred during login';
      }
      
      // Display the error
      toast.error(errorMessage, { duration: 5000 });
      setError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/register', userData);
      
      // Debug the response in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Register response:', response);
        console.log('Response structure:', JSON.stringify(response.data, null, 2));
      }
      
      // Handle different response structures
      const responseData = response.data;
      const access_token = responseData?.access_token || responseData?.data?.access_token;
      const user = responseData?.user || responseData?.data?.user;
      
      if (!access_token || !user) {
        console.error('Invalid response format:', response.data);
        setError('The server response was invalid. Please try again or contact support.');
        return;
      }
      
      // Store auth data
      setToken(access_token);
      setUser(user);
      
      // Store in localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show success message about email verification
      toast.success('Registration successful! Please check your email to verify your account.', {
        duration: 5000,
        position: 'top-center',
      });
      
      // Handle routing based on user role
      if (user.role === 'nurse' && user.status === 'pending') {
        router.push('/verification-pending');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'nurse') {
        router.push('/nurse/dashboard');
      } else {
        router.push('/dashboard');
      }
      
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle specific error cases
      let errorMessage: string;
      
      if (err.response?.status === 409) {
        errorMessage = 'User with this email already exists. Please try logging in or use a different email.';
      } else if (err.response?.status === 400) {
        // For validation errors, attempt to extract specific field errors
        if (Array.isArray(err.response?.data?.message)) {
          errorMessage = err.response.data.message.join(', ');
        } else {
          errorMessage = err.response?.data?.message || 'Please check your information and try again.';
        }
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection or try again later.';
      } else {
        errorMessage = err.response?.data?.message || err.message || 'An error occurred during registration';
      }
      
      // Display the error
      toast.error(errorMessage, { duration: 5000 });
      setError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to home page
    router.push('/');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('AuthContext not available - make sure you are using AuthProvider');
    // Rather than throwing an error, return a default context
    return {
      user: null,
      token: null,
      isLoading: false,
      error: 'AuthContext not available',
      login: async () => { console.error('Auth not initialized'); },
      register: async () => { console.error('Auth not initialized'); },
      logout: () => { console.error('Auth not initialized'); },
      clearError: () => { console.error('Auth not initialized'); }
    };
  }
  return context;
};
