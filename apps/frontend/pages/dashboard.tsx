import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import Layout, { Card, LoadingSpinner, StatusBadge } from '../components/Layout';
import { apiService } from '../lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardStats {
  totalRequests?: number;
  pendingRequests?: number;
  completedRequests?: number;
  cancelledRequests?: number;
  acceptedRequests?: number;
  inProgressRequests?: number;
  totalEarnings?: number;
  averageRating?: number;
  totalUsers?: number;
  totalPatients?: number;
  totalNurses?: number;
  verifiedNurses?: number;
  pendingNurses?: number;
  successRate?: number;
  monthlyGrowth?: {
    users: number;
    requests: number;
  };
}

interface Nurse {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  address?: string;
  createdAt?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  specializations?: string[];
  education?: string;
  rating?: number;
  totalReviews?: number;
  completedJobs?: number;
  hourlyRate?: number;
  isAvailable?: boolean;
  documents?: string[];
  bio?: string;
  languages?: string[];
}

interface Request {
  id: string;
  title?: string;
  description?: string;
  serviceType?: string;
  status?: string;
  address?: string;
  scheduledDate?: string;
  estimatedDuration?: number;
  urgencyLevel?: string;
  budget?: number;
  createdAt?: string;
  patient?: {
    id: string;
    name: string;
    phone?: string;
  };
  nurse?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [pendingNurses, setPendingNurses] = useState<Nurse[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNurses, setLoadingNurses] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [processingId, setProcessingId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'nurses' | 'requests'>('overview');

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      setError('');

      if (user?.role === 'admin') {
        const [statsData, requestsData] = await Promise.all([
          apiService.getAdminStats().catch(() => ({})),
          apiService.getRequests().catch(() => [])
        ]);
        setStats(statsData as DashboardStats);
        setRecentRequests(Array.isArray(requestsData) ? requestsData.slice(0, 5) : []);
      } else {
        const [statsData, requestsData] = await Promise.all([
          apiService.getDashboardStats().catch(() => ({})),
          apiService.getRequests().catch(() => [])
        ]);
        setStats(statsData as DashboardStats);
        setRecentRequests(Array.isArray(requestsData) ? requestsData.slice(0, 5) : []);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
      if (user.role === 'admin') {
        loadAdminData();
      }
    } else if (!loading) {
      setLoadingStats(false);
    }
  }, [user, loading]);

  const loadAdminData = async () => {
    try {
      setLoadingNurses(true);
      setError('');

      const pendingNursesData = await apiService.getPendingNurses();
      setPendingNurses(Array.isArray(pendingNursesData) ? pendingNursesData : []);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setError(`Failed to load admin data: ${err.message}`);
    } finally {
      setLoadingNurses(false);
    }
  };

  const handleApproveNurse = async (nurseId: string, nurseName: string) => {
    try {
      setError('');
      setSuccessMessage('');
      setProcessingId(nurseId);
      
      await apiService.verifyNurse(nurseId);
      setSuccessMessage(`✅ ${nurseName} has been approved successfully!`);
      
      await loadAdminData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(`Failed to approve nurse: ${err.message}`);
    } finally {
      setProcessingId('');
    }
  };

  const handleRejectNurse = async (nurseId: string, nurseName: string) => {
    try {
      setError('');
      setSuccessMessage('');
      setProcessingId(nurseId);
      
      await apiService.rejectNurse(nurseId);
      setSuccessMessage(`❌ ${nurseName} application has been rejected.`);
      
      await loadAdminData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(`Failed to reject nurse: ${err.message}`);
    } finally {
      setProcessingId('');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-600">Please log in to access your dashboard.</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Go to Login
          </Link>
        </div>
      </Layout>
    );
  }

  // Admin Dashboard
  if (user.role === 'admin') {
    return (
      <Layout title="Admin Dashboard">
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
                      Admin Dashboard
                    </h1>
                    <p className="text-gray-600">
                      Complete platform management and oversight
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Welcome back</div>
                      <div className="font-semibold text-gray-900">{user.name}</div>
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

            {/* Platform Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center">
                    <div className="bg-green-100 rounded-lg p-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Verified Nurses</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.verifiedNurses || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 rounded-lg p-3">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Pending Nurses</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingNurses.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center">
                    <div className="bg-purple-100 rounded-lg p-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V7a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Requests</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalRequests || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navigation Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-white rounded-xl shadow-lg p-2 border border-gray-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'overview'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    📊 Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('nurses')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'nurses'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    👩‍⚕️ Nurses ({pendingNurses.length} pending)
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'requests'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    📋 Requests
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Content Sections */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    {loadingStats ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse flex space-x-4">
                            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                            <div className="flex-1 space-y-2 py-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : recentRequests.length > 0 ? (
                      <div className="space-y-4">
                        {recentRequests.slice(0, 5).map((request) => (
                          <div key={request.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {request.title || 'Nursing Request'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {request.patient?.name || 'Unknown Patient'} • {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown Date'}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <StatusBadge status={request.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No recent activity</p>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'nurses' && (
                <motion.div
                  key="nurses"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Pending Nurses Section */}
                  {pendingNurses.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pending Nurse Approvals ({pendingNurses.length})
                        </h3>
                        <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Requires Action
                        </div>
                      </div>

                      {loadingNurses ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse bg-gray-50 rounded-lg p-4">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                              <div className="flex space-x-2">
                                <div className="h-8 bg-gray-200 rounded w-20"></div>
                                <div className="h-8 bg-gray-200 rounded w-20"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {pendingNurses.map((nurse, index) => (
                            <motion.div
                              key={nurse.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {nurse.name?.charAt(0) || 'N'}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{nurse.name || 'Unknown'}</h4>
                                    <p className="text-xs text-gray-500">{nurse.email}</p>
                                  </div>
                                </div>
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                                  Pending
                                </span>
                              </div>

                              <div className="space-y-2 mb-4 text-xs text-gray-600">
                                <div className="flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {nurse.phone || 'No phone'}
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  License: {nurse.licenseNumber || 'Not provided'}
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {nurse.yearsOfExperience || 0} years experience
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleApproveNurse(nurse.id, nurse.name || 'Unknown')}
                                  disabled={processingId === nurse.id}
                                  className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  {processingId === nurse.id ? '...' : 'Approve'}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleRejectNurse(nurse.id, nurse.name || 'Unknown')}
                                  disabled={processingId === nurse.id}
                                  className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Nurses Section */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All Nurses</h3>
                    <p className="text-gray-600">Complete nurse management coming soon...</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'requests' && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Management</h3>
                    <p className="text-gray-600">Request management features coming soon...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Layout>
    );
  }

  // Regular User Dashboard (Patient/Nurse)
  return (
    <Layout title={`Welcome back, ${user.name}!`}>
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Welcome Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h2>
              <p className="text-gray-600 mt-1">
                {user.role === 'patient' ? 'Find qualified nurses for your healthcare needs' : 
                 user.role === 'nurse' ? 'Manage your nursing services and requests' : 
                 'Manage your account'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-lg font-semibold text-blue-600 capitalize">{user.role}</p>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {user.role === 'patient' && (
            <>
              <StatCard
                title="Total Requests"
                value={stats.totalRequests || 0}
                icon="📋"
                color="blue"
              />
              <StatCard
                title="Pending Requests"
                value={stats.pendingRequests || 0}
                icon="⏳"
                color="yellow"
              />
              <StatCard
                title="Completed Requests"
                value={stats.completedRequests || 0}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Total Spent"
                value={`$${stats.totalEarnings || 0}`}
                icon="💰"
                color="purple"
              />
            </>
          )}

          {user.role === 'nurse' && (
            <>
              <StatCard
                title="Accepted Requests"
                value={stats.acceptedRequests || 0}
                icon="📋"
                color="blue"
              />
              <StatCard
                title="In Progress"
                value={stats.inProgressRequests || 0}
                icon="⏳"
                color="yellow"
              />
              <StatCard
                title="Completed Jobs"
                value={stats.completedRequests || 0}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Total Earnings"
                value={`$${stats.totalEarnings || 0}`}
                icon="💰"
                color="purple"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user.role === 'patient' && (
              <>
                <Link href="/requests/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-center transition-colors">
                  Create New Request
                </Link>
                <Link href="/nurses" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-center transition-colors">
                  Find Nurses
                </Link>
                <Link href="/profile" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-center transition-colors">
                  Update Profile
                </Link>
              </>
            )}

            {user.role === 'nurse' && (
              <>
                {user.status === 'pending' ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center col-span-3">
                    <div className="animate-pulse">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Account Pending Verification</h3>
                    <p className="text-yellow-700 mb-4">
                      Your nurse account is currently under review by our admin team.
                      You'll be able to access all features once your account is verified.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-yellow-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      <span>Awaiting admin approval...</span>
                    </div>
                  </div>
                ) : user.status === 'verified' ? (
                  <>
                    <Link href="/requests" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-center transition-colors">
                      View Available Requests
                    </Link>
                    <Link href="/profile" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-center transition-colors">
                      Update Profile
                    </Link>
                    <button
                      onClick={() => apiService.toggleNurseAvailability()}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-center transition-colors"
                    >
                      Toggle Availability
                    </button>
                  </>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center col-span-3">
                    <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Account Not Approved</h3>
                    <p className="text-red-700">
                      Your nurse application was not approved. Please contact support for more information.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Recent Requests */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Requests</h3>
          {loadingStats ? (
            <LoadingSpinner />
          ) : recentRequests.length > 0 ? (
            <div className="space-y-4">
              {recentRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{request.title || 'Nursing Request'}</h4>
                    <p className="text-sm text-gray-500">
                      {request.patient?.name || 'Unknown Patient'} • {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown Date'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <StatusBadge status={request.status} />
                    <Link
                      href={`/requests/${request.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent requests</p>
          )}
        </Card>
      </div>
    </Layout>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color
}: {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center">
        <div className={`${colorClasses[color]} rounded-md p-3`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}
