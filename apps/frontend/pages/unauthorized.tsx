import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const router = useRouter();
  const { logout } = useAuth();
  
  const handleLoginClick = () => {
    // Clear any existing auth state first
    logout();
    // Redirect to login
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-400 via-white-500 to-white-500">
      <div className="w-full flex items-center justify-center">
        <div className="container mx-auto max-w-2xl p-8 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m12-12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-red-600 mb-6">Unauthorized Access</h2>
            
            <p className="text-lg text-gray-700 mb-4">
              Sorry, you don't have permission to access this page.
            </p>
            
            <p className="text-lg text-gray-700 mb-8">
              This could be because your session has expired, your account doesn't have the required permissions,
              or you need to log in again.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={handleLoginClick}
                className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-medium hover:bg-blue-700 transition duration-300"
              >
                Log In
              </button>
              
              <Link 
                href="/" 
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full text-lg font-medium hover:bg-gray-300 transition duration-300"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
