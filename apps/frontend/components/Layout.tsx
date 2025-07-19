import { ReactNode, useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useNurseAccessStatus } from '../hooks/useNurseAccessStatus';
import { useDropdownNavigation } from '../lib/navigation';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth();
  const { canViewRequests, canAccessPlatform } = useNurseAccessStatus();
  const { navigateAndClose } = useDropdownNavigation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleNavigation = (url: string) => {
    navigateAndClose(url, closeDropdown);
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <div className="flex items-center justify-center mb-8">
                  <div className="bg-gradient-to-br from-blue-400 via-purple-400 to-blue-600 rounded-full p-3 shadow-2xl animate-pulse">
                    <img src="/logo.png" alt="Nurse Platform Logo" className="h-20 w-20 object-contain drop-shadow-2xl animate-bounce" />
                  </div>
                  <span className="ml-4 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-400 tracking-wide">عناية</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 focus:outline-none hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{user.name}</span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={() => handleNavigation('/profile')}
                          className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Profile
                        </button>

                        <button
                          onClick={() => handleNavigation('/settings')}
                          className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Settings
                        </button>

                        <button
                          onClick={() => handleNavigation('/dashboard')}
                          className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Dashboard
                        </button>

                        {user.role === 'patient' && (
                          <>
                            <button
                              onClick={() => handleNavigation('/requests')}
                              className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              My Requests
                            </button>

                            <button
                              onClick={() => handleNavigation('/requests/create')}
                              className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              Create Request
                            </button>

                            <button
                              onClick={() => handleNavigation('/nurses')}
                              className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              Find Nurses
                            </button>
                          </>
                        )}

                        {user.role === 'nurse' && canViewRequests && (
                          <>
                            <button
                              onClick={() => navigateAndClose('/requests', () => setIsDropdownOpen(false))}
                              className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              Patient Requests
                            </button>
                            <button
                              onClick={() => navigateAndClose('/visit-history', () => setIsDropdownOpen(false))}
                              className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              Visit History
                            </button>
                          </>
                        )}

                        {user.role === 'nurse' && !canAccessPlatform && (
                          <button
                            onClick={() => navigateAndClose('/nurse-profile-complete', () => setIsDropdownOpen(false))}
                            className="w-full text-left block px-4 py-2 text-blue-700 hover:bg-blue-50 transition-colors font-medium"
                          >
                            Complete Profile
                          </button>
                        )}

                        <div className="border-t border-gray-100 my-1"></div>

                        <button
                          onClick={() => {
                            closeDropdown();
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
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
export function StatusBadge({ status }: { status?: string }) {
  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';

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

  const displayStatus = status || 'unknown';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(displayStatus)}`}>
      {displayStatus.replace('_', ' ').toUpperCase()}
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
