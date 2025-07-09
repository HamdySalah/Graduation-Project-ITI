import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function VerificationPending() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-400 via-white-500 to-white-500">
      <div className="w-full flex items-center justify-center">
        <div className="container mx-auto max-w-2xl p-8 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-purple-700 mb-6">Verification Pending</h2>
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <p className="text-lg text-gray-700 mb-4">
              Thank you for registering as a nurse on our platform.
            </p>
            
            <p className="text-lg text-gray-700 mb-6">
              Your account is currently pending verification by our administrators. 
              This process may take 24-48 hours as we carefully review your credentials 
              to ensure the highest standards of care for our patients.
            </p>
            
            <p className="text-lg text-gray-700 mb-8">
              You will receive an email notification once your account has been verified, 
              and then you will be able to access the nurse dashboard and start accepting patient requests.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/" 
                className="bg-purple-600 text-white px-6 py-3 rounded-full text-lg font-medium hover:bg-purple-700 transition duration-300"
              >
                Return to Home
              </Link>
              
              <button 
                onClick={logout}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full text-lg font-medium hover:bg-gray-300 transition duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
