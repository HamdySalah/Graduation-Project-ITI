import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import AdminLayout from '../../components/admin/AdminLayout';
import apiService from '../../lib/api';

// Card and LoadingSpinner components with animations
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
};

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center p-10">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      <p className="mt-4 text-gray-600 font-medium">Loading analytics data...</p>
    </div>
  );
};

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

  // AdminLayout already handles auth check, so we can simplify this
  if (loading) {
    return (
      <AdminLayout title="Platform Analytics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header - Even while loading */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-4 lg:mb-0">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    📊 Platform Analytics
                  </h1>
                  <p className="text-gray-600">
                    View and analyze platform performance metrics
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading state */}
          <div className="bg-white rounded-lg shadow-sm p-10 border border-gray-200">
            <LoadingSpinner />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Platform Analytics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  📊 Platform Analytics
                </h1>
                <p className="text-gray-600">
                  View and analyze platform performance metrics
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => loadAnalytics()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time Range</h3>
          <div className="flex flex-wrap gap-2">
            {['7d', '30d', '90d', '1y'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-md'
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError('')}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
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
    </AdminLayout>
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
    blue: 'bg-gradient-to-r from-blue-400 to-blue-600',
    green: 'bg-gradient-to-r from-green-400 to-green-600',
    yellow: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    purple: 'bg-gradient-to-r from-purple-400 to-purple-600',
  };

  const borderClasses = {
    blue: 'border-blue-200',
    green: 'border-green-200',
    yellow: 'border-yellow-200',
    purple: 'border-purple-200',
  };

  return (
    <Card className={`p-6 border-2 ${borderClasses[color]} hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center">
        <div className={`${colorClasses[color]} rounded-lg p-3 shadow-md`}>
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
