// Authentication utilities and context
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'nurse' | 'admin';
  status: 'pending' | 'verified' | 'suspended';
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
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Checking auth status, token exists:', !!token);

      if (!token) {
        console.log('No token found, user not authenticated');
        setLoading(false);
        return;
      }

      console.log('Token found, fetching user profile...');
      const userData = await apiService.getProfile();
      console.log('Profile fetched successfully:', userData);
      setUser(userData as User);
    } catch (error) {
      console.error('Auth check failed:', error);
      console.log('Removing invalid token');
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      console.log('Login response:', response);

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
        console.error('Unexpected response structure:', response);
        throw new Error('Invalid login response format');
      }

      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', token);
      setUser(userData);
      console.log('Login successful, token stored:', token.substring(0, 20) + '...');
    } catch (error) {
      console.error('Login failed:', error);
      // Clear any existing token on login failure
      localStorage.removeItem('token');
      setUser(null);

      // Provide more user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Unable to connect to server. Please check your internet connection.');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          throw new Error('Server error. Please try again later.');
        }
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
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
