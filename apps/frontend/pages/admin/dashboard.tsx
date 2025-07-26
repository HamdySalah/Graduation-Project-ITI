import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface AdminStats {
  pendingNurses: number;
  totalNurses: number;
  verifiedNurses: number;
  totalPatients: number;
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    pendingNurses: 0,
    totalNurses: 0,
    verifiedNurses: 0,
    totalPatients: 0,
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await apiService.getAdminStats();
        
        // If the API returns data in a nested structure, extract it
        const statsData = data?.data || data || {};
        
        setStats({
          pendingNurses: statsData.pendingNurses || 0,
          totalNurses: statsData.totalNurses || 0,
          verifiedNurses: statsData.verifiedNurses || 0,
          totalPatients: statsData.totalPatients || 0,
          totalRequests: statsData.totalRequests || 0,
          activeRequests: statsData.activeRequests || 0,
          completedRequests: statsData.completedRequests || 0,
        });
      } catch (err: any) {
        console.error('Failed to load admin stats:', err);
        setError(`Failed to load dashboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const quickLinks = [
    { 
      title: 'Review Nurse Applications', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      href: '/admin/nurse-approvals',
      color: 'bg-gradient-to-r from-blue-500 to-blue-700',
      count: stats.pendingNurses,
      description: 'Review and verify pending nurse applications',
      priority: stats.pendingNurses > 0 ? 'high' : 'normal'
    },
    { 
      title: 'Manage Requests', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ), 
      href: '/admin/requests',
      color: 'bg-gradient-to-r from-purple-500 to-purple-700',
      count: stats.activeRequests,
      description: 'View and manage patient service requests'
    },
    { 
      title: 'User Management', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ), 
      href: '/admin/users',
      color: 'bg-gradient-to-r from-green-500 to-green-700',
      count: stats.totalPatients,
      description: 'Manage patients and nurse profiles'
    },
    { 
      title: 'Analytics', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      href: '/admin/analytics',
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-700',
      description: 'View platform analytics and reports'
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to the CareConnect admin panel</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Nurses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNurses}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <span className="text-green-600 font-medium">
                {stats.verifiedNurses} verified
              </span>
              <span className="mx-2 text-gray-400">•</span>
              <Link href="/admin/nurse-approvals" className="text-blue-600 hover:text-blue-800 font-medium">
                {stats.pendingNurses} pending
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857M15 6a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 9a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <Link href="/admin/users" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                View all patients
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <span className="text-yellow-600 font-medium">
                {stats.activeRequests} active
              </span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-green-600 font-medium">
                {stats.completedRequests} completed
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-gray-900">Operational</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-green-600 text-sm font-medium">All services running</span>
            </div>
          </motion.div>
        </div>

        {/* Pending Nurse Applications - Priority Section */}
        {stats.pendingNurses > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-25 rounded-lg p-3 mr-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">⚠️ Pending Nurse Applications</h2>
                    <p className="text-white text-opacity-90">
                      {stats.pendingNurses} nurse{stats.pendingNurses !== 1 ? 's' : ''} waiting for approval
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.pendingNurses}</div>
                  <div className="text-sm text-white text-opacity-80">pending</div>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <Link href="/admin/nurse-approvals" className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Review Applications Now
                </Link>
                <Link href="/admin/nurse-approvals" className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-30 transition-colors">
                  View Details
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link href={link.href} className="block">
                <div className={`${link.color} text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow ${link.priority === 'high' ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''}`}>
                  <div className="flex items-center mb-4">
                    <div className="bg-white bg-opacity-25 rounded-full p-3 mr-4">
                      {link.icon}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-xl font-bold">{link.title}</h3>
                        {link.priority === 'high' && link.count > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-yellow-500 rounded-full">
                            Attention needed
                          </span>
                        )}
                      </div>
                      {link.count !== undefined && (
                        <p className="text-white text-opacity-90">
                          {link.count} {link.count === 1 ? 'item' : 'items'}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-white text-opacity-80">{link.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-md overflow-hidden mb-8"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent System Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New nurse approved</p>
                  <p className="text-sm text-gray-500">Nurse ID #12345 was verified by admin</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New patient registration</p>
                  <p className="text-sm text-gray-500">Patient ID #67890 completed registration</p>
                  <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New service request</p>
                  <p className="text-sm text-gray-500">Request ID #24680 was created</p>
                  <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/admin/activity" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all activity →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
