import React, { useState, useEffect } from 'react';
import { reviewApiService, Review, CreateReviewRequest, CanReviewResponse } from '../lib/reviewApi';
import { useAuth } from '../lib/auth';

interface ReviewSystemProps {
  requestId: string;
  requestTitle: string;
  otherPartyId: string;
  otherPartyName: string;
  otherPartyRole: 'patient' | 'nurse';
  onReviewSubmitted?: () => void;
}

interface ReviewFormData {
  rating: number;
  feedback: string;
}

const StarRating: React.FC<{
  rating: number;
  onRatingChange: (rating: number) => void;
  readonly?: boolean;
}> = ({ rating, onRatingChange, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`text-2xl transition-colors ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${
            star <= (hoverRating || rating)
              ? 'text-yellow-400'
              : 'text-gray-300'
          }`}
          onClick={() => !readonly && onRatingChange(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ReviewForm: React.FC<{
  title: string;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  loading: boolean;
}> = ({ title, onSubmit, loading }) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    feedback: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) {
      alert('Please select a rating');
      return;
    }
    await onSubmit(formData);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <StarRating
            rating={formData.rating}
            onRatingChange={(rating) => setFormData({ ...formData, rating })}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback (Optional)
          </label>
          <textarea
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Share your experience..."
            maxLength={1000}
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.feedback.length}/1000 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || formData.rating === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

const ReviewDisplay: React.FC<{ review: Review }> = ({ review }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">
          {review.reviewType === 'user_to_user' 
            ? `Review for ${review.reviewee?.name || 'User'}`
            : 'Service Review'
          }
        </h4>
        <span className="text-sm text-gray-500">
          {new Date(review.submittedAt).toLocaleDateString()}
        </span>
      </div>
      
      <div className="mb-2">
        <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
      </div>
      
      {review.feedback && (
        <p className="text-gray-700 text-sm">{review.feedback}</p>
      )}
    </div>
  );
};

export const ReviewSystem: React.FC<ReviewSystemProps> = ({
  requestId,
  requestTitle,
  otherPartyId,
  otherPartyName,
  otherPartyRole,
  onReviewSubmitted
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReviewUser, setCanReviewUser] = useState<CanReviewResponse>({ canReview: false });
  const [canReviewService, setCanReviewService] = useState<CanReviewResponse>({ canReview: false });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
    checkReviewEligibility();
  }, [requestId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const reviewsData = await reviewApiService.getReviewsByRequest(requestId);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    try {
      const [userReviewCheck, serviceReviewCheck] = await Promise.all([
        reviewApiService.canReviewUser(requestId, otherPartyId),
        reviewApiService.canReviewService(requestId)
      ]);
      
      setCanReviewUser(userReviewCheck);
      setCanReviewService(serviceReviewCheck);
    } catch (error) {
      console.error('Failed to check review eligibility:', error);
    }
  };

  const handleUserReviewSubmit = async (data: ReviewFormData) => {
    try {
      setSubmitting(true);
      const reviewData: CreateReviewRequest = {
        requestId,
        revieweeId: otherPartyId,
        reviewType: 'user_to_user',
        rating: data.rating,
        feedback: data.feedback || undefined
      };
      
      await reviewApiService.createReview(reviewData);
      await loadReviews();
      await checkReviewEligibility();
      onReviewSubmitted?.();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleServiceReviewSubmit = async (data: ReviewFormData) => {
    try {
      setSubmitting(true);
      const reviewData: CreateReviewRequest = {
        requestId,
        reviewType: 'service_review',
        rating: data.rating,
        feedback: data.feedback || undefined
      };
      
      await reviewApiService.createReview(reviewData);
      await loadReviews();
      await checkReviewEligibility();
      onReviewSubmitted?.();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Reviews for: {requestTitle}
        </h2>
        <p className="text-gray-600">
          Share your experience and help improve our service quality.
        </p>
      </div>

      {/* Review Forms */}
      {canReviewUser.canReview && (
        <ReviewForm
          title={`Review ${otherPartyName} (${otherPartyRole})`}
          onSubmit={handleUserReviewSubmit}
          loading={submitting}
        />
      )}

      {canReviewService.canReview && (
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
            Submitted Reviews ({reviews.length})
          </h3>
          {reviews.map((review) => (
            <ReviewDisplay key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* No reviews message */}
      {reviews.length === 0 && !canReviewUser.canReview && !canReviewService.canReview && (
        <div className="text-center py-8 text-gray-500">
          <p>No reviews available for this request.</p>
          {!canReviewUser.canReview && canReviewUser.reason && (
            <p className="text-sm mt-2">User review: {canReviewUser.reason}</p>
          )}
          {!canReviewService.canReview && canReviewService.reason && (
            <p className="text-sm mt-2">Service review: {canReviewService.reason}</p>
          )}
        </div>
      )}
    </div>
  );
};
