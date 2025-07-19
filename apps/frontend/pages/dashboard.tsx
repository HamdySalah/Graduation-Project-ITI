import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNurseAccessStatus } from '../hooks/useNurseAccessStatus';
import Layout, { Card, LoadingSpinner, StatusBadge } from '../components/Layout';
import { apiService } from '../lib/api';
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

interface Request {
  id: string;
  title?: string;
  description?: string;
  serviceType?: string;
  status?: string;
  location?: string;
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
    canAccessDashboard,
    needsProfileCompletion,
    isUnderReview,
    getCompletionStatus
  } = useNurseAccessStatus();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

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
              totalEarnings: 0,
              averageRating: 0,
            };
          } else {
            console.log('Using fallback stats processing');
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
    } else if (!loading) {
      console.log('No user found and not loading, setting loading to false');
      setLoadingStats(false);
    }
  }, [user, loading]);

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
              <h2 className="text-2xl font-bold text-gray-900">Please Sign In</h2>
              <p className="text-gray-600 mt-2">You need to be logged in to access your dashboard.</p>
            </div>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Admin Dashboard with new UI
  if (user.role === 'admin') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-sm border-r border-gray-200">
            <div className="p-6">
              {/* User Profile Section */}
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {user.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">CareConnect</h2>
                  <p className="text-sm text-gray-600">Admin</p>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                <a
                  href="/dashboard"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium bg-gray-100 text-gray-900 rounded-lg"
                >
                  <span className="text-lg">🏠</span>
                  <span>Dashboard</span>
                </a>
                <a
                  href="/admin/users"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">👥</span>
                  <span>Users</span>
                </a>
                <a
                  href="/admin/requests"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">📋</span>
                  <span>Requests</span>
                </a>
                <a
                  href="/admin/applications"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">📄</span>
                  <span>Applications</span>
                </a>
                <a
                  href="/admin/statistics"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">📊</span>
                  <span>Statistics</span>
                </a>
                <a
                  href="/settings"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">⚙️</span>
                  <span>Settings</span>
                </a>
              </nav>

              {/* Help and Docs */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <a
                  href="/help"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <span className="text-lg">❓</span>
                  <span>Help and Docs</span>
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white">
            <div className="p-8">
              <div className="max-w-6xl">
                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                    <p className="text-green-600">{successMessage}</p>
                  </div>
                )}

                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                </div>

                {/* Overview Section */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Users Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                      </div>
                      <div className="text-3xl font-bold text-gray-900">
                        {stats.totalUsers || 1250}
                      </div>
                    </div>

                    {/* Active Requests Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Active Requests</h3>
                      </div>
                      <div className="text-3xl font-bold text-gray-900">
                        {stats.totalRequests || 320}
                      </div>
                    </div>

                    {/* Pending Applications Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Pending Applications</h3>
                      </div>
                      <div className="text-3xl font-bold text-gray-900">
                        {stats.pendingNurses || 75}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Patient Dashboard with new UI
  if (user.role === 'patient') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-sm border-r border-gray-200">
            <div className="p-6">
              {/* User Profile Section */}
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {user.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">CareConnect</h2>
                  <p className="text-sm text-gray-600">Patient</p>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                <a
                  href="/dashboard"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium bg-gray-100 text-gray-900 rounded-lg"
                >
                  <span className="text-lg">🏠</span>
                  <span>Dashboard</span>
                </a>
                <a
                  href="/requests/create"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">➕</span>
                  <span>New Request</span>
                </a>
                <a
                  href="/requests"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">📋</span>
                  <span>My Requests</span>
                </a>
                <a
                  href="/nurses"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">👩‍⚕️</span>
                  <span>Find Nurses</span>
                </a>
                <a
                  href="/settings"
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">⚙️</span>
                  <span>Settings</span>
                </a>
              </nav>

              {/* Logout Button */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <button
                  onClick={() => {
                    window.location.href = '/login';
                  }}
                  className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <span className="text-lg">🚪</span>
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white">
            <div className="p-8">
              <div className="max-w-6xl">
                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        console.log('Dashboard: Navigating to /requests/create');
                        navigationUtils.goToCreateRequest();
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      New Request
                    </button>
                    <button
                      onClick={() => {
                        console.log('Dashboard: Navigating to /nurses');
                        navigationUtils.goToNurses();
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      View Nurses
                    </button>
                  </div>
                </div>

                {/* My Bookings */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">My Bookings</h2>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Service
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recentRequests.length > 0 ? (
                            recentRequests.slice(0, 3).map((request) => (
                              <tr key={request.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                      {request.serviceType?.charAt(0) || 'S'}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {request.serviceType?.replace('_', ' ') || request.title || 'Nursing Service'}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {request.description?.substring(0, 50) || 'Professional nursing care'}...
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : 'July 15, 2024'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {request.status === 'completed' ? 'Completed' :
                                     request.status === 'in_progress' ? 'Scheduled' :
                                     request.status === 'pending' ? 'Pending' :
                                     'Scheduled'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => {
                                      console.log(`Dashboard: Navigating to /requests/${request.id}`);
                                      navigationUtils.goToRequest(request.id);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                No bookings yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Nurse Dashboard with new UI
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="p-6">
            {/* User Profile Section */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {user.name?.charAt(0) || 'N'}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">CareConnect</h2>
                <p className="text-sm text-gray-600">Nurse</p>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1">
              <a
                href="/dashboard"
                className="flex items-center space-x-3 px-3 py-3 text-sm font-medium bg-gray-100 text-gray-900 rounded-lg"
              >
                <span className="text-lg">🏠</span>
                <span>Dashboard</span>
              </a>
              <a
                href="/requests"
                className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-lg">📋</span>
                <span>Available Requests</span>
              </a>
              <a
                href="/visit-history"
                className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-lg">📅</span>
                <span>Visit History</span>
              </a>
              <a
                href="/settings"
                className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </a>
            </nav>

            {/* Logout Button */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => {
                  window.location.href = '/login';
                }}
                className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
              >
                <span className="text-lg">🚪</span>
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white">
          <div className="p-8">
            <div className="max-w-6xl">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="flex space-x-4">
                  {needsProfileCompletion ? (
                    <button
                      onClick={() => navigationUtils.navigateTo('/nurse-profile-complete')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Complete Profile
                    </button>
                  ) : isUnderReview ? (
                    <div className="bg-yellow-100 text-yellow-800 px-6 py-3 rounded-lg font-medium">
                      Profile Under Review
                    </div>
                  ) : canAccessDashboard ? (
                    <>
                      <button
                        onClick={() => {
                          console.log('Dashboard: Nurse navigating to /requests');
                          navigationUtils.navigateTo('/requests');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        View Requests
                      </button>
                      <button
                        onClick={() => {
                          console.log('Dashboard: Nurse navigating to /visit-history');
                          navigationUtils.goToVisitHistory();
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Visit History
                      </button>
                    </>
                  ) : (
                    <div className="bg-red-100 text-red-800 px-6 py-3 rounded-lg font-medium">
                      Account Not Approved
                    </div>
                  )}
                </div>
              </div>

              {/* My Bookings */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">My Bookings</h2>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Patient
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentRequests.length > 0 ? (
                          recentRequests.filter(req => req.status === 'accepted' || req.status === 'in_progress' || req.status === 'completed').slice(0, 3).map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {request.patient?.name?.charAt(0) || 'P'}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {request.patient?.name || 'Patient'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {request.serviceType?.replace('_', ' ') || request.title || 'Nursing Service'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() :
                                 request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'TBD'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  request.status === 'accepted' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {request.status === 'completed' ? 'Completed' :
                                   request.status === 'in_progress' ? 'In Progress' :
                                   request.status === 'accepted' ? 'Scheduled' :
                                   'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => {
                                    console.log(`Dashboard: Navigating to /requests/${request.id}`);
                                    navigationUtils.goToRequest(request.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                              No active bookings
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
