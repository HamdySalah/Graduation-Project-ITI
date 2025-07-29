import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function closeDropdown() {
    setIsDropdownOpen(false);
  }

  return (
    <header className="bg-gradient-to-r from-blue-700 to-purple-700 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="ml-2 text-xl font-bold text-white">3Naya</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-x-6 flex items-center">
          <Link href="/" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
            Home
          </Link>
          <Link href="#how-it-works" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
            About
          </Link>
          <Link href="#platform-features" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
            Features
          </Link>
          <Link href="#contact-us" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
            Contact
          </Link>
          
          {!user ? (
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
                Login
              </Link>
              <Link href="/register" className="bg-white text-blue-600 px-4 py-2 rounded-full hover:bg-yellow-300 hover:text-blue-800 transition duration-300 font-semibold shadow-md hover:shadow-lg">
                Register
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              {/* Notifications Bell */}
              <Link href="/notifications" className="relative text-white hover:text-yellow-300 transition">
                <div className="relative">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    3
                  </span>
                </div>
              </Link>
              
              {/* User Profile Dropdown */}
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none hover:bg-blue-700 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <span className="text-white font-semibold">
                    {user?.name || 'User'}
                  </span>
                  <svg
                    className={`w-4 h-4 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
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
                      <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={closeDropdown}>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </div>
                      </Link>

                      <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={closeDropdown}>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Dashboard
                        </div>
                      </Link>

                      {user?.role === 'patient' && (
                        <div>
                          <Link href="/requests" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={closeDropdown}>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              My Requests
                            </div>
                          </Link>

                          <Link href="/requests/create" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={closeDropdown}>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Create Request
                            </div>
                          </Link>

                          <Link href="/nurses" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={closeDropdown}>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              Find Nurses
                            </div>
                          </Link>

                          <Link href="/patient-completed-requests" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={closeDropdown}>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Completed Requests
                            </div>
                          </Link>
                        </div>
                      )}

                      {user?.role === 'nurse' && (
                        <div>
                          <Link href="/requests" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={closeDropdown}>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Patient Requests
                            </div>
                          </Link>

                          <Link href="/active-requests" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={closeDropdown}>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Active Requests
                            </div>
                          </Link>

                          <Link href="/completed-requests" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={closeDropdown}>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Completed Requests
                            </div>
                          </Link>
                        </div>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => {
                          closeDropdown();
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
