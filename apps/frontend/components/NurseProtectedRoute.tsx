import { useAuth } from '../lib/auth';
import { useNurseAccessStatus } from '../hooks/useNurseAccessStatus';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from './Layout';
import { motion } from 'framer-motion';

interface NurseProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
  requiredFeature?: string; // 'dashboard', 'requests', 'platform', etc.
}

export default function NurseProtectedRoute({
  children,
  requireVerified = true,
  requiredFeature = 'platform'
}: NurseProtectedRouteProps) {
  const { user, loading } = useAuth();
  const {
    accessStatus,
    loading: statusLoading,
    getRedirectInfo,
    getCompletionStatus,
    canAccessPlatform,
    needsProfileCompletion,
    isUnderReview,
    isRejected
  } = useNurseAccessStatus();
  const router = useRouter();

  // Handle redirects based on access status
  useEffect(() => {
    if (!loading && !statusLoading && user && user.role === 'nurse') {
      const redirectInfo = getRedirectInfo();

      if (redirectInfo?.shouldRedirect && redirectInfo.redirectTo) {
        // Don't redirect if we're already on the target page
        if (router.pathname !== redirectInfo.redirectTo) {
          router.replace(redirectInfo.redirectTo);
        }
      }
    }
  }, [user, loading, statusLoading, router, getRedirectInfo]);

  if (loading || statusLoading) {
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

  // Handle different access scenarios based on new status system
  if (requireVerified && user.status !== 'verified') {
    // Profile completion required - but allow access to the profile completion page itself
    if (needsProfileCompletion && router.pathname !== '/nurse-profile-complete') {
      const completionStatus = getCompletionStatus();

      return (
        <Layout>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-blue-200">
                <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Complete Your Profile
                </h2>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  Please complete your nurse profile setup to access the platform.
                  This helps us verify your credentials and match you with patients.
                </p>

                {completionStatus && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-700 text-sm font-medium">Progress</span>
                      <span className="text-blue-700 text-sm font-medium">{completionStatus.percentage}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionStatus.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-blue-700 text-sm mt-2">{completionStatus.message}</p>
                  </div>
                )}

                <button
                  onClick={() => router.push('/nurse-profile-complete')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Continue Setup
                </button>
              </div>
            </motion.div>
          </div>
        </Layout>
      );
    }

    // Under review
    if (isUnderReview) {
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
                  Profile Under Review
                </h2>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  Your nurse profile is currently being reviewed by our admin team.
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
                    <span>Profile submitted</span>
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
                    <span>Account approved</span>
                  </div>
                </div>

                <button
                  onClick={() => window.location.reload()}
                  className="mt-6 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Check Status
                </button>
              </div>
            </motion.div>
          </div>
        </Layout>
      );
    }

    // Rejected status
    if (isRejected) {
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

                <button
                  onClick={() => window.location.href = 'mailto:support@nurseplatform.com'}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Contact Support
                </button>
              </div>
            </motion.div>
          </div>
        </Layout>
      );
    }

    // Fallback for other pending statuses
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Account Setup Required
              </h2>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Please complete your account setup to access the platform.
              </p>

              <button
                onClick={() => router.push('/nurse-profile-complete')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Complete Setup
              </button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Check specific feature access if required
  if (requiredFeature && accessStatus) {
    let hasFeatureAccess = false;

    switch (requiredFeature) {
      case 'dashboard':
        hasFeatureAccess = accessStatus.canAccessDashboard;
        break;
      case 'requests':
        hasFeatureAccess = accessStatus.canViewRequests;
        break;
      case 'platform':
        hasFeatureAccess = accessStatus.canAccessPlatform;
        break;
      default:
        hasFeatureAccess = accessStatus.canAccessPlatform;
    }

    if (!hasFeatureAccess) {
      const redirectInfo = getRedirectInfo();
      if (redirectInfo?.shouldRedirect) {
        // Redirect will be handled by useEffect above
        return (
          <Layout>
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          </Layout>
        );
      }
    }
  }

  return <>{children}</>;
}
