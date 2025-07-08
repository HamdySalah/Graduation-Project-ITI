import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import Layout, { Card, LoadingSpinner, StatusBadge } from '../../components/Layout';
import { apiService } from '../../lib/api';
import Link from 'next/link';

interface AdminRequest {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  address: string;
  scheduledDate: string;
  estimatedDuration: number;
  urgencyLevel: string;
  budget: number;
  createdAt: string;
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
}

export default function AdminRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadRequests();
    }
  }, [user, filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const data = await apiService.getRequests(statusFilter);
      setRequests(data as AdminRequest[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    let filtered = requests;
    
    if (filter !== 'all') {
      filtered = filtered.filter(request => request.status === filter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.nurse?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getStatusFilters = () => [
    { value: 'all', label: 'All Requests', count: requests.length },
    { value: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
    { value: 'accepted', label: 'Accepted', count: requests.filter(r => r.status === 'accepted').length },
    { value: 'in_progress', label: 'In Progress', count: requests.filter(r => r.status === 'in_progress').length },
    { value: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length },
    { value: 'cancelled', label: 'Cancelled', count: requests.filter(r => r.status === 'cancelled').length },
  ];

  if (!user || user.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Access denied. Admin privileges required.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage All Requests">
      <div className="space-y-6">
        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search requests, patients, or nurses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {getStatusFilters().map(filterOption => (
                <button
                  key={filterOption.value}
                  onClick={() => setFilter(filterOption.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    filter === filterOption.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label} ({filterOption.count})
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <LoadingSpinner />
        ) : getFilteredRequests().length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Showing {getFilteredRequests().length} of {requests.length} requests
            </div>
            {getFilteredRequests().map(request => (
              <AdminRequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">
              {searchTerm ? 'No requests match your search criteria' : 
               filter === 'all' ? 'No requests found' : `No ${filter} requests found`}
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}

// Admin Request Card Component
function AdminRequestCard({ request }: { request: AdminRequest }) {
  const [expanded, setExpanded] = useState(false);

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
            <StatusBadge status={request.status} />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
              {request.urgencyLevel.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 mb-2">{request.serviceType.replace('_', ' ')}</p>
          <p className="text-sm text-gray-500">
            Created: {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-green-600">{request.budget} EGP</p>
          <p className="text-sm text-gray-500">{request.estimatedDuration}h duration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-blue-50 rounded-md">
          <h4 className="font-medium text-blue-900 mb-1">Patient</h4>
          <p className="text-sm text-blue-800">{request.patient.name}</p>
          <p className="text-xs text-blue-600">{request.patient.email}</p>
          <p className="text-xs text-blue-600">{request.patient.phone}</p>
        </div>
        {request.nurse && (
          <div className="p-3 bg-green-50 rounded-md">
            <h4 className="font-medium text-green-900 mb-1">Assigned Nurse</h4>
            <p className="text-sm text-green-800">{request.nurse.name}</p>
            <p className="text-xs text-green-600">{request.nurse.email}</p>
            <p className="text-xs text-green-600">{request.nurse.phone}</p>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="font-medium text-gray-500">Description:</span>
              <p className="text-gray-900 mt-1">{request.description}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Address:</span>
              <p className="text-gray-900 mt-1">{request.address}</p>
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-500">Scheduled Date:</span>
            <p className="text-gray-900">
              {new Date(request.scheduledDate).toLocaleDateString()} at{' '}
              {new Date(request.scheduledDate).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
        <div className="flex space-x-2">
          <Link
            href={`/requests/${request.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details
          </Link>
          {request.patient && (
            <Link
              href={`/admin/users/${request.patient.id}`}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              View Patient
            </Link>
          )}
          {request.nurse && (
            <Link
              href={`/admin/nurses/${request.nurse.id}`}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              View Nurse
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
