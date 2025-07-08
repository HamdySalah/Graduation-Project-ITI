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
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      
      // Load stats based on user role
      if (user?.role === 'admin') {
        const adminStatsResponse = await apiService.getAdminStats();
        console.log('Admin stats response:', adminStatsResponse);
        const adminStats = (adminStatsResponse as { data?: unknown })?.data || adminStatsResponse;
        setStats(adminStats as DashboardStats);
      } else {
        const dashboardStatsResponse = await apiService.getDashboardStats();
        console.log('Dashboard stats response:', dashboardStatsResponse);
        setStats(dashboardStatsResponse as DashboardStats);
      }

      // Load recent requests - getRequests now returns the data array directly
      const requestsArray = await apiService.getRequests();
      console.log('Requests array:', requestsArray);
      setRecentRequests(requestsArray.slice(0, 5)); // Show only 5 recent requests
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
    return null; // Will redirect to login
  }

  return (
    <Layout title={`Welcome back, ${user.name}!`}>
      <div className="space-y-6">
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
