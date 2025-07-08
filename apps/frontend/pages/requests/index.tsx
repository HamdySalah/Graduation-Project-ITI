import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import Layout, { Card, LoadingSpinner, StatusBadge } from '../../components/Layout';
import { apiService } from '../../lib/api';
import Link from 'next/link';

interface Request {
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
  patient?: {
    id: string;
    name: string;
    phone: string;
  };
  nurse?: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function RequestsList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user, filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const data = await apiService.getRequests(statusFilter);
      setRequests(data as Request[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string, cancellationReason?: string) => {
    try {
      await apiService.updateRequestStatus(requestId, newStatus, cancellationReason);
      loadRequests(); // Reload the list
    } catch (err: any) {
      setError(err.message || 'Failed to update request status');
    }
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return requests;
    return requests.filter(request => request.status === filter);
  };

  const getStatusFilters = () => {
    const baseFilters = [
      { value: 'all', label: 'All Requests' },
      { value: 'pending', label: 'Pending' },
      { value: 'accepted', label: 'Accepted' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ];

    return baseFilters;
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Layout title="Service Requests">
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user.role === 'patient' ? 'My Requests' : 
               user.role === 'nurse' ? 'Available Requests' : 
               'All Requests'}
            </h2>
            <p className="text-gray-600">
              {user.role === 'patient' ? 'Manage your service requests' :
               user.role === 'nurse' ? 'Find and accept service requests' :
               'Monitor all platform requests'}
            </p>
          </div>
          {user.role === 'patient' && (
            <Link
              href="/requests/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Create New Request
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card className="p-4">
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
                {filterOption.label}
              </button>
            ))}
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
            {getFilteredRequests().map(request => (
              <RequestCard
                key={request.id}
                request={request}
                userRole={user.role}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">
              {filter === 'all' ? 'No requests found' : `No ${filter} requests found`}
            </p>
            {user.role === 'patient' && filter === 'all' && (
              <Link
                href="/requests/create"
                className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Create Your First Request
              </Link>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
}

// Request Card Component
function RequestCard({ 
  request, 
  userRole, 
  onStatusUpdate 
}: { 
  request: Request; 
  userRole: string; 
  onStatusUpdate: (id: string, status: string, reason?: string) => void;
}) {
  // Remove unused state

  const canAccept = userRole === 'nurse' && request.status === 'pending';
  const canStartProgress = userRole === 'nurse' && request.status === 'accepted';
  const canComplete = userRole === 'nurse' && request.status === 'in_progress';
  const canCancel = userRole === 'patient' && ['pending', 'accepted'].includes(request.status);

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
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
          <p className="text-sm text-gray-600">{request.serviceType.replace('_', ' ')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
            {request.urgencyLevel.toUpperCase()}
          </span>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <p className="text-gray-700 mb-4">{request.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <span className="font-medium text-gray-500">Location:</span>
          <p className="text-gray-900">{request.address}</p>
        </div>
        <div>
          <span className="font-medium text-gray-500">Scheduled:</span>
          <p className="text-gray-900">
            {new Date(request.scheduledDate).toLocaleDateString()} at{' '}
            {new Date(request.scheduledDate).toLocaleTimeString()}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-500">Duration:</span>
          <p className="text-gray-900">{request.estimatedDuration} hours</p>
        </div>
        <div>
          <span className="font-medium text-gray-500">Budget:</span>
          <p className="text-gray-900">{request.budget} EGP</p>
        </div>
      </div>

      {/* Patient/Nurse Info */}
      {request.patient && userRole !== 'patient' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm"><strong>Patient:</strong> {request.patient.name}</p>
          <p className="text-sm"><strong>Phone:</strong> {request.patient.phone}</p>
        </div>
      )}

      {request.nurse && userRole !== 'nurse' && (
        <div className="mb-4 p-3 bg-green-50 rounded-md">
          <p className="text-sm"><strong>Nurse:</strong> {request.nurse.name}</p>
          <p className="text-sm"><strong>Phone:</strong> {request.nurse.phone}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link
          href={`/requests/${request.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details
        </Link>

        <div className="flex space-x-2">
          {canAccept && (
            <button
              onClick={() => onStatusUpdate(request.id, 'accepted')}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              Accept
            </button>
          )}
          {canStartProgress && (
            <button
              onClick={() => onStatusUpdate(request.id, 'in_progress')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
            >
              Start Work
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => onStatusUpdate(request.id, 'completed')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              Complete
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => {
                const reason = prompt('Please provide a cancellation reason:');
                if (reason) onStatusUpdate(request.id, 'cancelled', reason);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
