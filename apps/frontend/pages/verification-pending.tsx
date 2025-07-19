import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { useNurseAccessStatus } from '../hooks/useNurseAccessStatus';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';

export default function VerificationPending() {
  const { user } = useAuth();
  const {
    needsProfileCompletion,
    getCompletionStatus,
    refreshStatus
  } = useNurseAccessStatus();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'nurse') {
      router.replace('/dashboard');
      return;
    }

    // If user is verified, redirect to dashboard
    if (user.status === 'verified') {
      router.replace('/dashboard');
      return;
    }

    // If profile completion is needed, redirect to profile completion
    if (needsProfileCompletion) {
      router.replace('/nurse-profile-complete');
      return;
    }

    // Load status message
    loadStatusMessage();
  }, [user, router, needsProfileCompletion]);

  const loadStatusMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/nurse-profile-status/status-message', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStatusMessage(result.data.statusMessage);
      }
    } catch (err) {
      console.error('Error loading status message:', err);
    }
  };

  const handleRefreshStatus = () => {
    refreshStatus();
    loadStatusMessage();

    // Check if status changed after refresh
    setTimeout(() => {
      if (user?.status === 'verified') {
        router.replace('/dashboard');
      }
    }, 1000);
  };

  if (!user || user.role !== 'nurse') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Verification Pending">
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-yellow-200">
            {/* Animated Icon */}
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
              className="w-24 h-24 bg-yellow-100 rounded-full mx-auto mb-6 flex items-center justify-center"
            >
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Profile Under Review
            </h1>

            <p className="text-gray-600 mb-6 leading-relaxed">
              Your nurse profile has been submitted and is currently being reviewed by our admin team.
              You'll receive access to all platform features once your credentials and qualifications are verified.
            </p>

            {/* Status Message */}
            {statusMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-700 text-sm">{statusMessage}</p>
              </div>
            )}

            {/* Processing Animation */}
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

            {/* Progress Steps */}
            <div className="space-y-3 text-sm text-gray-500 mb-8">
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

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRefreshStatus}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Check Status
              </button>

              <button
                onClick={() => router.push('/profile')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors"
              >
                View My Profile
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-400 mb-3">
                This process typically takes 24-48 hours.
                You'll be notified via email once approved.
              </p>

              <div className="flex items-center justify-center space-x-4 text-xs">
                <button
                  onClick={() => window.location.href = 'mailto:support@nurseplatform.com'}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Contact Support
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => router.push('/faq')}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  FAQ
                </button>
              </div>
            </div>

            {/* Completion Status (if available) */}
            {(() => {
              const completionStatus = getCompletionStatus();
              return completionStatus && completionStatus.isComplete && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2 text-green-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Profile 100% Complete</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}