import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import apiService from '../lib/api';
import Layout from '../components/Layout';

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
  acceptedAt?: string;
  patientCompleted?: boolean;
  patientCompletedAt?: string;
  nurseCompleted?: boolean;
  nurseCompletedAt?: string;
  patient?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    age?: number;
    condition?: string;
  };
}

interface Application {
  id: string;
  requestId: string;
  nurseId: string;
  price: number;
  estimatedTime: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  request?: Request;
}

export default function ActiveRequests() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeRequests, setActiveRequests] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'nurse') {
      loadActiveRequests();
    }
  }, [user]);

  const loadActiveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all nurse applications
      const response = await apiService.getApplicationsByNurse();
      console.log('Raw API response:', response);

      // Handle different response formats
      const applications = response?.data || response || [];
      console.log('Extracted applications:', applications);

      // Ensure applications is an array
      const applicationsArray = Array.isArray(applications) ? applications : [];
      console.log('Applications array:', applicationsArray);

      // Filter only accepted applications where request status is 'in_progress'
      const activeApps = applicationsArray.filter(app =>
        app.status === 'accepted' &&
        app.request &&
        (app.request.status === 'in_progress' || app.request.status === 'accepted')
      );
      
      setActiveRequests(activeApps);
    } catch (err) {
      console.error('Error loading active requests:', err);
      setError('Failed to load active requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    try {
      const confirmed = window.confirm('Are you sure you want to mark this request as completed?');
      if (!confirmed) return;

      await apiService.markRequestCompletedByNurse(requestId);

      alert('Request marked as completed successfully!');

      // Redirect to completed requests page
      router.push('/completed-requests');
    } catch (err) {
      console.error('Error completing request:', err);
      alert('Failed to complete request. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'in_progress': 'bg-blue-100 text-blue-800',
      'accepted': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800'
    };
    
    const statusText = {
      'in_progress': 'In Progress',
      'accepted': 'Accepted',
      'completed': 'Completed'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyClasses = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
      'urgent': 'bg-red-200 text-red-900'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyClasses[urgency] || 'bg-gray-100 text-gray-800'}`}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </span>
    );
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please log in to view this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (user.role !== 'nurse') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">This page is only accessible to nurses.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Active Requests</h1>
            <p className="mt-2 text-gray-600">
              Track and manage your accepted patient requests
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Active Requests List */}
          {!loading && !error && (
            <>
              {activeRequests.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any active requests at the moment.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeRequests.map((application) => (
                    <div key={application.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                      <div className="p-6">
                        {/* Request Title and Status */}
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {application.request?.title}
                          </h3>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(application.request?.status || 'unknown')}
                            {getUrgencyBadge(application.request?.urgencyLevel || 'medium')}
                          </div>
                        </div>

                        {/* Patient Info */}
                        {application.request?.patient && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Name:</span> {application.request.patient.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Phone:</span> {application.request.patient.phone}
                            </p>
                            {application.request.patient.age && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Age:</span> {application.request.patient.age}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Patient Completion Notification */}
                        {application.request?.patientCompleted && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-green-800">Patient marked as complete</p>
                                <p className="text-xs text-green-600">
                                  {application.request.patientCompletedAt &&
                                    `Completed on ${new Date(application.request.patientCompletedAt).toLocaleDateString()}`
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Request Details */}
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Service:</span> {application.request?.serviceType}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Address:</span> {application.request?.address}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Scheduled:</span> {new Date(application.request?.scheduledDate || '').toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Your Price:</span> ${application.price}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Estimated Time:</span> {application.estimatedTime} hours
                          </p>
                        </div>

                        {/* Description */}
                        {application.request?.description && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {application.request.description}
                            </p>
                          </div>
                        )}

                        {/* Complete Button */}
                        {application.request?.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteRequest(application.request!.id)}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                          >
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
