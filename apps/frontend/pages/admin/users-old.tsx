import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { apiService } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'patient' | 'nurse' | 'admin';
  status: 'active' | 'inactive' | 'pending' | 'verified';
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getAllUsers();
      console.log('Loaded users:', data);

      // If no data from API, use sample data to match the UI design
      if (!data || data.length === 0) {
        const sampleUsers: User[] = [
          {
            _id: '1',
            name: 'Dr. Emily Carter',
            email: 'emily.carter@example.com',
            role: 'nurse',
            status: 'active',
            phone: '+1234567890',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          },
          {
            _id: '2',
            name: 'Robert Johnson',
            email: 'robert.johnson@example.com',
            role: 'patient',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            _id: '3',
            name: 'Dr. Sarah Lee',
            email: 'sarah.lee@example.com',
            role: 'nurse',
            status: 'inactive',
            createdAt: new Date().toISOString()
          },
          {
            _id: '4',
            name: 'Michael Brown',
            email: 'michael.brown@example.com',
            role: 'patient',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            _id: '5',
            name: 'Dr. David Wilson',
            email: 'david.wilson@example.com',
            role: 'nurse',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            _id: '6',
            name: 'Jessica Davis',
            email: 'jessica.davis@example.com',
            role: 'patient',
            status: 'inactive',
            createdAt: new Date().toISOString()
          },
          {
            _id: '7',
            name: 'Dr. Christopher Clark',
            email: 'christopher.clark@example.com',
            role: 'nurse',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            _id: '8',
            name: 'Ashley Taylor',
            email: 'ashley.taylor@example.com',
            role: 'patient',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            _id: '9',
            name: 'Dr. Matthew Hall',
            email: 'matthew.hall@example.com',
            role: 'nurse',
            status: 'inactive',
            createdAt: new Date().toISOString()
          },
          {
            _id: '10',
            name: 'Amanda White',
            email: 'amanda.white@example.com',
            role: 'patient',
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ];
        setUsers(sampleUsers);
        setFilteredUsers(sampleUsers);
      } else {
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term, role, and status
  const applyFilters = () => {
    let filtered = users;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  // Apply filters whenever search term or filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, roleFilter, statusFilter, users]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'nurse':
        return 'bg-blue-100 text-blue-800';
      case 'patient':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

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
                className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-lg">🏠</span>
                <span>Dashboard</span>
              </a>
              <a
                href="/admin/users"
                className="flex items-center space-x-3 px-3 py-3 text-sm font-medium bg-gray-100 text-gray-900 rounded-lg"
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
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                <p className="text-gray-600 mt-2">Manage all users on the platform</p>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search user by name, role or status"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Users Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
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
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              <span className="ml-2 text-gray-600">Loading users...</span>
                            </div>
                          </td>
                        </tr>
                      ) : getFilteredUsers().length > 0 ? (
                        getFilteredUsers().map((userData) => (
                          <tr key={userData._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {userData.name?.charAt(0) || 'U'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {userData.name || 'Unknown User'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userData.role)}`}>
                                {userData.role?.charAt(0).toUpperCase() + userData.role?.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(userData.status)}`}>
                                {userData.status === 'active' ? 'Active' :
                                 userData.status === 'verified' ? 'Active' :
                                 userData.status === 'pending' ? 'Inactive' :
                                 userData.status === 'inactive' ? 'Inactive' :
                                 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  // TODO: Implement view details functionality
                                  console.log('View details for user:', userData._id);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            {searchTerm ? 'No users match your search criteria' : 'No users found'}
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
    </ErrorBoundary>
  );
}
