import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNurseAccessStatus } from '../hooks/useNurseAccessStatus';
import Layout, { Card, LoadingSpinner, StatusBadge } from '../components/Layout';
import { apiService } from '../lib/api';
import SessionStatus from '../components/SessionStatus';
// import ErrorBoundary from '../components/ErrorBoundary';
import { navigationUtils } from '../lib/navigation';
import PatientLayout from '../components/PatientLayout';
import ErrorDisplay from '../components/ErrorDisplay';
import { CustomError, ErrorCode } from '../lib/errors';
import { errorHandler } from '../lib/errorHandler';


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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
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
  const [error, setError] = useState<CustomError | string>('');
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
            const customError = errorHandler.handleError(err);
            setError(customError);
            return {};
          }),
          apiService.getRequests().catch((err) => {
            console.warn('Requests failed:', err);
            const customError = errorHandler.handleError(err);
            setError(customError);
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
              type="button"
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

  // Check if nurse account is rejected
  if (user.role === 'nurse' && user.status === 'rejected') {
    const rejectedError = new CustomError(
      ErrorCode.ACCOUNT_SUSPENDED,
      'Account has been rejected',
      'Your nurse account has been rejected. Please contact support for more information.',
      403
    );

    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md w-full">
            <ErrorDisplay
              error={rejectedError}
              onDismiss={() => {
                // Redirect to account rejected page
                window.location.href = '/account-rejected';
              }}
            />
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => window.location.href = '/account-rejected'}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Account Status →
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Admin Dashboard with new UI
  if (user.role === 'admin') {
    return (
      <>
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
                  <ErrorDisplay
                    error={error}
                    className="mb-6"
                    onDismiss={() => setError('')}
                    onRetry={() => {
                      setError('');
                      loadDashboardData();
                    }}
                  />
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

                {/* Recent Activity Section */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
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
                          {/* Sample data matching the UI design */}
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  S
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">Sarah Miller</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Nurse
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900">
                                View Profile
                              </button>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  D
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">David Lee</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Patient
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900">
                                View Profile
                              </button>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  E
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">Emily Chen</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Nurse
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900">
                                View Profile
                              </button>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  R
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">Robert Green</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Patient
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900">
                                View Profile
                              </button>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  O
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">Olivia White</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Nurse
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900">
                                View Profile
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Patient Dashboard with new UI
  if (user.role === 'patient') {
    return (
      <>
        <PatientLayout activeItem="dashboard" title="Dashboard">
          <div className="max-w-6xl">
            {/* Error Display */}
            {error && (
              <ErrorDisplay
                error={error}
                className="mb-6"
                onDismiss={() => setError('')}
                onRetry={() => {
                  setError('');
                  loadDashboardData();
                }}
              />
            )}

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
        </PatientLayout>
      </>
    );
  }
  // Regular User Dashboard (Patient/Nurse)
  if (user.role === 'patient') {
    return (
      <>
        <Layout title={`Welcome back, ${user.name}!`}>
          <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar (نفس الروابط الأصلية فقط) */}
            <aside className="w-64 bg-white border-r flex flex-col justify-between py-8 px-4 min-h-screen">
              <div>
                <div className="flex flex-col items-center mb-10">
                  <img
                    src={user.avatarUrl || '/default-avatar.png'}
                    alt={user.name}
                    className="w-14 h-14 rounded-full mb-2 border"
                  />
                  <div className="font-semibold text-base text-gray-900">{user.name}</div>
                </div>
                <nav className="space-y-2">
                  <button className="flex items-center w-full px-3 py-2 rounded-lg text-blue-700 bg-blue-50 font-medium">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" /></svg>
                    Dashboard
                  </button>
                  <button onClick={() => navigationUtils.goToCreateRequest()} className="flex items-center w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Requests
                  </button>
                  <button onClick={() => navigationUtils.goToNurses()} className="flex items-center w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
                    Nurses
                  </button>
                  {/* لا تضف أي زر أو رابط غير موجود */}
                </nav>
              </div>
              <button onClick={() => navigationUtils.logout()} className="flex items-center w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 mt-8">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                Log out
              </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 px-12 py-10">
              <h1 className="text-4xl font-bold mb-6">Dashboard</h1>

              {/* إحصائيات الداشبورد الأصلية */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              </div>

              {/* Quick Actions (نفس الأزرار الأصلية فقط) */}
              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={() => navigationUtils.goToCreateRequest()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-blue-700 transition"
                >
                  New Request
                </button>
                <button
                  onClick={() => navigationUtils.navigateTo('/requests')}
                  className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-green-700 transition"
                >
                  View My Requests
                </button>
                <button
                  onClick={() => navigationUtils.goToNurses()}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full font-semibold shadow hover:bg-gray-200 transition"
                >
                  View Nurses
                </button>
              </div>

              {/* جدول الحجوزات (Recent Requests) */}
              <div className="bg-white rounded-xl shadow p-0 mb-8 border overflow-x-auto">
                <h2 className="text-xl font-bold mb-4 px-6 pt-6">My Bookings</h2>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nurse</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentRequests.length > 0 ? recentRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img src={request.nurse?.avatarUrl || '/default-avatar.png'} alt={request.nurse?.name} className="w-10 h-10 rounded-full inline-block mr-2 border" />
                          <span className="align-middle">{request.nurse?.name || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.title || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${request.status === 'Completed' ? 'bg-green-100 text-green-800' : request.status === 'Scheduled' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>{request.status || 'Pending'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => navigationUtils.goToRequest(request.id)} className="text-blue-600 font-semibold hover:underline">View</button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">No bookings found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Recent Activity (نفس الكود الأصلي) */}
              <div className="bg-white rounded-xl shadow p-6 mb-8 border">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                <ul className="space-y-4">
                  {recentRequests.length > 0 ? recentRequests.map((request) => (
                    <li key={request.id} className="flex items-center space-x-4">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      <div>
                        <div className="font-medium text-gray-900">{request.title || 'Nursing Request'}</div>
                        <div className="text-sm text-gray-500">{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown Date'}</div>
                      </div>
                    </li>
                  )) : (
                    <li className="text-gray-400">No recent activity.</li>
                  )}
                </ul>
              </div>
            </main>
          </div>
        </Layout>
      </>
    );
  }

  // Regular User Dashboard (Patient/Nurse)
  return (
    <PatientLayout activeItem="dashboard" title="Dashboard">
      <div className="max-w-6xl">
              {/* Error Display */}
              {error && (
                <ErrorDisplay
                  error={error}
                  className="mb-6"
                  onDismiss={() => setError('')}
                  onRetry={() => {
                    setError('');
                    loadDashboardData();
                  }}
                />
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
      </PatientLayout>
  );
}