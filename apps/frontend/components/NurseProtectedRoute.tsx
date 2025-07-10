import { useAuth } from '../lib/auth';
import Layout from './Layout';
import { motion } from 'framer-motion';

interface NurseProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export default function NurseProtectedRoute({ 
  children, 
  requireVerified = true 
}: NurseProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Please log in to access this page.</p>
        </div>
      </Layout>
    );
  }

  if (user.role !== 'nurse') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Access denied. Nurse privileges required.</p>
        </div>
      </Layout>
    );
  }

  if (requireVerified && user.status === 'pending') {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-yellow-200">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-20 h-20 bg-yellow-100 rounded-full mx-auto mb-6 flex items-center justify-center"
              >
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Account Under Review
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your nurse account is currently being reviewed by our admin team. 
                You'll receive access to all platform features once your credentials 
                and qualifications are verified.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-yellow-700">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full"
                  ></motion.div>
                  <span className="text-sm font-medium">Processing your application...</span>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Application submitted</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-4 h-4 bg-yellow-500 rounded-full"
                  ></motion.div>
                  <span>Under admin review</span>
                </div>
                <div className="flex items-center justify-center space-x-2 opacity-50">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                  <span>Account activation</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-400">
                  This process typically takes 24-48 hours. 
                  You'll be notified via email once approved.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (requireVerified && user.status === 'rejected') {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-red-200">
              <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Application Not Approved
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Unfortunately, your nurse application was not approved at this time. 
                Please contact our support team for more information about the decision.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm">
                  You can reapply after addressing any issues mentioned in our communication.
                </p>
              </div>
              
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
                Contact Support
              </button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
}
