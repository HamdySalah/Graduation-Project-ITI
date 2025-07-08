import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import Layout, { Card, LoadingSpinner } from '../../components/Layout';
import { apiService } from '../../lib/api';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalPatients: number;
  totalNurses: number;
  verifiedNurses: number;
  pendingNurses: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  monthlyGrowth: {
    users: number;
    requests: number;
  };
}

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
  documents?: string[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingNurses, setPendingNurses] = useState<PendingNurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, nursesData] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getPendingNurses(),
      ]);
      setStats(statsData as AdminStats); // Cast to AdminStats
      setPendingNurses(nursesData as PendingNurse[]); // Cast to PendingNurse[]
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNurse = async (nurseId: string) => {
    try {
      await apiService.verifyNurse(nurseId);
      await loadAdminData(); // Reload data
    } catch (err: any) {
      setError(err.message || 'Failed to verify nurse');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Access denied. Admin privileges required.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon="👥"
              color="blue"
              growth={stats.monthlyGrowth.users}
            />
            <StatCard
              title="Total Nurses"
              value={stats.totalNurses}
              icon="👩‍⚕️"
              color="green"
              subtitle={`${stats.verifiedNurses} verified`}
            />
            <StatCard
              title="Pending Nurses"
              value={stats.pendingNurses}
              icon="⏳"
              color="yellow"
            />
            <StatCard
              title="Total Requests"
              value={stats.totalRequests}
              icon="📋"
              color="purple"
              growth={stats.monthlyGrowth.requests}
            />
          </div>
        )}

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/nurses"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-center block"
            >
              Manage Nurses
            </Link>
            <Link
              href="/admin/requests"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-center block"
            >
              View All Requests
            </Link>
            <Link
              href="/admin/analytics"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md text-center block"
            >
              Platform Analytics
            </Link>
          </div>
        </Card>

        {/* Pending Nurse Verifications */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Pending Nurse Verifications ({pendingNurses.length})
            </h3>
            <Link
              href="/admin/nurses"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {pendingNurses.length > 0 ? (
            <div className="space-y-4">
              {pendingNurses.slice(0, 5).map(nurse => (
                <div
                  key={nurse.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{nurse.name}</h4>
                    <p className="text-sm text-gray-600">{nurse.email}</p>
                    <p className="text-sm text-gray-500">
                      License: {nurse.licenseNumber} • {nurse.yearsOfExperience} years experience
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {nurse.specializations.map(spec => (
                        <span
                          key={spec}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(nurse.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleVerifyNurse(nurse.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Verify
                    </button>
                    <Link
                      href={`/admin/nurses/${nurse.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No pending nurse verifications</p>
          )}
        </Card>

        {/* Request Statistics */}
        {stats && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Request Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completedRequests}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.cancelledRequests}</div>
                <div className="text-sm text-gray-500">Cancelled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {((stats.completedRequests / stats.totalRequests) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
  growth,
}: {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  subtitle?: string;
  growth?: number;
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
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {growth !== undefined && (
            <p className={`text-xs ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? '+' : ''}{growth} this month
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
