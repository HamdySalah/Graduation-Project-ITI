import Link from 'next/link';
import { useAuth } from '../lib/auth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo/Brand */}
        <div className="text-3xl font-extrabold text-white animate-pulse">
          <span className="text-yellow-300">Nurse</span><span className="text-white">Connect</span>
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
            <>
              <Link href="/login" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
                Login
              </Link>
              <Link href="/register" className="bg-white text-blue-600 px-4 py-2 rounded-full hover:bg-yellow-300 hover:text-blue-800 transition duration-300 font-semibold shadow-md hover:shadow-lg">
                Register
              </Link>
            </>
          ) : (
            <div className="relative group ml-2">
              <button className="flex items-center space-x-2 focus:outline-none">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-white font-semibold">{user.name}</span>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
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
                    <Link href="/requests" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">My Requests</Link>
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
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;