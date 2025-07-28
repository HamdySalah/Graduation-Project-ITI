import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/auth';
import { apiService } from '../../../lib/api';
import PatientLayout from '../../../components/PatientLayout';
import { ReviewSystem } from '../../../components/ReviewSystem';

interface Request {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  patientId: string;
  nurseId?: string;
  scheduledDate: string;
  patient?: {
    id: string;
    name: string;
    email: string;
  };
  nurse?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function RequestReviews() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && !authLoading) {
      loadRequest();
    }
  }, [id, authLoading]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(`/api/requests/${id}`);
      setRequest(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    // Optionally refresh request data or show success message
    console.log('Review submitted successfully');
  };

  if (authLoading || loading) {
    return (
      <PatientLayout activeItem="requests" title="Request Reviews">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  if (error) {
    return (
      <PatientLayout activeItem="requests" title="Request Reviews">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Request</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/requests')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Back to Requests
              </button>
            </div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  if (!request) {
    return (
      <PatientLayout activeItem="requests" title="Request Reviews">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Request not found</h3>
            <p className="text-gray-600 mt-2">The request you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/requests')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </PatientLayout>
    );
  }

  // Check if request is completed
  if (request.status !== 'completed') {
    return (
      <PatientLayout activeItem="requests" title="Request Reviews">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-yellow-800">Reviews Not Available</h3>
                <p className="text-yellow-600 mt-1">
                  Reviews can only be submitted after the request is completed.
                </p>
                <p className="text-sm text-yellow-600 mt-2">
                  Current status: <span className="font-medium capitalize">{request.status}</span>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push(`/requests/${request.id}`)}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors mr-3"
              >
                View Request Details
              </button>
              <button
                onClick={() => router.push('/requests')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Requests
              </button>
            </div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  // Check if user is authorized to review this request
  const isPatient = user?.id === request.patientId;
  const isNurse = user?.id === request.nurseId;
  
  if (!isPatient && !isNurse) {
    return (
      <PatientLayout activeItem="requests" title="Request Reviews">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
                <p className="text-red-600 mt-1">
                  You can only review requests you were involved in.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/requests')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Back to Requests
              </button>
            </div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  // Determine the other party for user-to-user reviews
  const otherParty = isPatient ? request.nurse : request.patient;
  const otherPartyRole = isPatient ? 'nurse' : 'patient';

  if (!otherParty) {
    return (
      <PatientLayout activeItem="requests" title="Request Reviews">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-yellow-800">Incomplete Request Information</h3>
                <p className="text-yellow-600 mt-1">
                  Unable to load complete request information for reviews.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/requests')}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
              >
                Back to Requests
              </button>
            </div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout activeItem="requests" title="Request Reviews">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => router.push('/requests')}
              className="hover:text-blue-600 transition-colors"
            >
              Requests
            </button>
            <span>›</span>
            <button
              onClick={() => router.push(`/requests/${request.id}`)}
              className="hover:text-blue-600 transition-colors"
            >
              {request.title}
            </button>
            <span>›</span>
            <span className="text-gray-900 font-medium">Reviews</span>
          </nav>
        </div>

        {/* Review System */}
        <ReviewSystem
          requestId={request.id}
          requestTitle={request.title}
          otherPartyId={otherParty.id}
          otherPartyName={otherParty.name}
          otherPartyRole={otherPartyRole}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </div>
    </PatientLayout>
  );
}
