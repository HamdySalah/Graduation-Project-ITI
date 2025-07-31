// Authentication utilities and context
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService } from './api';
import { sessionManager } from './sessionManager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'nurse' | 'admin';
  status: 'pending' | 'verified' | 'suspended' | 'rejected';
  phone?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  address?: string;
  nurseProfile?: {
    licenseNumber: string;
    yearsOfExperience: number;
    specializations: string[];
    rating: number;
    totalReviews: number;
    completedJobs: number;
    hourlyRate: number;
    bio: string;
    languages: string[];
    isAvailable: boolean;
    education?: string;
    certifications?: string[];
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Auth provider initializing...');

    // Load user from localStorage immediately for instant UI
    const hasStoredUser = loadUserFromStorage();

    if (hasStoredUser) {
      console.log('User loaded from storage, setting loading to false');
      setLoading(false);

      // Do background auth check without blocking UI
      setTimeout(() => {
        checkAuthStatus();
      }, 1000); // 1 second delay for background verification
    } else {
      console.log('No stored user, checking auth status immediately');
      checkAuthStatus();
    }

    // Initialize session manager with error handling
    try {
      sessionManager.init();
    } catch (error) {
      console.error('Failed to initialize session manager:', error);
    }

    // Cleanup on unmount
    return () => {
      sessionManager.cleanup();
    };
  }, []);

  // Load user data from localStorage
  const loadUserFromStorage = (): boolean => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        const userData = JSON.parse(storedUser);
        console.log('Loading user from localStorage:', userData.email);
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return false;
    }
  };

  // Save user data to localStorage
  const saveUserToStorage = (userData: User) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('User data saved to localStorage');
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  };

  // Clear user data from localStorage
  const clearUserFromStorage = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiration');
    localStorage.removeItem('bypass_auth');
    console.log('User data cleared from localStorage');
  };

  // Check if token is expired (with buffer for better UX)
  const isTokenExpired = (): boolean => {
    const tokenExpiration = localStorage.getItem('token_expiration');
    if (!tokenExpiration) return false; // Don't expire if no expiration data

    const expirationTime = parseInt(tokenExpiration);
    const currentTime = Date.now();
    // Add 10 minute buffer to prevent premature expiration
    const bufferTime = 10 * 60 * 1000; // 10 minutes in milliseconds
    const isExpired = currentTime >= (expirationTime + bufferTime);

    if (isExpired) {
      console.log('Token has expired (with 10 minute buffer)');
    }

    return isExpired;
  };

  const checkAuthStatus = async () => {
    try {
      // Development mode: Check if we should bypass authentication
      const isDevelopment = process.env.NODE_ENV === 'development';
      const bypassAuth = localStorage.getItem('bypass_auth') === 'true';

      if (isDevelopment && bypassAuth) {
        console.log('Development mode: Bypassing authentication');
        const mockUser = {
          id: 'dev-admin',
          name: 'Development Admin',
          email: 'admin@dev.com',
          role: 'admin',
          status: 'verified'
        };
        setUser(mockUser as User);
        saveUserToStorage(mockUser as User);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      console.log('Checking auth status, token exists:', !!token, 'stored user exists:', !!storedUser);

      if (!token) {
        console.log('No token found, user not authenticated');
        clearUserFromStorage();
        setUser(null);
        setLoading(false);
        return;
      }

      // Don't immediately logout on token expiration - let background verification handle it
      if (isTokenExpired()) {
        console.log('Token appears expired, but keeping user logged in for better UX');
      }

      // If we have both token and stored user, use stored user first for faster loading
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Using stored user data for faster loading:', userData.email);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          clearUserFromStorage();
        }
      }

      // Always verify with server in background to ensure token is still valid
      try {
        console.log('Verifying token with server...');
        const userData = await apiService.getProfile();
        console.log('Profile verified successfully:', userData);

        if (userData) {
          const userObj = userData as User;
          setUser(userObj);
          saveUserToStorage(userObj);
        } else {
          console.log('Profile returned null, but keeping stored user for better UX');
          // Don't clear authentication immediately - keep stored user
        }
      } catch (profileError: any) {
        console.error('Profile verification failed:', profileError);

        // Handle different types of errors more conservatively
        if (profileError.status === 401 && !storedUser) {
          console.log('401 error and no stored user, clearing authentication');
          clearUserFromStorage();
          setUser(null);
        } else {
          console.log('Profile verification failed but keeping user logged in for better UX');
          // Keep the user logged in for all other error types
          // This includes network errors, server errors, and cases where we have stored user data
        }
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);

      // Only clear authentication for specific error types
      if (error.status === 401 || error.message?.includes('Unauthorized')) {
        console.log('Clearing authentication due to auth error');
        clearUserFromStorage();
        setUser(null);
      } else {
        console.log('Non-auth error during auth check, keeping user logged in');
        // For other errors, keep the user logged in if we have stored data
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      
      // Check if we got an error response for invalid credentials
      if (response && typeof response === 'object' && 'success' in response && response.success === false) {
        // Simply throw the error message without stack trace
        throw { message: response.error || 'Invalid email or password.' };
      }

      // The backend returns: { success: true, data: { access_token: "...", user: {...} } }
      let token: string;
      let userData: User;

      // Type guard for expected response structure
      if (
        typeof response === 'object' &&
        response !== null &&
        'data' in response &&
        typeof (response as any).data === 'object' &&
        (response as any).data !== null &&
        'access_token' in (response as any).data
      ) {
        token = (response as any).data.access_token;
        userData = (response as any).data.user;
      } else if (
        typeof response === 'object' &&
        response !== null &&
        'access_token' in response
      ) {
        token = (response as any).access_token;
        userData = (response as any).user;
      } else {
        throw { message: 'Invalid email or password.' };
      }

      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', token);

      // Set token expiration tracking
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        localStorage.setItem('token_expiration', expirationTime.toString());
        console.log('Token expires at:', new Date(expirationTime).toLocaleString());
      } catch (error) {
        console.error('Error parsing token for expiration:', error);
      }

      // Clean up application data if this is a nurse account
      if (userData.role === 'nurse') {
        try {
          // Clear nurse applications to prevent mixing data between different nurse accounts
          localStorage.removeItem('nurse_applications');
          console.log('Cleared previous nurse applications data during login');
        } catch (e) {
          console.error('Failed to clean up application data during login:', e);
        }
      }
      
      setUser(userData);
      saveUserToStorage(userData);
      console.log('Login successful, token and user data stored:', token.substring(0, 20) + '...');
      
      // Redirect all users to the homepage regardless of their role
      window.location.href = '/';
    } catch (error) {
      // Clear any existing token on login failure
      localStorage.removeItem('token');
      setUser(null);

      // If it's our custom error object with just a message
      if (error && typeof error === 'object' && 'message' in error) {
        throw { message: error.message };
      }
      
      // For network errors only
      if (error instanceof Error && (
        error.message.includes('fetch') || 
        error.message.includes('connect') ||
        error.message.includes('network')
      )) {
        throw { message: 'Unable to connect to server. Please check your internet connection.' };
      }
      
      // Default case - always show simple message
      throw { message: 'Email or password are wrong.' };
    }
  };

  const logout = () => {
    console.log('Logging out user');
    
    // Clean up application-specific data before logout
    try {
      // Clear nurse applications to prevent mixing data between different nurse accounts
      localStorage.removeItem('nurse_applications');
    } catch (e) {
      console.error('Failed to clean up application data during logout:', e);
    }
    
    clearUserFromStorage();
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (prev) {
        const updatedUser = { ...prev, ...userData };
        saveUserToStorage(updatedUser);
        return updatedUser;
      }
      return null;
    });
  };

  const value = { user, loading, login, logout, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Route protection hook
export function useRequireAuth(requiredRole?: string) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
    if (!loading && user && requiredRole && user.role !== requiredRole) {
      window.location.href = '/unauthorized';
    }
  }, [user, loading, requiredRole]);

  return { user, loading };
}

// Utility functions
export const isAuthenticated = () => {
  return typeof window !== 'undefined' && localStorage.getItem('token') !== null;
};

export const getUserRole = () => {
  // This would typically decode the JWT token to get the role
  // For now, we'll rely on the user context
  return null;
};

export const hasRole = (user: User | null, role: string) => {
  return user?.role === role;
};

export const isNurse = (user: User | null) => hasRole(user, 'nurse');
export const isPatient = (user: User | null) => hasRole(user, 'patient');
export const isAdmin = (user: User | null) => hasRole(user, 'admin');
