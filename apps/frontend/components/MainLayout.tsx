import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import PatientSidebar from './PatientSidebar';
import NurseSidebar from './NurseSidebar';
import { useRouter } from 'next/router';

interface MainLayoutProps {
  children: ReactNode;
  activeItem?: string;
  skipSidebar?: boolean;
}

export default function MainLayout({ children, activeItem, skipSidebar = false }: MainLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // To prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading state
  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 mx-auto rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access this page.</p>
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
  
  // Render sidebar based on user role
  const Sidebar = user.role === 'patient' ? PatientSidebar : NurseSidebar;

  // Get the current path to determine active item
  const pathname = router.pathname;
  let currentActiveItem = '';
  
  if (user.role === 'nurse') {
    if (pathname === '/dashboard' || pathname === '/') currentActiveItem = 'dashboard';
    else if (pathname === '/requests') currentActiveItem = 'requests';
    else if (pathname.startsWith('/active-requests') || (pathname.startsWith('/my-offers') && router.query.filter === 'accepted')) currentActiveItem = 'active-requests';
    else if (pathname.startsWith('/applications') || pathname.startsWith('/my-offers')) currentActiveItem = 'applications';

    else if (pathname.startsWith('/completed-jobs')) currentActiveItem = 'completed-jobs';
    else if (pathname.startsWith('/notifications')) currentActiveItem = 'notifications';
    else if (pathname.startsWith('/payments')) currentActiveItem = 'payments';

    else if (pathname.startsWith('/profile')) currentActiveItem = 'profile';
    else if (pathname.startsWith('/settings')) currentActiveItem = 'settings';

  } else {
    if (pathname === '/dashboard' || pathname === '/') currentActiveItem = 'dashboard';
    else if (pathname.startsWith('/requests')) currentActiveItem = 'requests';
    else if (pathname === '/nurses') currentActiveItem = 'find-nurses';
    else if (pathname === '/patient-completed-requests') currentActiveItem = 'completed-requests';
    else if (pathname.startsWith('/notifications')) currentActiveItem = 'notifications';
    else if (pathname.startsWith('/payments')) currentActiveItem = 'payments';

    else if (pathname.startsWith('/profile')) currentActiveItem = 'profile';
    else if (pathname.startsWith('/settings')) currentActiveItem = 'settings';

  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Show sidebar unless explicitly skipped */}
      {!skipSidebar && <Sidebar activeItem={currentActiveItem} />}
      
      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
