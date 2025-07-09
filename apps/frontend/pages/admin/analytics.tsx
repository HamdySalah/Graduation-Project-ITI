import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import Layout, { Card, LoadingSpinner } from '../../components/Layout';
import apiService from '../../lib/api';

interface AnalyticsData {
  userGrowth: {
    labels: string[];
    patients: number[];
    nurses: number[];
  };
  requestStats: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    successRate: number;
  };
  revenueData: {
    totalRevenue: number;
    monthlyRevenue: number[];
    averageJobValue: number;
  };
  topNurses: Array<{
    id: string;
    name: string;
    rating: number;
    completedJobs: number;
    totalEarnings: number;
  }>;
  geographicData: Array<{
    area: string;
    requestCount: number;
    nurseCount: number;
  }>;
}

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAnalytics();
    }
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Loading analytics data for time range:', timeRange);

      // Fetch real analytics data from API
      const analyticsData = await apiService.getAnalytics(timeRange);
      console.log('Received analytics data:', analyticsData);

      setAnalytics(analyticsData as AnalyticsData);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics data');

      // Fallback to empty data structure
      setAnalytics({
        userGrowth: {
          labels: [],
          patients: [],
          nurses: [],
        },
        requestStats: {
          total: 0,
          completed: 0,
          cancelled: 0,
          pending: 0,
          successRate: 0,
        },
        revenueData: {
          totalRevenue: 0,
          monthlyRevenue: [],
          averageJobValue: 0,
        },
        topNurses: [],
        geographicData: [],
      });
    } finally {
      setLoading(false);
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
    <Layout title="Platform Analytics">
      <div className="space-y-6">
        {/* Time Range Selector */}
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-700">Time Range:</span>
            {['7d', '30d', '90d', '1y'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? '7 Days' : 
                 range === '30d' ? '30 Days' : 
                 range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Requests"
                value={analytics.requestStats.total}
                icon="📋"
                color="blue"
              />
              <MetricCard
                title="Success Rate"
                value={`${analytics.requestStats.successRate}%`}
                icon="✅"
                color="green"
              />
              <MetricCard
                title="Total Revenue"
                value={`${analytics.revenueData.totalRevenue.toLocaleString()} EGP`}
                icon="💰"
                color="yellow"
              />
              <MetricCard
                title="Avg Job Value"
                value={`${analytics.revenueData.averageJobValue} EGP`}
                icon="📊"
                color="purple"
              />
            </div>

            {/* Request Status Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Status Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{analytics.requestStats.completed}</div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{analytics.requestStats.pending}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{analytics.requestStats.cancelled}</div>
                  <div className="text-sm text-gray-500">Cancelled</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{analytics.requestStats.total}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              </div>
            </Card>

            {/* Top Performing Nurses */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Nurses</h3>
              <div className="space-y-4">
                {analytics.topNurses.map((nurse, index) => (
                  <div key={nurse.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{nurse.name}</h4>
                        <p className="text-sm text-gray-500">
                          ⭐ {nurse.rating} • {nurse.completedJobs} jobs completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{nurse.totalEarnings.toLocaleString()} EGP</p>
                      <p className="text-sm text-gray-500">Total Earnings</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Geographic Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
              <div className="space-y-3">
                {analytics.geographicData.map(area => (
                  <div key={area.area} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{area.area}</h4>
                      <p className="text-sm text-gray-500">{area.nurseCount} nurses available</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{area.requestCount}</p>
                      <p className="text-sm text-gray-500">Requests</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* User Growth Chart Placeholder */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Trend</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">Chart visualization would go here</p>
                  <p className="text-sm text-gray-400">
                    Patients: {analytics.userGrowth.patients[analytics.userGrowth.patients.length - 1]} | 
                    Nurses: {analytics.userGrowth.nurses[analytics.userGrowth.nurses.length - 1]}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
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
