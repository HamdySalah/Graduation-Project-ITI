import { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', roles: ['patient', 'nurse', 'admin'] },
    { name: 'Find Nurses', href: '/nurses', roles: ['patient'] },
    { name: 'My Requests', href: '/requests', roles: ['patient', 'nurse'] },
    { name: 'Create Request', href: '/requests/create', roles: ['patient'] },
    { name: 'Admin Panel', href: '/admin', roles: ['admin'] },
    { name: 'Profile', href: '/profile', roles: ['patient', 'nurse', 'admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    !user || item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">NursePlatform</span>
              </Link>
              
              {user && (
                <div className="hidden md:ml-6 md:flex md:space-x-8">
                  {filteredNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        router.pathname === item.href
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-700">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {title && (
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}

// Status badge component
export function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

// Loading spinner component
export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Card component
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      {children}
    </div>
  );
}
