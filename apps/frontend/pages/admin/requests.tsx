import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import AdminLayout from '../../components/admin/AdminLayout';
import apiService from '../../lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminRequest {
  id: string;
  title: string;
  description: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  nurse?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  status: string;
  serviceType: string;
  urgencyLevel: string;
  budget: number;
  estimatedDuration: number;
  address: string;
  createdAt: string;
  scheduledDate: string;
}

// Define page status filter options
const STATUS_FILTERS = [
  { value: 'all', label: 'All Requests' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' }
];

// Define page sort options
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'budget_high', label: 'Highest Budget' },
  { value: 'budget_low', label: 'Lowest Budget' },
  { value: 'urgency', label: 'Most Urgent' },
];

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}

// Admin Request Card Component
function AdminRequestCard({ request }: { request: AdminRequest }) {
  const [expanded, setExpanded] = useState(false);

  const getUrgencyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="p-6">
        {/* Request Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
              <StatusBadge status={request.status} />
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
                {request.urgencyLevel.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-1">
              {request.serviceType.replace(/_/g, ' ')}
            </p>
            <p className="text-xs text-gray-500">
              Created: {formatDate(request.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-green-600">${request.budget}</p>
            <p className="text-xs text-gray-500">{request.estimatedDuration}h duration</p>
          </div>
        </div>

        {/* Patient & Nurse Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="font-medium text-blue-900">Patient</h4>
            </div>
            <p className="text-sm font-medium text-blue-800">{request.patient.name}</p>
            <div className="flex flex-col text-xs text-blue-700 mt-1">
              <span>{request.patient.email}</span>
              <span>{request.patient.phone}</span>
            </div>
          </div>
          
          {request.nurse ? (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h4 className="font-medium text-green-900">Assigned Nurse</h4>
              </div>
              <p className="text-sm font-medium text-green-800">{request.nurse.name}</p>
              <div className="flex flex-col text-xs text-green-700 mt-1">
                <span>{request.nurse.email}</span>
                <span>{request.nurse.phone}</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-sm text-gray-500 italic">No nurse assigned yet</p>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t pt-4 mt-2 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{request.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Address</h4>
                    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{request.address}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Scheduled For</h4>
                    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                      {formatDate(request.scheduledDate)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t flex flex-wrap justify-between items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <svg className={`w-4 h-4 mr-1 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
            {expanded ? 'Show Less' : 'Show More'}
          </motion.button>
          
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/requests/${request.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Details
            </Link>
            
            {request.patient && (
              <Link
                href={`/admin/users?id=${request.patient.id}`}
                className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Patient
              </Link>
            )}
            
            {request.nurse && (
              <Link
                href={`/admin/nurses?id=${request.nurse.id}`}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Nurse
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Fetch requests from API
  useEffect(() => {
    loadRequests();
  }, [page, statusFilter, searchTerm, sortOption]);
  
  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the updated getAdminRequests method from apiService
      const params = {
        page,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        sort: sortOption
      };
      
      console.log('Fetching requests with params:', params);
      
      // Call the new API method
      const result = await apiService.getAdminRequests(params);
      console.log('Admin requests result:', result);
      
      // Extract requests from the result based on common response patterns
      if (result?.data?.requests) {
        // Response format: { data: { requests: [...], totalPages: X } }
        setRequests(result.data.requests);
        setTotalPages(result.data.totalPages || 1);
      } else if (Array.isArray(result?.data)) {
        // Response format: { data: [...] }
        setRequests(result.data);
        setTotalPages(result.totalPages || Math.ceil(result.data.length / 10) || 1);
      } else if (Array.isArray(result)) {
        // Response format: [...]
        setRequests(result);
        setTotalPages(Math.ceil(result.length / 10) || 1);
      } else if (result?.requests) {
        // Response format: { requests: [...], totalPages: X }
        setRequests(result.requests);
        setTotalPages(result.totalPages || 1);
      } else if (result?.data?.data?.requests) {
        // Response format: { data: { data: { requests: [...], totalPages: X } } }
        setRequests(result.data.data.requests);
        setTotalPages(result.data.data.totalPages || 1);
      } else if (result?.success && result?.data) {
        // Response format: { success: true, data: [...] }
        const dataArray = Array.isArray(result.data) ? result.data : [];
        setRequests(dataArray);
        setTotalPages(Math.ceil(dataArray.length / 10) || 1);
      } else {
        // Fallback for unexpected formats
        console.warn('Unexpected response format:', result);
        // Try to extract any array we can find in the response
        const fallbackData = extractArrayFromObject(result) || [];
        setRequests(fallbackData);
        setTotalPages(Math.ceil(fallbackData.length / 10) || 1);
      }
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
      setError(`Failed to load requests: ${err.message || 'Unknown error'}`);
      
      // Set empty state to avoid UI errors
      setRequests([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to extract an array from a nested object
  const extractArrayFromObject = (obj: any): any[] | null => {
    if (!obj || typeof obj !== 'object') return null;
    
    // Check if object is array
    if (Array.isArray(obj)) return obj;
    
    // Look for arrays in direct properties
    for (const key in obj) {
      if (Array.isArray(obj[key]) && obj[key].length > 0) {
        return obj[key];
      }
    }
    
    // Look one level deeper
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        for (const nestedKey in obj[key]) {
          if (Array.isArray(obj[key][nestedKey]) && obj[key][nestedKey].length > 0) {
            return obj[key][nestedKey];
          }
        }
      }
    }
    
    return null;
  };
  
  // Get status filter counts
  const getStatusCounts = () => {
    return STATUS_FILTERS.map(filter => {
      if (filter.value === 'all') {
        return { ...filter, count: requests.length };
      }
      return { 
        ...filter, 
        count: requests.filter(r => r.status === filter.value).length 
      };
    });
  };
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1); // Reset to first page on new filter
  };
  
  // Handle sort option change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setPage(1); // Reset to first page on new sort
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Service Requests Management
                </h1>
                <p className="text-gray-600">
                  View and manage all service requests across the platform
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {requests.length}
                  </div>
                  <div className="text-sm text-gray-500">
                    total requests
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by title, patient name, service type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </form>
              
              {/* Sort & Filter Controls */}
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                {/* Status Filters */}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    {getStatusCounts().map(filterOption => (
                      <motion.button
                        key={filterOption.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStatusChange(filterOption.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === filterOption.value
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {filterOption.label} ({filterOption.count})
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                {/* Sort Options */}
                <div className="w-full md:w-64">
                  <div className="relative">
                    <select
                      value={sortOption}
                      onChange={handleSortChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <p className="text-red-600">{error}</p>
              <div className="mt-2 flex justify-end">
                <button 
                  onClick={loadRequests}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Requests List */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-20 bg-gray-100 rounded mt-4"></div>
              </div>
            ))}
          </div>
        ) : requests.length > 0 ? (
          <div className="mt-6">
            {searchTerm && (
              <p className="text-sm text-gray-600 mb-4">
                Showing {requests.length} results for "{searchTerm}"
              </p>
            )}
            
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence>
                {requests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AdminRequestCard request={request} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-lg shadow-sm">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      page === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </motion.button>
                  
                  <div className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Page {page} of {totalPages}
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      page === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Next
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 mt-6"
          >
            <div className="bg-white rounded-lg shadow-sm p-12">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Results Found' : 'No Requests Available'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `No requests match "${searchTerm}". Try a different search term.` 
                  : statusFilter === 'all' 
                    ? 'There are no service requests in the system yet.' 
                    : `No ${statusFilter.replace(/_/g, ' ')} requests found at the moment.`}
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { 
                    setStatusFilter('all');
                    setSearchTerm('');
                    setSortOption('newest');
                  }}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All Requests
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
