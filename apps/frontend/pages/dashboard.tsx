import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import Layout, { Card, LoadingSpinner, StatusBadge } from '../components/Layout';
import { apiService } from '../lib/api';
import Link from 'next/link';

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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else if (!loading) {
      // User is not authenticated and loading is complete
      setLoadingStats(false);
    }
  }, [user, loading]);

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      setError('');

      // Load stats based on user role
      if (user?.role === 'admin') {
        try {
          console.log('Loading admin stats...');
          const adminStatsResponse = await apiService.getAdminStats();
          console.log('Admin stats response:', adminStatsResponse);

          // The API service now returns the data directly
          setStats(adminStatsResponse as DashboardStats);
        } catch (adminError: any) {
          console.error('Failed to load admin stats:', adminError);
          // Fallback to basic admin stats
          setStats({
            totalUsers: 0,
            totalPatients: 0,
            totalNurses: 0,
            verifiedNurses: 0,
            pendingNurses: 0,
            totalRequests: 0,
            pendingRequests: 0,
            completedRequests: 0,
            cancelledRequests: 0,
            monthlyGrowth: { users: 0, requests: 0 }
          });
          throw new Error(`Admin stats error: ${adminError.message}`);
        }
      } else {
        try {
          console.log('Loading dashboard stats...');
          const dashboardStatsResponse = await apiService.getDashboardStats();
          console.log('Dashboard stats response:', dashboardStatsResponse);

          // The API service now returns the data directly
          setStats(dashboardStatsResponse as DashboardStats);
        } catch (dashboardError: any) {
          console.error('Failed to load dashboard stats:', dashboardError);
          // Fallback to basic stats - don't throw error, just set empty data
          setStats({
            totalRequests: 0,
            pendingRequests: 0,
            completedRequests: 0,
            cancelledRequests: 0,
            acceptedRequests: 0,
            inProgressRequests: 0
          });
          console.warn('Using fallback dashboard stats due to error:', dashboardError.message);
        }
      }

      // Load recent requests - handle gracefully if it fails
      try {
        console.log('Loading recent requests...');
        const requestsArray = await apiService.getRequests();
        console.log('Requests array:', requestsArray);
        setRecentRequests(requestsArray.slice(0, 5)); // Show only 5 recent requests
      } catch (requestsError: any) {
        console.error('Failed to load recent requests:', requestsError);
        // Don't fail the entire dashboard if requests fail
        setRecentRequests([]);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');

      // Set empty data to prevent further errors
      setStats({});
      setRecentRequests([]);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard.</p>
          <div className="space-x-4">
            <a
              href="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
            <a
              href="/register"
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Register
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Welcome back, ${user.name}!`}>
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => loadDashboardData()}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
                title="Accepted Requests"
                value={stats.acceptedRequests || 0}
                icon="👍"
                color="purple"
              />
              <StatCard
                title="Completed Requests"
                value={stats.completedRequests || 0}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Success Rate"
                value={stats.successRate ? `${stats.successRate}%` : '0%'}
                icon="📊"
                color="blue"
              />
              <StatCard
                title="Cancelled Requests"
                value={stats.cancelledRequests || 0}
                icon="❌"
                color="red"
              />
            </>
          )}

          {user.role === 'nurse' && (
            <>
              <StatCard
                title="Accepted Requests"
                value={stats.acceptedRequests || 0}
                icon="👩‍⚕️"
                color="blue"
              />
              <StatCard
                title="In Progress"
                value={stats.inProgressRequests || 0}
                icon="🔄"
                color="purple"
              />
              <StatCard
                title="Completed Jobs"
                value={stats.completedRequests || 0}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Average Rating"
                value={stats.averageRating ? `${stats.averageRating.toFixed(1)}⭐` : 'N/A'}
                icon="⭐"
                color="yellow"
              />
            </>
          )}

          {user.role === 'admin' && (
            <>
              <StatCard
                title="Total Users"
                value={stats.totalUsers || 0}
                icon="👥"
                color="blue"
              />
              <StatCard
                title="Total Nurses"
                value={stats.totalNurses || 0}
                icon="👩‍⚕️"
                color="green"
              />
              <StatCard
                title="Pending Nurses"
                value={stats.pendingNurses || 0}
                icon="⏳"
                color="yellow"
              />
              <StatCard
                title="Total Requests"
                value={stats.totalRequests || 0}
                icon="📋"
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
                <Link href="/requests/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-center">
                  Create New Request
                </Link>
                <Link href="/nurses" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-center">
                  Find Nurses
                </Link>
                <Link href="/requests" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-center">
                  View All Requests
                </Link>
              </>
            )}

            {user.role === 'nurse' && (
              <>
                <Link href="/requests" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-center">
                  View Available Requests
                </Link>
                <Link href="/profile" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-center">
                  Update Profile
                </Link>
                <button 
                  onClick={() => apiService.toggleNurseAvailability()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-center"
                >
                  Toggle Availability
                </button>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <Link href="/admin/nurses" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-center">
                  Manage Nurses
                </Link>
                <Link href="/admin/requests" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-center">
                  View All Requests
                </Link>
                <Link href="/admin/stats" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-center">
                  Platform Analytics
                </Link>
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
              {recentRequests.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{request.title}</h4>
                    <p className="text-sm text-gray-500">{request.serviceType}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={request.status} />
                    <Link 
                      href={`/requests/${request.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
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
function StatCard({ title, value, icon, color }: {
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
