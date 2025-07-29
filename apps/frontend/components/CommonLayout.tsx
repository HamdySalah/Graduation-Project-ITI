import { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import PatientSidebar from './PatientSidebar';
import NurseSidebar from './NurseSidebar';
import NotificationBell from './NotificationBell';

interface CommonLayoutProps {
  children: ReactNode;
  activeItem?: string;
  title?: string;
  allowedRoles?: string[];
}

export default function CommonLayout({ children, activeItem, title, allowedRoles = ['patient', 'nurse'] }: CommonLayoutProps) {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated or not in allowed roles
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 mx-auto rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You need to be logged in as {allowedRoles.join(' or ')} to access this page.
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 transition duration-200"
          >
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - different for each role */}
      {user.role === 'patient' && <PatientSidebar activeItem={activeItem} />}
      {user.role === 'nurse' && <NurseSidebar activeItem={activeItem} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">{title || 'Dashboard'}</h1>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="relative">
              <button className="flex items-center space-x-2 focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
