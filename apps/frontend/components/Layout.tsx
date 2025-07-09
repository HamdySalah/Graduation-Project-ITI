import { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth();



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
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 focus:outline-none">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{user.name}</span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50">
                    <div className="py-1">
                      <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</Link>
                      <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Dashboard</Link>
                      {user.role === 'patient' && (
                        <>
                          <Link href="/requests" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">My Requests</Link>
                          <Link href="/requests/create" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Create Request</Link>
                          <Link href="/nurses" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Find Nurses</Link>
                        </>
                      )}
                      {user.role === 'nurse' && (
                        <>
                          <Link href="/requests" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">My Requests</Link>
                        </>
                      )}
                      {user.role === 'admin' && (
                        <Link href="/admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Admin Panel</Link>
                      )}
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
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
