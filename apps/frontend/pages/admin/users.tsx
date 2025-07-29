import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import apiService from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface User {
  _id: string;
  id?: string; // Some APIs might return id instead of _id
  name: string;
  email: string;
  role: 'patient' | 'nurse' | 'admin';
  status: 'active' | 'inactive' | 'pending' | 'verified' | 'rejected';
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  profileImage?: string;
  address?: string;
}

export default function UsersManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [processingId, setProcessingId] = useState<string>('');

  // Define pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getAllUsers();
      console.log('Loaded users:', data);

      if (Array.isArray(data) && data.length > 0) {
        const formattedUsers = data.map(user => ({
          ...user,
          _id: user._id || user.id, // Ensure we always have an _id property
        }));
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } else {
        setError('No users found or invalid data format');
        // Use sample data to show UI even if API fails
        useSampleData();
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
      // Use sample data to show UI even if API fails
      useSampleData();
    } finally {
      setLoading(false);
    }
  };

  const useSampleData = () => {
    const sampleUsers: User[] = [
      {
        _id: '1',
        name: 'Ahmed Mohamed',
        email: 'ahmed.mohamed@example.com',
        role: 'admin',
        status: 'active',
        phone: '+201234567890',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        address: 'Cairo, Egypt'
      },
      {
        _id: '2',
        name: 'Sara Ahmed',
        email: 'sara.ahmed@example.com',
        role: 'patient',
        status: 'active',
        phone: '+201987654321',
        createdAt: new Date().toISOString(),
        lastLogin: new Date(Date.now() - 86400000).toISOString(),
        address: 'Alexandria, Egypt'
      },
      {
        _id: '3',
        name: 'Dr. Mahmoud Ali',
        email: 'mahmoud.ali@example.com',
        role: 'nurse',
        status: 'verified',
        phone: '+201122334455',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        lastLogin: new Date(Date.now() - 2 * 86400000).toISOString(),
        address: 'Giza, Egypt'
      },
      {
        _id: '4',
        name: 'Fatma Ibrahim',
        email: 'fatma.ibrahim@example.com',
        role: 'patient',
        status: 'active',
        phone: '+201566778899',
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        address: 'Mansoura, Egypt'
      },
      {
        _id: '5',
        name: 'Dr. Ali Hassan',
        email: 'ali.hassan@example.com',
        role: 'nurse',
        status: 'pending',
        phone: '+201001122334',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        address: 'Tanta, Egypt'
      }
    ];
    
    setUsers(sampleUsers);
    setFilteredUsers(sampleUsers);
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...users];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.address && user.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }

    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'last-active') {
      result.sort((a, b) => {
        if (!a.lastLogin) return 1;
        if (!b.lastLogin) return -1;
        return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime();
      });
    }

    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, roleFilter, statusFilter, sortBy, users]);

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Status and role badge styling
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'verified':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'nurse':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case 'patient':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Show user details modal
  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Action handlers (these would be implemented with actual API calls)
  const handleActivateUser = async (userId: string) => {
    try {
      setProcessingId(userId);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update user status locally (would be replaced with actual API call)
      const updatedUsers = users.map(user => 
        user._id === userId ? {...user, status: 'active'} : user
      );
      
      setUsers(updatedUsers);
      setSuccessMessage('User activated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      // Provide a more user-friendly error message
      const errorMessage = error.message?.includes('Validation failed') 
        ? 'Could not activate user. Please try again.' 
        : (error.message || 'Failed to activate user');
      
      setError(errorMessage);
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId('');
    }
  };
  
  // Function to verify nurse
  const handleVerifyNurse = async (userId: string) => {
    try {
      setProcessingId(userId);
      
      // Make actual API call to verify the nurse
      const result = await apiService.verifyNurseStatus(userId);
      
      if (!result.success) {
        // Handle API error gracefully
        throw new Error(result.message || 'Verification failed');
      }
      
      // Update user status locally
      const updatedUsers = users.map(user => 
        user._id === userId ? {...user, status: 'verified'} : user
      );
      
      setUsers(updatedUsers);
      setSuccessMessage('Nurse verified successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      // Provide a more user-friendly error message
      const errorMessage = error.message?.includes('Validation failed') 
        ? 'Could not verify nurse. Please try again.' 
        : (error.message || 'Failed to verify nurse');
      
      setError(errorMessage);
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId('');
    }
  };
  
  const handleDeactivateUser = async (userId: string) => {
    try {
      setProcessingId(userId);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update user status locally (would be replaced with actual API call)
      const updatedUsers = users.map(user => 
        user._id === userId ? {...user, status: 'rejected'} : user
      );
      
      setUsers(updatedUsers);
      setSuccessMessage('User deactivated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      // Provide a more user-friendly error message
      const errorMessage = error.message?.includes('Validation failed') 
        ? 'Could not deactivate user. Please try again.' 
        : (error.message || 'Failed to deactivate user');
      
      setError(errorMessage);
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId('');
    }
  };
  
  return (
    <AdminLayout title="User Management">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  👥 User Management
                </h1>
                <p className="text-gray-600">
                  Manage all users registered on the platform
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {users.length}
                  </div>
                  <div className="text-sm text-gray-500">
                    total users
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Role Filter */}
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="nurse">Nurses</option>
                  <option value="patient">Patients</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
              
              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="last-active">Last Active</option>
                </select>
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

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="grid grid-cols-6 gap-4">
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              </div>
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="grid grid-cols-6 gap-4">
                  <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                  <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                  <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                  <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                  <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Results</h3>
            <p className="text-gray-500">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                ? 'No users match your search criteria. Please adjust your filters and try again.' 
                : 'No users are currently registered in the system.'}
            </p>
            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <AnimatePresence>
                      {currentUsers.map((user, index) => (
                        <motion.tr 
                          key={user._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {user.profileImage ? (
                                  <img className="h-10 w-10 rounded-full object-cover" src={user.profileImage} alt={user.name} />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                    {user.name?.charAt(0)?.toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                {user.address && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    <svg className="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {user.address}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                            {user.phone && (
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                              {getRoleIcon(user.role)}
                              {user.role === 'admin' ? 'Admin' : user.role === 'nurse' ? 'Nurse' : 'Patient'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                              {user.status === 'active' ? 'Active' : 
                               user.status === 'inactive' ? 'Inactive' : 
                               user.status === 'pending' ? 'Pending' : 
                               user.status === 'rejected' ? 'Rejected' : 'Verified'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2 rtl:space-x-reverse">
                              <button
                                onClick={() => handleViewUserDetails(user)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              
                              {user.status === 'rejected' && user.role === 'nurse' ? (
                                <button
                                  onClick={() => handleVerifyNurse(user._id)}
                                  disabled={processingId === user._id}
                                  className={`text-blue-600 hover:text-blue-900 transition-colors ${processingId === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title="Verify Nurse"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              ) : user.status === 'rejected' ? (
                                <button
                                  onClick={() => handleActivateUser(user._id)}
                                  disabled={processingId === user._id}
                                  className={`text-green-600 hover:text-green-900 transition-colors ${processingId === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title="Activate User"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              ) : user.role === 'nurse' && user.status === 'pending' ? (
                                <button
                                  onClick={() => handleVerifyNurse(user._id)}
                                  disabled={processingId === user._id}
                                  className={`text-blue-600 hover:text-blue-900 transition-colors ${processingId === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title="Verify Nurse"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeactivateUser(user._id)}
                                  disabled={processingId === user._id || user.role === 'admin'}
                                  className={`text-red-600 hover:text-red-900 transition-colors ${(processingId === user._id || user.role === 'admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title={user.role === 'admin' ? 'Cannot deactivate admin account' : 'Deactivate User'}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              )}
                              
                              <button
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                                title="More Options"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastUser, filteredUsers.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredUsers.length}</span> users
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px rtl:space-x-reverse" aria-label="Pagination">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {[...Array(totalPages)].map((_, index) => (
                          <button
                            key={index}
                            onClick={() => paginate(index + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === index + 1
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6 flex items-center justify-center flex-col">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-semibold mb-3">
                    {selectedUser.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                    {selectedUser.role === 'admin' ? 'Admin' : selectedUser.role === 'nurse' ? 'Nurse' : 'Patient'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-900 font-medium">{selectedUser.email}</span>
                  </div>
                  
                  {selectedUser.phone && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Phone Number</span>
                      <span className="text-gray-900 font-medium">{selectedUser.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedUser.status)}`}>
                      {selectedUser.status === 'active' ? 'Active' : 
                       selectedUser.status === 'inactive' ? 'Inactive' : 
                       selectedUser.status === 'pending' ? 'Pending' : 
                       selectedUser.status === 'rejected' ? 'Rejected' : 'Verified'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Registration Date</span>
                    <span className="text-gray-900 font-medium">{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  
                  {selectedUser.lastLogin && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Last Login</span>
                      <span className="text-gray-900 font-medium">{formatDate(selectedUser.lastLogin)}</span>
                    </div>
                  )}
                  
                  {selectedUser.address && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Address</span>
                      <span className="text-gray-900 font-medium">{selectedUser.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex space-x-3 rtl:space-x-reverse">
                  {selectedUser.status === 'rejected' && selectedUser.role === 'nurse' ? (
                    <button
                      onClick={() => {
                        handleVerifyNurse(selectedUser._id);
                        setShowUserModal(false);
                      }}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Verify Nurse
                    </button>
                  ) : selectedUser.status === 'rejected' ? (
                    <button
                      onClick={() => {
                        handleActivateUser(selectedUser._id);
                        setShowUserModal(false);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Activate User
                    </button>
                  ) : selectedUser.role === 'nurse' && selectedUser.status === 'pending' ? (
                    <button
                      onClick={() => {
                        handleVerifyNurse(selectedUser._id);
                        setShowUserModal(false);
                      }}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Verify Nurse
                    </button>
                  ) : selectedUser.role !== 'admin' && (
                    <button
                      onClick={() => {
                        handleDeactivateUser(selectedUser._id);
                        setShowUserModal(false);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Deactivate User
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
