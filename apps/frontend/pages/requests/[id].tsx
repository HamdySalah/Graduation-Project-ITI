import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';
import Layout, { Card, LoadingSpinner, StatusBadge } from '../../components/Layout';
import { apiService } from '../../lib/api';

interface RequestDetails {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  scheduledDate: string;
  estimatedDuration: number;
  urgencyLevel: string;
  specialRequirements?: string;
  budget: number;
  contactPhone: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
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
    rating?: number;
    completedJobs?: number;
  };
}

export default function RequestDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadRequestDetails();
    }
  }, [id, user]);

  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getRequestById(id as string);
      setRequest(data as RequestDetails);
    } catch (err: any) {
      setError(err.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string, cancellationReason?: string) => {
    try {
      setUpdating(true);
      await apiService.updateRequestStatus(request!.id, newStatus, cancellationReason);
      await loadRequestDetails(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to update request status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusActions = () => {
    if (!request || !user) return [];

    const actions = [];

    // Nurse actions
    if (user.role === 'nurse') {
      if (request.status === 'pending') {
        actions.push({
          label: 'Accept Request',
          action: () => handleStatusUpdate('accepted'),
          className: 'bg-green-600 hover:bg-green-700',
        });
      }
      if (request.status === 'accepted') {
        actions.push({
          label: 'Start Work',
          action: () => handleStatusUpdate('in_progress'),
          className: 'bg-purple-600 hover:bg-purple-700',
        });
      }
      if (request.status === 'in_progress') {
        actions.push({
          label: 'Complete Request',
          action: () => handleStatusUpdate('completed'),
          className: 'bg-blue-600 hover:bg-blue-700',
        });
      }
    }

    // Patient actions
    if (user.role === 'patient' && user.id === request.patient.id) {
      if (['pending', 'accepted'].includes(request.status)) {
        actions.push({
          label: 'Cancel Request',
          action: () => {
            const reason = prompt('Please provide a cancellation reason:');
            if (reason) handleStatusUpdate('cancelled', reason);
          },
          className: 'bg-red-600 hover:bg-red-700',
        });
      }
    }

    return actions;
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error || !request) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">{error || 'Request not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Request Details">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
              <p className="text-gray-600">{request.serviceType.replace('_', ' ')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.urgencyLevel === 'urgent' ? 'bg-red-100 text-red-800' :
                request.urgencyLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                request.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {request.urgencyLevel.toUpperCase()} PRIORITY
              </span>
              <StatusBadge status={request.status} />
            </div>
          </div>

          <p className="text-gray-700 mb-6">{request.description}</p>

          {/* Action Buttons */}
          {getStatusActions().length > 0 && (
            <div className="flex space-x-3">
              {getStatusActions().map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  disabled={updating}
                  className={`px-4 py-2 text-white rounded-md ${action.className} disabled:opacity-50`}
                >
                  {updating ? 'Updating...' : action.label}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Request Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-500">Location:</span>
                <p className="text-gray-900">{request.address}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Scheduled Date & Time:</span>
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
              <div>
                <span className="font-medium text-gray-500">Contact Phone:</span>
                <p className="text-gray-900">{request.contactPhone}</p>
              </div>
              {request.specialRequirements && (
                <div>
                  <span className="font-medium text-gray-500">Special Requirements:</span>
                  <p className="text-gray-900">{request.specialRequirements}</p>
                </div>
              )}
              {request.notes && (
                <div>
                  <span className="font-medium text-gray-500">Additional Notes:</span>
                  <p className="text-gray-900">{request.notes}</p>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            {/* Patient Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium text-gray-500">Name:</span> {request.patient.name}</p>
                <p><span className="font-medium text-gray-500">Email:</span> {request.patient.email}</p>
                <p><span className="font-medium text-gray-500">Phone:</span> {request.patient.phone}</p>
              </div>
            </Card>

            {/* Nurse Information */}
            {request.nurse && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Nurse</h3>
                <div className="space-y-2">
                  <p><span className="font-medium text-gray-500">Name:</span> {request.nurse.name}</p>
                  <p><span className="font-medium text-gray-500">Email:</span> {request.nurse.email}</p>
                  <p><span className="font-medium text-gray-500">Phone:</span> {request.nurse.phone}</p>
                  {request.nurse.rating && (
                    <p><span className="font-medium text-gray-500">Rating:</span> {request.nurse.rating}⭐</p>
                  )}
                  {request.nurse.completedJobs && (
                    <p><span className="font-medium text-gray-500">Completed Jobs:</span> {request.nurse.completedJobs}</p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Status History */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium">Request Created</p>
                <p className="text-sm text-gray-500">
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            {request.status !== 'pending' && (
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Status Updated to {request.status.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(request.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {request.cancellationReason && (
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Cancellation Reason</p>
                  <p className="text-sm text-gray-700">{request.cancellationReason}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Back Button */}
        <div className="flex justify-start">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ← Back to Requests
          </button>
        </div>
      </div>
    </Layout>
  );
}
