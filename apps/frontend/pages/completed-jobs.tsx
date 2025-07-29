import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { apiService } from '../lib/api';
import CommonLayout from '../components/CommonLayout';
import ErrorDisplay from '../components/ErrorDisplay';
import RatingComponent from '../components/RatingComponent';
import { CustomError } from '../lib/errors';
import { errorHandler } from '../lib/errorHandler';

interface CompletedJob {
  _id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  scheduledDate: string;
  estimatedDuration: number;
  urgencyLevel: string;
  budget: number;
  patient: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  address: string;
  contactPhone: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  rating?: number;
  review?: string;
}

const CompletedJobsPage = () => {
  const { user } = useAuth();
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CustomError | null>(null);
  const [selectedJobForRating, setSelectedJobForRating] = useState<CompletedJob | null>(null);

  useEffect(() => {
    if (user?.role === 'nurse') {
      loadCompletedJobs();
    }
  }, [user]);

  const loadCompletedJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get requests where the nurse is assigned and status is 'completed'
      const response = await apiService.getRequests();
      const completedRequests = response.filter((request: any) => 
        request.status === 'completed' && request.nurse?._id === user?.id
      );
      
      setCompletedJobs(completedRequests);
    } catch (err: any) {
      console.error('Failed to load completed jobs:', err);
      const customError = errorHandler.handleError(err);
      setError(customError);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (user?.role !== 'nurse') {
    return (
      <CommonLayout activeItem="completed-jobs" allowedRoles={['nurse']}>
        <div className="p-6">
          <ErrorDisplay 
            error="Access denied. This page is only available to nurses."
            onDismiss={() => window.location.href = '/dashboard'}
          />
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout activeItem="completed-jobs" allowedRoles={['nurse']}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Completed Jobs</h1>
          <p className="text-gray-600 mt-2">
            View your completed nursing assignments and patient feedback
          </p>
        </div>

        {error && (
          <ErrorDisplay 
            error={error}
            className="mb-6"
            onDismiss={() => setError(null)}
            onRetry={loadCompletedJobs}
          />
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : completedJobs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Jobs</h3>
            <p className="text-gray-600 mb-4">You haven't completed any jobs yet.</p>
            <a
              href="/requests"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Available Requests
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {completedJobs.map((job) => (
              <div key={job._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600 mt-1">{job.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(job.urgencyLevel)}`}>
                      {job.urgencyLevel}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Name:</span> {job.patient.name}</p>
                      <p><span className="font-medium">Phone:</span> {job.contactPhone}</p>
                      <p><span className="font-medium">Address:</span> {job.address}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Service:</span> {job.serviceType.replace('_', ' ')}</p>
                      <p><span className="font-medium">Scheduled:</span> {formatDate(job.scheduledDate)}</p>
                      <p><span className="font-medium">Duration:</span> {job.estimatedDuration} hours</p>
                      <p><span className="font-medium">Payment:</span> ${job.budget}</p>
                    </div>
                  </div>
                </div>

                {job.notes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Special Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{job.notes}</p>
                  </div>
                )}

                {/* Patient Rating and Review */}
                {job.rating && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Patient Feedback</h4>
                    <div className="flex items-center mb-2">
                      <div className="flex items-center mr-2">
                        {renderStars(job.rating)}
                      </div>
                      <span className="text-sm text-gray-600">({job.rating}/5 stars)</span>
                    </div>
                    {job.review && (
                      <p className="text-sm text-gray-700 italic">"{job.review}"</p>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Completed on {job.completedAt ? formatDate(job.completedAt) : formatDate(job.createdAt)}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedJobForRating(job)}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      View/Add Reviews
                    </button>
                    <div className="flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Completed
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {completedJobs.length > 0 && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Performance Summary</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{completedJobs.length}</div>
                <div className="text-sm text-gray-600">Total Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${completedJobs.reduce((sum, job) => sum + job.budget, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {completedJobs.reduce((sum, job) => sum + job.estimatedDuration, 0)}h
                </div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {completedJobs.filter(job => job.rating).length > 0 
                    ? (completedJobs.reduce((sum, job) => sum + (job.rating || 0), 0) / completedJobs.filter(job => job.rating).length).toFixed(1)
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {selectedJobForRating && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Reviews for: {selectedJobForRating.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedJobForRating(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <RatingComponent
                  requestId={selectedJobForRating._id}
                  requestTitle={selectedJobForRating.title}
                  otherPartyId={selectedJobForRating.patient._id}
                  otherPartyName={selectedJobForRating.patient.name}
                  otherPartyRole="patient"
                  onReviewSubmitted={() => {
                    // Optionally refresh the job data or show success message
                    console.log('Review submitted successfully');
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </CommonLayout>
  );
};

export default CompletedJobsPage;
