import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNurseAccessStatus } from '../hooks/useNurseAccessStatus';
import Layout, { Card, LoadingSpinner, StatusBadge } from '../components/Layout';
import { apiService } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import SessionStatus from '../components/SessionStatus';
import ErrorBoundary from '../components/ErrorBoundary';
import { navigationUtils } from '../lib/navigation';

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
  const {
    accessStatus,
    canAccessDashboard,
    needsProfileCompletion,
    isUnderReview,
    getCompletionStatus,
    getRedirectInfo
  } = useNurseAccessStatus();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [pendingNurses, setPendingNurses] = useState<Nurse[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNurses, setLoadingNurses] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [processingId, setProcessingId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'nurses' | 'requests' | 'users'>('overview');

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      setError('');
      console.log('Loading dashboard data for user role:', user?.role);

      if (user?.role === 'admin') {
        const [statsData, requestsData] = await Promise.all([
          apiService.getAdminStats().catch((err) => {
            console.warn('Admin stats failed:', err);
            return { totalUsers: 0, totalNurses: 0, totalRequests: 0 };
          }),
          apiService.getRequests().catch((err) => {
            console.warn('Requests failed:', err);
            return [];
          })
        ]);

        console.log('Admin stats received:', statsData);
        setStats((statsData || {}) as DashboardStats);
        setRecentRequests(Array.isArray(requestsData) ? requestsData.slice(0, 5) : []);
      } else {
        const [statsData, requestsData] = await Promise.all([
          apiService.getDashboardStats().catch((err) => {
            console.warn('Dashboard stats failed:', err);
            setError('Failed to load dashboard statistics. Please refresh the page.');
            return {};
          }),
          apiService.getRequests().catch((err) => {
            console.warn('Requests failed:', err);
            setError('Failed to load recent requests. Please refresh the page.');
            return [];
          })
        ]);
        // Handle nested stats structure from backend
        let processedStats = {};
        console.log('Raw stats data received:', statsData);
        console.log('User role:', user?.role);

        if (statsData && typeof statsData === 'object') {
          if (user?.role === 'patient' && statsData.patient) {
            console.log('Processing patient stats:', statsData.patient);
            processedStats = {
              totalRequests: statsData.patient.totalRequests || 0,
              pendingRequests: statsData.patient.pendingRequests || 0,
              acceptedRequests: statsData.patient.acceptedRequests || 0,
              completedRequests: statsData.patient.completedRequests || 0,
              cancelledRequests: statsData.patient.cancelledRequests || 0,
            };
          } else if (user?.role === 'nurse' && statsData.nurse) {
            console.log('Processing nurse stats:', statsData.nurse);
            processedStats = {
              totalRequests: statsData.nurse.totalAssignedRequests || 0,
              acceptedRequests: statsData.nurse.activeRequests || 0,
              inProgressRequests: statsData.nurse.activeRequests || 0,
              completedRequests: statsData.nurse.completedRequests || 0,
              totalEarnings: 0, // TODO: Calculate from completed requests
              averageRating: 0, // TODO: Get from reviews
            };
          } else {
            console.log('Using fallback stats processing');
            // Fallback to direct stats if no nested structure
            processedStats = statsData;
          }
        }
        console.log('Processed stats:', processedStats);
        setStats(processedStats as DashboardStats);
        setRecentRequests(Array.isArray(requestsData) ? requestsData.slice(0, 5) : []);
      }
      console.log('Dashboard data loaded successfully');
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setStats({});
      setRecentRequests([]);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    console.log('Dashboard useEffect triggered:', { user: user?.email, role: user?.role, loading });

    if (user) {
      console.log('User authenticated, loading dashboard data...');
      loadDashboardData();

      if (user.role === 'admin') {
        console.log('Admin user detected, loading admin data...');
        loadAdminData();
      }
    } else if (!loading) {
      console.log('No user found and not loading, setting loading to false');
      setLoadingStats(false);
    }
  }, [user, loading]);

  // Auto-load users when switching to users tab
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'users' && allUsers.length === 0) {
      console.log('Users tab activated, loading all users...');
      loadAllUsers();
    }
  }, [activeTab, user]);

  const loadAdminData = async () => {
    try {
      setLoadingNurses(true);
      setError('');
      console.log('Loading admin data...');

      const pendingNursesData = await apiService.getPendingNurses().catch((err) => {
        console.warn('Failed to load pending nurses:', err);
        return []; // Return empty array on error
      });

      setPendingNurses(Array.isArray(pendingNursesData) ? pendingNursesData : []);
      console.log('Admin data loaded successfully');
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      // Set empty array and don't show error to user
      setPendingNurses([]);
    } finally {
      setLoadingNurses(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      setLoadingNurses(true);
      setError('');
      console.log('Loading all users...');

      const usersData = await apiService.getAllUsers().catch((err) => {
        console.warn('Failed to load all users, using fallback:', err);
        return []; // Return empty array on error
      });

      console.log('Users data loaded:', usersData);
      setAllUsers(Array.isArray(usersData) ? usersData : []);

      if (!Array.isArray(usersData) || usersData.length === 0) {
        console.log('No users data available, this is normal if backend endpoint is not implemented');
      }
    } catch (err: any) {
      console.error('Failed to load all users:', err);
      // Set empty array and don't show error to user
      setAllUsers([]);
      console.log('Set empty users array due to error');
    } finally {
      setLoadingNurses(false);
    }
  };

  const handleApproveNurse = async (nurseId: string, nurseName: string) => {
    try {
      setError('');
      setSuccessMessage('');
      setProcessingId(nurseId);
      console.log('Approving nurse:', nurseId, nurseName);

      await apiService.verifyNurse(nurseId);
      setSuccessMessage(`✅ ${nurseName} has been approved successfully!`);

      await loadAdminData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to approve nurse:', err);
      setError(`Failed to approve ${nurseName}. Please try again.`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingId('');
    }
  };

  const handleRejectNurse = async (nurseId: string, nurseName: string) => {
    try {
      setError('');
      setSuccessMessage('');
      setProcessingId(nurseId);
      console.log('Rejecting nurse:', nurseId, nurseName);

      await apiService.rejectNurse(nurseId);
      setSuccessMessage(`❌ ${nurseName} application has been rejected.`);

      await loadAdminData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to reject nurse:', err);
      setError(`Failed to reject ${nurseName}. Please try again.`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingId('');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please log in to access your dashboard.</p>
            <button
              onClick={() => navigationUtils.goToLogin()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Admin Dashboard
  if (user.role === 'admin') {
    return (
      <ErrorBoundary>
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

            {/* Session Status */}
            <SessionStatus />

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
                  <button
                    onClick={() => {
                      console.log('All Users tab clicked, current users:', allUsers.length);
                      setActiveTab('users');
                      setError(''); // Clear any previous errors
                      loadAllUsers(); // Always reload to get fresh data
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'users'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    👥 All Users ({allUsers.length > 0 ? allUsers.length : stats.totalUsers || 0})
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
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        All Nurses ({stats.totalNurses || 0})
                      </h3>
                      <div className="flex space-x-2">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {stats.verifiedNurses || 0} Verified
                        </span>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {pendingNurses.length} Pending
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nurse
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Experience
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Specializations
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingNurses.map((nurse) => (
                            <tr key={nurse.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {nurse.name?.charAt(0) || 'N'}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{nurse.name || 'Unknown'}</div>
                                    <div className="text-sm text-gray-500">{nurse.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {nurse.yearsOfExperience || 0} years
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {nurse.specializations?.join(', ') || 'None specified'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApproveNurse(nurse.id, nurse.name || 'Unknown')}
                                    disabled={processingId === nurse.id}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {processingId === nurse.id ? (
                                      <>
                                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="-ml-1 mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Approve
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRejectNurse(nurse.id, nurse.name || 'Unknown')}
                                    disabled={processingId === nurse.id}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {processingId === nurse.id ? (
                                      <>
                                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="-ml-1 mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Reject
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {pendingNurses.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                No pending nurses to display
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Request Management ({stats.totalRequests || 0})
                      </h3>
                      <div className="flex space-x-2">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {stats.pendingRequests || 0} Pending
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {stats.completedRequests || 0} Completed
                        </span>
                      </div>
                    </div>

                    {recentRequests.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Request
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Patient
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nurse
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentRequests.map((request) => (
                              <tr key={request.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {request.title || 'Nursing Request'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {request.description?.substring(0, 50) || 'No description'}...
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {request.patient?.name || 'Unknown Patient'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {request.nurse?.name || 'Not assigned'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <StatusBadge status={request.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V7a2 2 0 012-2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
                        <p className="mt-1 text-sm text-gray-500">No requests have been created yet.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        All Platform Users ({allUsers.length})
                      </h3>
                      <div className="flex space-x-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {allUsers.filter(u => u.role === 'admin').length} Admins
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {allUsers.filter(u => u.role === 'nurse').length} Nurses
                        </span>
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {allUsers.filter(u => u.role === 'patient').length} Patients
                        </span>
                      </div>
                    </div>

                    {/* User Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allUsers.map((user) => (
                        <div key={user.id || user._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                          {/* Card Header */}
                          <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-medium text-gray-900 truncate">{user.name || 'Unknown User'}</h3>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>

                            {/* Role and Status Badges */}
                            <div className="mt-4 flex space-x-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'nurse' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1) || 'Unknown'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.status === 'verified' ? 'bg-green-100 text-green-800' :
                                user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.status?.charAt(0)?.toUpperCase() + user.status?.slice(1) || 'Unknown'}
                              </span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-6">
                            {/* Contact Information */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L6.16 10.928c-.732.732-.732 1.919 0 2.651l2.26 2.26c.732.732 1.919.732 2.651 0l1.541-1.541a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {user.phone || 'No phone'}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {user.address || 'No address'}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                                Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                              </div>
                            </div>

                            {/* Role-specific Information */}
                            {user.role === 'nurse' && (
                              <div className="bg-green-50 rounded-lg p-3 space-y-2">
                                <h4 className="text-sm font-medium text-green-900">Professional Info</h4>
                                <div className="text-xs text-green-700 space-y-1">
                                  <div><strong>Experience:</strong> {user.yearsOfExperience || 0} years</div>
                                  <div><strong>Rate:</strong> ${user.hourlyRate || 0}/hr</div>
                                  <div><strong>Specializations:</strong></div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {user.specializations?.map((spec: string, index: number) => (
                                      <span key={index} className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                                        {spec}
                                      </span>
                                    )) || <span className="text-gray-500">None specified</span>}
                                  </div>
                                </div>
                              </div>
                            )}

                            {user.role === 'patient' && (
                              <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                                <h4 className="text-sm font-medium text-purple-900">Patient Info</h4>
                                <div className="text-xs text-purple-700 space-y-1">
                                  <div><strong>Age:</strong> {user.dateOfBirth ?
                                    Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                                    : 'Unknown'} years</div>
                                  <div><strong>Gender:</strong> {user.gender || 'Not specified'}</div>
                                </div>
                              </div>
                            )}

                            {user.role === 'admin' && (
                              <div className="bg-red-50 rounded-lg p-3">
                                <h4 className="text-sm font-medium text-red-900">Administrator</h4>
                                <p className="text-xs text-red-700">Full platform access and management privileges</p>
                              </div>
                            )}
                          </div>

                          {/* Card Footer - Admin Actions */}
                          {user.role !== 'admin' && (
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Admin Actions</span>
                                <div className="flex space-x-2">
                                  <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                                    View Details
                                  </button>
                                  {user.status === 'pending' && (
                                    <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors">
                                      Approve
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {allUsers.length === 0 && (
                        <div className="col-span-full text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                          <p className="mt-1 text-sm text-gray-500">Click "All Users" tab to load user data from the backend.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Layout>
      </ErrorBoundary>
    );
  }

  // Regular User Dashboard (Patient/Nurse)
  return (
    <ErrorBoundary>
      <Layout title={`Welcome back, ${user.name}!`}>
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Session Status */}
        <SessionStatus />

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
              <div className="flex items-center space-x-4">
                <button
                  onClick={loadDashboardData}
                  disabled={loadingStats}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                >
                  {loadingStats ? '🔄' : '🔄'} Refresh
                </button>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="text-lg font-semibold text-blue-600 capitalize">{user.role}</p>
                </div>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {user.role === 'patient' && (
              <>
                <button
                  onClick={() => {
                    console.log('Dashboard: Navigating to /requests/create');
                    navigationUtils.goToCreateRequest();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-center transition-colors block w-full"
                >
                  📝 Create New Request
                </button>
                <button
                  onClick={() => {
                    console.log('Dashboard: Navigating to /requests');
                    navigationUtils.navigateTo('/requests');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-center transition-colors block w-full"
                >
                  📋 View My Requests
                </button>
                <button
                  onClick={() => {
                    console.log('Dashboard: Navigating to /nurses');
                    navigationUtils.goToNurses();
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-center transition-colors block w-full"
                >
                  👩‍⚕️ Find Nurses
                </button>
                <button
                  onClick={() => {
                    console.log('Dashboard: Navigating to /profile');
                    navigationUtils.goToProfile();
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-center transition-colors block w-full"
                >
                  ⚙️ Update Profile
                </button>
              </>
            )}

            {user.role === 'nurse' && (
              <>
                {needsProfileCompletion ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center col-span-3">
                    <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Complete Your Profile</h3>
                    <p className="text-blue-700 mb-4">
                      Please complete your nurse profile setup to access all platform features.
                    </p>
                    {(() => {
                      const completionStatus = getCompletionStatus();
                      return completionStatus && (
                        <div className="mb-4">
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
                        </div>
                      );
                    })()}
                    <button
                      onClick={() => navigationUtils.navigateTo('/nurse-profile-complete')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Continue Setup
                    </button>
                  </div>
                ) : isUnderReview ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center col-span-3">
                    <div className="animate-pulse">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Profile Under Review</h3>
                    <p className="text-yellow-700 mb-4">
                      Your nurse profile is currently being reviewed by our admin team.
                      You'll be able to access all features once your profile is approved.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-yellow-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      <span>Awaiting admin approval...</span>
                    </div>
                  </div>
                ) : canAccessDashboard ? (
                  <>
                    <button
                      onClick={() => {
                        console.log('Dashboard: Nurse navigating to /requests');
                        navigationUtils.navigateTo('/requests');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-center transition-colors block w-full"
                    >
                      📋 View Available Requests
                    </button>
                    <button
                      onClick={() => {
                        console.log('Dashboard: Nurse navigating to /requests?status=accepted');
                        navigationUtils.navigateTo('/requests?status=accepted');
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-center transition-colors block w-full"
                    >
                      ✅ My Active Requests
                    </button>
                    <button
                      onClick={() => {
                        console.log('Dashboard: Nurse navigating to /profile');
                        navigationUtils.goToProfile();
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-center transition-colors block w-full"
                    >
                      ⚙️ Update Profile
                    </button>
                    <button
                      onClick={() => apiService.toggleNurseAvailability()}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-center transition-colors w-full"
                    >
                      🔄 Toggle Availability
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
                    <button
                      onClick={() => {
                        console.log(`Dashboard: Navigating to /requests/${request.id}`);
                        navigationUtils.goToRequest(request.id);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
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
    </ErrorBoundary>
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
