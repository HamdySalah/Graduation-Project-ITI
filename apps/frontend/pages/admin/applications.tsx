import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { apiService } from '../../lib/api';

interface Application {
  id: string;
  nurse: string;
  request: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  applied: string;
}

export default function AdminApplications() {
  const { user, loading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>('');

  // Sample data for demonstration
  const sampleApplications: Application[] = [
    {
      id: '1',
      nurse: 'Dr. Emily Carter',
      request: 'Post-Surgery Care for Mr. Thompson',
      status: 'Pending',
      applied: '2 days ago'
    },
    {
      id: '2',
      nurse: 'Nurse David Lee',
      request: 'Elderly Care for Mrs. Rodriguez',
      status: 'Accepted',
      applied: '5 days ago'
    },
    {
      id: '3',
      nurse: 'Nurse Sarah Chen',
      request: 'Post-Surgery Care for Mr. Thompson',
      status: 'Rejected',
      applied: '1 week ago'
    },
    {
      id: '4',
      nurse: 'Nurse Michael Brown',
      request: 'Pediatric Care for Young Ethan',
      status: 'Pending',
      applied: '2 weeks ago'
    },
    {
      id: '5',
      nurse: 'Nurse Jessica Davis',
      request: 'Elderly Care for Mrs. Rodriguez',
      status: 'Accepted',
      applied: '3 weeks ago'
    },
    {
      id: '6',
      nurse: 'Nurse Robert Wilson',
      request: 'Post-Surgery Care for Mr. Thompson',
      status: 'Rejected',
      applied: '1 month ago'
    },
    {
      id: '7',
      nurse: 'Nurse Olivia Green',
      request: 'Pediatric Care for Young Ethan',
      status: 'Pending',
      applied: '1 month ago'
    },
    {
      id: '8',
      nurse: 'Nurse Ethan Clark',
      request: 'Elderly Care for Mrs. Rodriguez',
      status: 'Accepted',
      applied: '2 months ago'
    },
    {
      id: '9',
      nurse: 'Nurse Sophia Turner',
      request: 'Post-Surgery Care for Mr. Thompson',
      status: 'Rejected',
      applied: '2 months ago'
    },
    {
      id: '10',
      nurse: 'Nurse Liam Baker',
      request: 'Pediatric Care for Young Ethan',
      status: 'Pending',
      applied: '3 months ago'
    }
  ];

  useEffect(() => {
    if (user?.role === 'admin') {
      // Simulate loading
      setTimeout(() => {
        setApplications(sampleApplications);
        setLoadingData(false);
      }, 1000);
    }
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen">Access denied</div>;
  }

  return (
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
              className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
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
              className="flex items-center space-x-3 px-3 py-3 text-sm font-medium bg-gray-100 text-gray-900 rounded-lg"
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
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            </div>

            {/* Applications Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nurse
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingData ? (
                      // Loading skeleton
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="animate-pulse">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-48"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      applications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {application.nurse}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {application.request}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              application.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                              application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {application.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {application.applied}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
