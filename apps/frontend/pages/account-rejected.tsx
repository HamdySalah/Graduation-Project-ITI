import React from 'react';
import { useAuth } from '../lib/auth';
import ErrorDisplay from '../components/ErrorDisplay';
import { CustomError, ErrorCode } from '../lib/errors';

const AccountRejectedPage: React.FC = () => {
  const { user, logout } = useAuth();

  const rejectionError = new CustomError(
    ErrorCode.ACCOUNT_SUSPENDED,
    'Account has been rejected',
    'Your nurse account application has been rejected. This may be due to incomplete documentation, verification issues, or other requirements not being met.',
    403,
    {
      userId: user?.id,
      userEmail: user?.email,
      rejectionDate: new Date().toISOString()
    }
  );

  const handleContactSupport = () => {
    // You can customize this to open a support form, email client, or chat
    window.location.href = 'mailto:support@nurseplatform.com?subject=Account Rejection Appeal&body=Hello, I would like to appeal my account rejection. My account email is: ' + (user?.email || '');
  };

  const handleLogout = () => {
    logout();
  };

  const handleReapply = () => {
    // You might want to redirect to a reapplication form
    window.location.href = '/register?reapply=true';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Rejected
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We're sorry, but your nurse account application has been rejected.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Error Display */}
          <ErrorDisplay 
            error={rejectionError}
            className="mb-6"
            showDetails={false}
          />

          {/* Account Information */}
          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Account Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Name:</span> {user.name || 'Not provided'}</p>
                <p><span className="font-medium">Status:</span> <span className="text-red-600 font-medium">Rejected</span></p>
              </div>
            </div>
          )}

          {/* Possible Reasons */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Common Reasons for Rejection</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Incomplete or unclear documentation
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Nursing license verification issues
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Missing required certifications
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Background check concerns
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Insufficient professional experience
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">What You Can Do</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900">Contact Support</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Get specific details about why your application was rejected and what you can do to address the issues.
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="text-sm font-medium text-green-900">Reapply</h4>
                <p className="text-sm text-green-700 mt-1">
                  Once you've addressed the issues, you can submit a new application with updated information.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleContactSupport}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Contact Support
            </button>
            
            <button
              type="button"
              onClick={handleReapply}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Submit New Application
            </button>
            
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Logout
            </button>
          </div>

          {/* Support Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Email: <a href="mailto:support@nurseplatform.com" className="text-blue-600 hover:text-blue-800">support@nurseplatform.com</a></p>
                <p>Phone: <a href="tel:+1-555-0123" className="text-blue-600 hover:text-blue-800">+1 (555) 012-3456</a></p>
                <p>Hours: Monday - Friday, 9 AM - 6 PM EST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountRejectedPage;
