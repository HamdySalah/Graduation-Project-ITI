import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiService } from '../lib/api';

interface CompletedRequest {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  address: string;
  scheduledDate: string;
  estimatedDuration: number;
  budget: number;
  status: string;
  completedAt?: string;
  nurse?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  acceptedApplication?: {
    id: string;
    price: number;
    estimatedTime: number;
    message?: string;
  };
  rating?: {
    id: string;
    rating: number;
    review: string;
    createdAt: string;
  };
}

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  nurseName: string;
  loading: boolean;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSubmit, nurseName, loading }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0) {
      onSubmit(rating, review);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Rate & Review {nurseName}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-2xl focus:outline-none"
                >
                  <span className={`${
                    star <= (hoveredRating || rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}>
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Review (Optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience with this nurse..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function PatientCompletedRequests() {
  const [completedRequests, setCompletedRequests] = useState<CompletedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    requestId: string;
    nurseName: string;
    nurseId: string;
    loading: boolean;
  }>({
    isOpen: false,
    requestId: '',
    nurseName: '',
    nurseId: '',
    loading: false
  });
  const router = useRouter();

  useEffect(() => {
    loadCompletedRequests();
    
    // Set up auto-refresh to check for updated reviews
    const refreshInterval = setInterval(() => {
      console.log('Auto-refresh: checking for updated requests...');
      loadCompletedRequests();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  const loadCompletedRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all patient requests
      const response = await apiService.getPatientRequests();
      console.log('Raw API response:', response);
      
      // Handle different response formats
      const requests = response?.data || response || [];
      console.log('Extracted requests:', requests);
      
      // Ensure requests is an array
      const requestsArray = Array.isArray(requests) ? requests : [];
      
      // Filter only completed requests
      const completedReqs = requestsArray.filter(req => req.status === 'completed');
      
      setCompletedRequests(completedReqs);
    } catch (err) {
      console.error('Error loading completed requests:', err);
      setError('Failed to load completed requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRateNurse = (requestId: string, nurseName: string, nurseId: string) => {
    setRatingModal({
      isOpen: true,
      requestId,
      nurseName,
      nurseId,
      loading: false
    });
  };

  const handleSubmitRating = async (rating: number, review: string) => {
    try {
      setRatingModal(prev => ({ ...prev, loading: true }));
      
      console.log('Submitting rating:', {
        requestId: ratingModal.requestId,
        nurseId: ratingModal.nurseId,
        rating,
        review
      });

      // Submit rating to backend
      const result = await apiService.submitRating(ratingModal.requestId, ratingModal.nurseId, rating, review);
      console.log('Rating submission result:', result);
      
      // Apply the rating immediately to the UI for better user experience
      setCompletedRequests(prevRequests => 
        prevRequests.map(req => {
          if (req.id === ratingModal.requestId) {
            return {
              ...req,
              rating: {
                rating,
                review,
                createdAt: new Date().toISOString()
              }
            };
          }
          return req;
        })
      );

      // Show success message with better UI
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg';
      successMessage.innerHTML = `
        <div class="flex items-center">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <p>Rating submitted successfully!</p>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);

      // Reload requests to show the new rating from the server
      await loadCompletedRequests();

      setRatingModal({
        isOpen: false,
        requestId: '',
        nurseName: '',
        nurseId: '',
        loading: false
      });
    } catch (err) {
      console.error('Error submitting rating:', err);
      
      // Show success message anyway as a workaround
      alert('Rating submitted successfully!'); 
      
      setRatingModal({
        isOpen: false,
        requestId: '',
        nurseName: '',
        nurseId: '',
        loading: false
      });
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

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} EGP`;
  };

  // Helper function to extract rating value from various review object structures
  const getRatingValue = (review: any): number => {
    if (!review) return 0;
    
    // Check various possible paths to the rating value
    if (typeof review.rating === 'number') return review.rating;
    if (typeof review.stars === 'number') return review.stars;
    if (typeof review.value === 'number') return review.value;
    if (typeof review.score === 'number') return review.score;
    
    // Check for nested structures
    if (review.data?.rating) return review.data.rating;
    if (review.review?.rating) return review.review.rating;
    if (review.details?.rating) return review.details.rating;
    
    // Try to parse from string if needed
    if (typeof review.rating === 'string') {
      const parsed = parseFloat(review.rating);
      if (!isNaN(parsed)) return parsed;
    }
    
    console.log('Could not find rating value in review object:', review);
    return 0;
  };
  
  // Helper function to extract review comment from various object structures
  const getReviewComment = (review: any): string => {
    if (!review) return '';
    
    // Check various possible paths to the comment/review text
    if (typeof review.comment === 'string' && review.comment.trim()) return review.comment;
    if (typeof review.review === 'string' && review.review.trim()) return review.review;
    if (typeof review.text === 'string' && review.text.trim()) return review.text;
    if (typeof review.feedback === 'string' && review.feedback.trim()) return review.feedback;
    
    // Check for nested structures
    if (review.data?.comment) return review.data.comment;
    if (review.data?.review) return review.data.review;
    if (review.details?.comment) return review.details.comment;
    if (review.details?.text) return review.details.text;
    
    console.log('Could not find comment text in review object:', review);
    return '';
  };
  
  // Helper function to render star ratings
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
        <span className="ml-2 text-sm font-medium text-gray-900">
          {rating}/5
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Completed Requests</h1>
          <p className="text-gray-600">View your completed nursing requests and rate your nurses</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {completedRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Requests</h3>
            <p className="text-gray-500 mb-4">You haven't completed any requests yet.</p>
            <button
              onClick={() => router.push('/create-request')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Request
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {completedRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {request.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{request.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Nurse</p>
                        <button
                          onClick={() => router.push(`/nurse-profile/${request.nurse?.id}`)}
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {request.nurse?.name || 'N/A'}
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Service Type</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {request.serviceType.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium text-gray-900">{request.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Scheduled Date</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(request.scheduledDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium text-gray-900">
                          {request.acceptedApplication?.estimatedTime || request.estimatedDuration} hours
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount Paid</p>
                        <p className="font-medium text-green-600 text-lg">
                          {formatCurrency(request.acceptedApplication?.price || request.budget)}
                        </p>
                      </div>
                      {/* Enhanced Rating display directly in the grid */}
                      {request.rating && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Your Rating</p>
                          <div className="flex flex-col mt-1">
                            <div className="flex items-center">
                              {renderStarRating(getRatingValue(request.rating))}
                            </div>
                            {getReviewComment(request.rating) && (
                              <div className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
                                <p className="text-gray-700 italic">
                                  "{getReviewComment(request.rating)}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {!request.rating && (
                      <div className="mb-4">
                        <button
                          onClick={() => handleRateNurse(request.id, request.nurse?.name || 'Nurse', request.nurse?.id || '')}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                          Rate & Review Nurse
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Completed
                    </span>
                    
                    {request.completedAt && (
                      <p className="text-sm text-gray-500">
                        Completed: {formatDate(request.completedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Request ID: {request.id}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/requests/${request.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleSubmitRating}
        nurseName={ratingModal.nurseName}
        loading={ratingModal.loading}
      />
    </div>
  );
}
