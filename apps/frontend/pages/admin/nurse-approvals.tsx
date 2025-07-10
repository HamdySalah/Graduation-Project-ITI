import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import apiService from '../../lib/api';
import Layout from '../../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingNurse {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  createdAt: string;
  licenseNumber: string;
  yearsOfExperience: number;
  specializations: string[];
  education: string;
  certifications: string[];
  documents: string[];
  hourlyRate: number;
  bio: string;
  languages: string[];
}

export default function NurseApprovals() {
  const { user, loading } = useAuth();
  const [pendingNurses, setPendingNurses] = useState<PendingNurse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [processingId, setProcessingId] = useState<string>('');

  const loadPendingNurses = async () => {
    try {
      setError('');
      setLoadingData(true);
      
      const nurses = await apiService.getPendingNurses();
      setPendingNurses(Array.isArray(nurses) ? nurses : []);
    } catch (err: any) {
      setError(`Failed to load pending nurses: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const handleApprove = async (nurseId: string, nurseName: string) => {
    try {
      setError('');
      setSuccessMessage('');
      setProcessingId(nurseId);
      
      await apiService.verifyNurse(nurseId);
      setSuccessMessage(`✅ ${nurseName} has been approved successfully!`);
      
      // Remove from pending list with animation
      setTimeout(() => {
        setPendingNurses(prev => prev.filter(nurse => nurse.id !== nurseId));
      }, 1000);
      
    } catch (err: any) {
      setError(`Failed to approve nurse: ${err.message}`);
    } finally {
      setProcessingId('');
    }
  };

  const handleReject = async (nurseId: string, nurseName: string) => {
    try {
      setError('');
      setSuccessMessage('');
      setProcessingId(nurseId);
      
      await apiService.rejectNurse(nurseId);
      setSuccessMessage(`❌ ${nurseName} application has been rejected.`);
      
      // Remove from pending list with animation
      setTimeout(() => {
        setPendingNurses(prev => prev.filter(nurse => nurse.id !== nurseId));
      }, 1000);
      
    } catch (err: any) {
      setError(`Failed to reject nurse: ${err.message}`);
    } finally {
      setProcessingId('');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingNurses();
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Access denied. Admin privileges required.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Nurse Approvals">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Nurse Approvals
                  </h1>
                  <p className="text-gray-600">
                    Review and approve nurse applications for the platform
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{pendingNurses.length}</div>
                    <div className="text-sm text-gray-500">Pending Applications</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4"
              >
                <p className="text-red-600">{error}</p>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4"
              >
                <p className="text-green-600">{successMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {loadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : pendingNurses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="bg-white rounded-2xl shadow-lg p-12">
                <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending nurse applications at the moment.</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {pendingNurses.map((nurse, index) => (
                  <motion.div
                    key={nurse.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    <div className="p-6">
                      {/* Nurse Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {nurse.name?.charAt(0) || 'N'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{nurse.name || 'Unknown'}</h3>
                            <p className="text-sm text-gray-500">{nurse.email}</p>
                          </div>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Pending
                        </span>
                      </div>

                      {/* Nurse Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {nurse.phone || 'No phone'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          License: {nurse.licenseNumber || 'Not provided'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {nurse.yearsOfExperience || 0} years experience
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          ${nurse.hourlyRate || 'Not set'}/hour
                        </div>
                      </div>

                      {/* Specializations */}
                      {nurse.specializations && nurse.specializations.length > 0 && (
                        <div className="mb-6">
                          <p className="text-xs font-medium text-gray-500 mb-2">SPECIALIZATIONS</p>
                          <div className="flex flex-wrap gap-1">
                            {nurse.specializations.slice(0, 3).map((spec) => (
                              <span
                                key={spec}
                                className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                              >
                                {spec}
                              </span>
                            ))}
                            {nurse.specializations.length > 3 && (
                              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                +{nurse.specializations.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleApprove(nurse.id, nurse.name)}
                          disabled={processingId === nurse.id}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === nurse.id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            'Approve'
                          )}
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReject(nurse.id, nurse.name)}
                          disabled={processingId === nurse.id}
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
