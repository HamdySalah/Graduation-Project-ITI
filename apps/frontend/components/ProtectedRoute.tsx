import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * A wrapper component that protects routes requiring authentication
 * Optionally restrict access based on user roles
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Skip the check if still loading
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!token || !user) {
      router.push('/login');
      return;
    }

    // If roles are specified, check if user has required role
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'nurse':
          router.push('/nurse/dashboard');
          break;
        case 'patient':
          router.push('/dashboard');
          break;
        default:
          router.push('/');
      }
    }
  }, [user, token, isLoading, router, requiredRoles]);

  // Show nothing while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!user || !token || (requiredRoles.length > 0 && !requiredRoles.includes(user.role))) {
    return null;
  }

  // If authenticated and authorized, render children
  return <>{children}</>;
};

export default ProtectedRoute;
