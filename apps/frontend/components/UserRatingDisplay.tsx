import React, { useState, useEffect } from 'react';
import { reviewApiService, Review, ReviewStats } from '../lib/reviewApi';
import { StarRating, ReviewDisplay } from './RatingComponent';
import { errorHandler } from '../lib/errorHandler';
import { CustomError } from '../lib/errors';

interface UserRatingDisplayProps {
  userId: string;
  userName: string;
  userRole: 'patient' | 'nurse';
  showReviews?: boolean;
  showStats?: boolean;
  className?: string;
}

interface RatingStatsProps {
  stats: ReviewStats;
  className?: string;
}

const RatingStats: React.FC<RatingStatsProps> = ({ stats, className = '' }) => {
  const { averageRating, totalReviews, ratingDistribution } = stats;

  const getPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rating Overview</h3>
          <p className="text-sm text-gray-600">Based on {totalReviews} reviews</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2">
            <StarRating rating={Math.round(averageRating)} readonly size="lg" />
            <span className="text-2xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-gray-600">out of 5</p>
        </div>
      </div>

      {totalReviews > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating] || 0;
            const percentage = getPercentage(count);
            
            return (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-12">
                  <span className="text-sm text-gray-600">{rating}</span>
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const UserRatingDisplay: React.FC<UserRatingDisplayProps> = ({
  userId,
  userName,
  userRole,
  showReviews = true,
  showStats = true,
  className = ''
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CustomError | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reviewsPerPage = 5;

  useEffect(() => {
    loadUserRatings();
  }, [userId, currentPage]);

  const loadUserRatings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load reviews
      if (showReviews) {
        const reviewsResponse = await reviewApiService.getReviews({
          revieweeId: userId,
          page: currentPage,
          limit: reviewsPerPage
        });
        setReviews(reviewsResponse.reviews);
        setTotalPages(reviewsResponse.pagination.pages);
      }

      // Load stats
      if (showStats) {
        const statsResponse = await reviewApiService.getUserStats(userId);
        setStats(statsResponse);
      }
    } catch (err: any) {
      console.error('Failed to load user ratings:', err);
      const customError = errorHandler.handleError(err);
      setError(customError);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {userName}'s Ratings & Reviews
        </h2>
        <p className="text-gray-600">
          See what others are saying about {userName}'s {userRole === 'nurse' ? 'nursing services' : 'experience as a patient'}.
        </p>
      </div>

      {/* Rating Stats */}
      {showStats && stats && (
        <RatingStats stats={stats} />
      )}

      {/* Reviews List */}
      {showReviews && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Reviews
          </h3>
          
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewDisplay 
                  key={review.id} 
                  review={review} 
                  showRequestInfo={true}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === currentPage
                          ? 'text-white bg-blue-600 border border-blue-600'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600">
                {userName} hasn't received any reviews yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalReviews}
              </div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((stats.ratingDistribution[5] || 0) / stats.totalReviews * 100)}%
              </div>
              <div className="text-sm text-gray-600">5-Star Reviews</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRatingDisplay;
export { RatingStats };
