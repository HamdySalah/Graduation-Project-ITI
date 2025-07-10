import { useState } from 'react';
import { useAuth } from '../lib/auth';
import apiService from '../lib/api';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';

export default function TestPendingNurse() {
  const { user, loading } = useAuth();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState(false);

  const createPendingNurse = async () => {
    try {
      setError('');
      setSuccess('');
      setIsRegistering(true);

      const nurseData = {
        name: 'Test Pending Nurse',
        email: 'pending.nurse@test.com',
        password: 'TestPassword123',
        role: 'nurse',
        phone: '+201234567890',
        address: 'Test Address, Cairo, Egypt',
        location: {
          type: 'Point',
          coordinates: [31.233, 30.033]
        },
        licenseNumber: 'TEST-NURSE-001',
        yearsOfExperience: 3,
        specializations: ['general', 'pediatric'],
        education: 'Bachelor of Nursing, Cairo University',
        certifications: ['CPR', 'First Aid'],
        hourlyRate: 45,
        bio: 'Test nurse account for pending status demonstration',
        languages: ['Arabic', 'English']
      };

      console.log('Creating pending nurse account...');
      const result = await apiService.register(nurseData);
      console.log('Registration result:', result);

      setSuccess('✅ Pending nurse account created successfully! You can now login with: pending.nurse@test.com / TestPassword123');
    } catch (err: any) {
      setError(`Failed to create pending nurse: ${err.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const loginAsPendingNurse = async () => {
    try {
      setError('');
      setSuccess('');

      console.log('Logging in as pending nurse...');
      const result = await apiService.login({
        email: 'pending.nurse@test.com',
        password: 'TestPassword123'
      });
      console.log('Login result:', result);

      setSuccess('✅ Logged in as pending nurse! Refreshing page...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(`Login failed: ${err.message}`);
    }
  };

  return (
    <Layout title="Test Pending Nurse">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Pending Nurse System</h1>
            <p className="text-gray-600">
              Create and test a pending nurse account to see the verification workflow.
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <p className="text-red-600">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4"
            >
              <p className="text-green-600">{success}</p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Status */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Current Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loading:</span>
                  <span className="font-medium">{loading ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User:</span>
                  <span className="font-medium">{user ? user.name : 'Not logged in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium">{user?.role || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    user?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    user?.status === 'verified' ? 'bg-green-100 text-green-800' :
                    user?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-sm">{user?.email || 'None'}</span>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
              <div className="space-y-4">
                <button
                  onClick={createPendingNurse}
                  disabled={isRegistering}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegistering ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    '🏥 Create Pending Nurse Account'
                  )}
                </button>

                <button
                  onClick={loginAsPendingNurse}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  👩‍⚕️ Login as Pending Nurse
                </button>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Quick Navigation</h3>
                  <div className="space-y-2">
                    <a
                      href="/dashboard"
                      className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-center transition-colors"
                    >
                      📊 Dashboard
                    </a>
                    <a
                      href="/requests"
                      className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-center transition-colors"
                    >
                      📋 Requests (Protected)
                    </a>
                    <a
                      href="/admin/nurse-approvals"
                      className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-center transition-colors"
                    >
                      🏥 Admin Approvals
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">For Pending Nurse Testing:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Click "Create Pending Nurse Account"</li>
                  <li>Click "Login as Pending Nurse"</li>
                  <li>Go to Dashboard - see pending status message</li>
                  <li>Try to access Requests - see protection screen</li>
                  <li>Login as admin to approve the nurse</li>
                </ol>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">For Admin Testing:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Login as admin (admin@test.com)</li>
                  <li>Go to "Nurse Approvals" page</li>
                  <li>See the pending nurse application</li>
                  <li>Click "Approve" or "Reject"</li>
                  <li>Test nurse can now access features</li>
                </ol>
              </div>
            </div>
          </motion.div>

          {/* Test Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6"
          >
            <h3 className="font-semibold text-blue-900 mb-3">Test Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-800">Pending Nurse:</p>
                <p className="text-blue-700">Email: pending.nurse@test.com</p>
                <p className="text-blue-700">Password: TestPassword123</p>
              </div>
              <div>
                <p className="font-medium text-blue-800">Admin:</p>
                <p className="text-blue-700">Email: admin@test.com</p>
                <p className="text-blue-700">Password: AdminPassword123</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
