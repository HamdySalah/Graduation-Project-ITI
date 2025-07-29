import React, { useState, useEffect } from 'react';
import { reviewApiService, Review, CreateReviewRequest } from '../lib/reviewApi';
import { useAuth } from '../lib/auth';
import { errorHandler } from '../lib/errorHandler';
import { CustomError } from '../lib/errors';

interface RatingComponentProps {
  requestId: string;
  requestTitle: string;
  otherPartyId?: string;
  otherPartyName?: string;
  otherPartyRole?: 'patient' | 'nurse';
  onReviewSubmitted?: () => void;
  showServiceReview?: boolean;
  showUserReview?: boolean;
  className?: string;
}

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md' 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`${sizeClasses[size]} ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } transition-all duration-150`}
          >
            <svg
              className={`${sizeClasses[size]} ${
                filled ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

interface ReviewFormProps {
  title: string;
  onSubmit: (data: { rating: number; feedback: string }) => Promise<void>;
  loading: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ title, onSubmit, loading }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setError(null);
      await onSubmit({ rating, feedback });
      setRating(0);
      setFeedback('');
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setError(err.message || 'Failed to submit review');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <StarRating rating={rating} onRatingChange={setRating} size="lg" />
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
            Feedback (Optional)
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Share your experience..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {feedback.length}/1000 characters
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

interface ReviewDisplayProps {
  review: Review;
  showRequestInfo?: boolean;
}

const ReviewDisplay: React.FC<ReviewDisplayProps> = ({ review, showRequestInfo = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReviewTypeLabel = (type: string) => {
    return type === 'user_to_user' ? 'User Review' : 'Service Review';
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <StarRating rating={review.rating} readonly size="sm" />
            <span className="text-sm font-medium text-gray-900">
              {review.rating}/5
            </span>
            <span className="text-xs text-gray-500">
              • {getReviewTypeLabel(review.reviewType)}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            By {review.reviewer?.name || 'Anonymous'} ({review.reviewerRole})
          </p>
          {showRequestInfo && review.request && (
            <p className="text-xs text-gray-500">
              For: {review.request.title}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {formatDate(review.submittedAt)}
        </span>
      </div>
      
      {review.feedback && (
        <div className="mt-3">
          <p className="text-sm text-gray-700 italic">
            "{review.feedback}"
          </p>
        </div>
      )}
    </div>
  );
};

const RatingComponent: React.FC<RatingComponentProps> = ({
  requestId,
  requestTitle,
  otherPartyId,
  otherPartyName,
  otherPartyRole,
  onReviewSubmitted,
  showServiceReview = true,
  showUserReview = true,
  className = ''
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReviewUser, setCanReviewUser] = useState(false);
  const [canReviewService, setCanReviewService] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<CustomError | null>(null);

  useEffect(() => {
    loadReviews();
    checkReviewEligibility();
  }, [requestId]);

  const loadReviews = async () => {
    try {
      const response = await reviewApiService.getReviewsByRequest(requestId);
      setReviews(response.reviews);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      const customError = errorHandler.handleError(err);
      setError(customError);
    }
  };

  const checkReviewEligibility = async () => {
    try {
      setLoading(true);
      
      if (showUserReview && otherPartyId) {
        const userReviewCheck = await reviewApiService.canReviewUser(requestId, otherPartyId);
        setCanReviewUser(userReviewCheck.canReview);
      }
      
      if (showServiceReview) {
        const serviceReviewCheck = await reviewApiService.canReviewService(requestId);
        setCanReviewService(serviceReviewCheck.canReview);
      }
    } catch (err: any) {
      console.error('Failed to check review eligibility:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserReviewSubmit = async (data: { rating: number; feedback: string }) => {
    if (!otherPartyId) return;
    
    setSubmitting(true);
    try {
      const reviewData: CreateReviewRequest = {
        requestId,
        revieweeId: otherPartyId,
        reviewType: 'user_to_user',
        rating: data.rating,
        feedback: data.feedback
      };
      
      await reviewApiService.createReview(reviewData);
      await loadReviews();
      setCanReviewUser(false);
      onReviewSubmitted?.();
    } catch (err: any) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleServiceReviewSubmit = async (data: { rating: number; feedback: string }) => {
    setSubmitting(true);
    try {
      const reviewData: CreateReviewRequest = {
        requestId,
        reviewType: 'service_review',
        rating: data.rating,
        feedback: data.feedback
      };
      
      await reviewApiService.createReview(reviewData);
      await loadReviews();
      setCanReviewService(false);
      onReviewSubmitted?.();
    } catch (err: any) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Reviews for: {requestTitle}
        </h2>
        <p className="text-gray-600">
          Share your experience and help improve our service quality.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error.message}</p>
        </div>
      )}

      {/* Review Forms */}
      {canReviewUser && otherPartyName && otherPartyRole && (
        <ReviewForm
          title={`Review ${otherPartyName} (${otherPartyRole})`}
          onSubmit={handleUserReviewSubmit}
          loading={submitting}
        />
      )}

      {canReviewService && (
        <ReviewForm
          title="Review the Service"
          onSubmit={handleServiceReviewSubmit}
          loading={submitting}
        />
      )}

      {/* Existing Reviews */}
      {reviews.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reviews ({reviews.length})
          </h3>
          {reviews.map((review) => (
            <ReviewDisplay key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* No reviews message */}
      {reviews.length === 0 && !canReviewUser && !canReviewService && (
        <div className="text-center py-8 text-gray-500">
          <p>No reviews available for this request.</p>
        </div>
      )}
    </div>
  );
};

export default RatingComponent;
export { StarRating, ReviewDisplay };
