import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiService } from '../lib/api';

interface CompletedRequest {
  id: string;
  request: {
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
    patient?: {
      id: string;
      name: string;
      phone: string;
    };
  };
  price: number;
  estimatedTime: number;
  message?: string;
  status: string;
  createdAt: string;
  acceptedAt?: string;
}

interface NurseStats {
  completedRequests: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
}

export default function CompletedRequests() {
  const [completedRequests, setCompletedRequests] = useState<CompletedRequest[]>([]);
  const [nurseStats, setNurseStats] = useState<NurseStats | null>(null);
  const [reviews, setReviews] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshingReviews, setRefreshingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadCompletedRequests();
    loadNurseStats();
  }, []);
  
  // Set up auto-refresh interval for reviews
  useEffect(() => {
    if (completedRequests.length === 0) return;
    
    console.log('Setting up auto-refresh for reviews...');
    const refreshInterval = setInterval(() => {
      console.log('Auto-refresh: checking for new reviews...');
      loadAllReviews(completedRequests);
    }, 30000); // Check every 30 seconds
    
    return () => {
      console.log('Clearing review refresh interval');
      clearInterval(refreshInterval);
    };
  }, [completedRequests]);
  
  // Secondary effect to load reviews whenever completedRequests changes
  useEffect(() => {
    if (completedRequests.length > 0) {
      console.log('CompletedRequests changed, reloading reviews...');
      loadAllReviews(completedRequests);
    }
  }, [completedRequests]);
  
  // Enhanced function to load real reviews from API with thorough request ID checking
  const loadAllReviews = async (completedRequests: CompletedRequest[]) => {
    try {
      setRefreshingReviews(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        console.error('User ID missing, cannot load reviews');
        setRefreshingReviews(false);
        return;
      }
      
      console.log('Attempting to load reviews for nurse:', user.id);
      
      // Get all reviews in one call with a higher limit
      const reviewsData = await apiService.getNurseReviews(user.id, 1, 1000);
      console.log('Nurse reviews response:', reviewsData);
      
      // Ensure we have an array to work with
      const reviewsArray = reviewsData?.data || [];
      const reviewsList = Array.isArray(reviewsArray) ? reviewsArray : [];
      console.log('Reviews list from API:', reviewsList, 'Total reviews:', reviewsList.length);
      
      // Dump full review data for debugging
      reviewsList.forEach((review: any, index: number) => {
        console.log(`Review ${index + 1} full data:`, JSON.stringify(review));
      });
      
      // Create map of requestId -> review
      const reviewsMap: Record<string, any> = {};
      
      // Log completed request IDs for debugging
      const requestIds = completedRequests.map(req => req.request.id);
      console.log('Looking for reviews for these request IDs:', requestIds);
      
      // Map reviews by request ID with detailed logging and extensive property checking
      reviewsList.forEach((review: any) => {
        console.log('Processing review:', review);
        
        // Check all possible paths to request ID in the review object
        if (review.request?.id) {
          console.log(`Found review for request ID via review.request.id: ${review.request.id}`);
          reviewsMap[review.request.id] = review;
        } else if (review.requestId) {
          console.log(`Found review via requestId property: ${review.requestId}`);
          reviewsMap[review.requestId] = review;
        } else if (review.request_id) {
          console.log(`Found review via request_id property: ${review.request_id}`);
          reviewsMap[review.request_id] = review;
        } else if (review.data?.request?.id) {
          console.log(`Found review via data.request.id: ${review.data.request.id}`);
          reviewsMap[review.data.request.id] = review;
        } else {
          // Try to find request ID in any property
          const reviewStr = JSON.stringify(review);
          console.log('No direct request ID found, searching in full object');
          
          // Search in completed requests to find matching request by any property
          for (const req of completedRequests) {
            const reqId = req.request.id;
            if (reviewStr.includes(reqId)) {
              console.log(`Found potential match for request ID ${reqId} in review data`);
              reviewsMap[reqId] = review;
              break;
            }
          }
        }
      });
      
      console.log('Final reviews map:', reviewsMap, 'Total mapped reviews:', Object.keys(reviewsMap).length);
      
      // If we still have no reviews mapped, try manual mapping
      if (Object.keys(reviewsMap).length === 0 && reviewsList.length > 0) {
        console.log('No reviews were properly mapped - trying alternate mapping approach');
        
        // Try to map reviews by index as a fallback (not ideal but helps debugging)
        completedRequests.forEach((request, index) => {
          if (index < reviewsList.length) {
            const reviewItem = reviewsList[index];
            console.log(`Manual mapping: Assigning review ${index} to request ${request.request.id}`);
            reviewsMap[request.request.id] = reviewItem;
          }
        });
      }
      
      setReviews(reviewsMap);
      
      // Check if we found reviews for all completed requests
      const missingReviews = requestIds.filter(id => !reviewsMap[id]);
      if (missingReviews.length > 0) {
        console.log('Missing reviews for these requests:', missingReviews);
      }
    } catch (error) {
      console.error('Error loading all reviews:', error);
    } finally {
      setRefreshingReviews(false);
    }
  };

  const loadNurseStats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        // Get stats from API
        const statsData = await apiService.getNurseStats(user.id);
        console.log('Nurse stats data:', statsData);
        
        // If API doesn't return proper stats, calculate from completed requests
        if (!statsData?.data || !statsData?.data?.completedRequests) {
          // Fall back to calculating from the requests
          const response = await apiService.getApplicationsByNurse();
          const applications = response?.data || (response as any[]) || [];
          const applicationsArray = Array.isArray(applications) ? applications : [];
          
          const completedApps = applicationsArray.filter(app => 
            app.status === 'accepted' && 
            app.request && 
            app.request.status === 'completed'
          );
          
          // Calculate total earnings
          const totalEarnings = completedApps.reduce((sum, app) => sum + (app.price || 0), 0);
          
          // Set stats manually
          setNurseStats({
            completedRequests: completedApps.length,
            totalEarnings: totalEarnings,
            averageRating: statsData?.data?.averageRating || 0,
            totalReviews: statsData?.data?.totalReviews || 0
          });
        } else {
          // Use API stats if available
          setNurseStats(statsData.data);
        }
      }
    } catch (error) {
      console.error('Error loading nurse stats:', error);
      
      // Set default stats on error
      setNurseStats({
        completedRequests: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalReviews: 0
      });
    }
  };

  const loadCompletedRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all nurse applications
      const response = await apiService.getApplicationsByNurse();
      console.log('Raw API response:', response);
      
      // Handle different response formats
      const applications = response?.data || (response as any[]) || [];
      console.log('Extracted applications:', applications);
      
      // Ensure applications is an array
      const applicationsArray = Array.isArray(applications) ? applications : [];
      console.log('Applications array:', applicationsArray);
      
      // Filter only accepted applications where request status is 'completed'
      const completedApps = applicationsArray.filter(app => 
        app.status === 'accepted' && 
        app.request && 
        app.request.status === 'completed'
      );
      
      setCompletedRequests(completedApps);
      
      // Load all reviews for these requests
      if (completedApps.length > 0) {
        console.log('Completed applications:', completedApps);
        // Pass the completed applications directly
        await loadAllReviews(completedApps);
      }
    } catch (err) {
      console.error('Error loading completed requests:', err);
      setError('Failed to load completed requests. Please try again.');
    } finally {
      setLoading(false);
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

  // We've replaced the individual review loading with loadAllReviews function

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Completed Requests</h1>
            <p className="text-gray-600">View all your completed nursing requests</p>
          </div>
          <button 
            onClick={() => loadAllReviews(completedRequests)}
            disabled={refreshingReviews}
            className={`flex items-center ${refreshingReviews ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'} px-4 py-2 rounded-lg border ${refreshingReviews ? 'border-gray-200' : 'border-blue-200'}`}
          >
            {refreshingReviews ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Ratings
              </>
            )}
          </button>
        </div>

        {/* Statistics Cards */}
        {nurseStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Completed Requests</p>
                  <p className="text-3xl font-bold text-blue-600">{nurseStats.completedRequests}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-3xl font-bold text-green-600">{nurseStats.totalEarnings.toFixed(1)} EGP</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
              onClick={() => router.push('/requests')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Available Requests
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {completedRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {request.request.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{request.request.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Patient</p>
                        <p className="font-medium text-gray-900">
                          {request.request.patient?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Service Type</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {request.request?.serviceType?.replace('_', ' ') || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium text-gray-900">{request.request.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Scheduled Date</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(request.request.scheduledDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium text-gray-900">
                          {request.estimatedTime} hours
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Earned Amount</p>
                        <p className="font-medium text-green-600 text-lg">
                          {formatCurrency(request.price)}
                        </p>
                      </div>
                      {/* Improved Rating display directly in the grid */}
                      <div className="col-span-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">Patient Rating</p>
                          <button 
                            onClick={() => loadAllReviews(completedRequests)}
                            disabled={refreshingReviews}
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                          >
                            {refreshingReviews ? (
                              <>
                                <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full mr-1"></div>
                                <span>Checking...</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Refresh Ratings</span>
                              </>
                            )}
                          </button>
                        </div>
                        {reviews[request.request.id] ? (
                          <div className="flex flex-col mt-1">
                            <div className="flex items-center">
                              {renderStarRating(getRatingValue(reviews[request.request.id]))}
                            </div>
                            {getReviewComment(reviews[request.request.id]) ? (
                              <div className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
                                <p className="text-gray-700 italic">
                                  "{getReviewComment(reviews[request.request.id])}"
                                </p>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <p className="text-gray-500">No rating available for this request.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {request.message && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Your Message</p>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{request.message}</p>
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
                    
                    {request.request.completedAt && (
                      <p className="text-sm text-gray-500">
                        Completed: {formatDate(request.request.completedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Applied: {formatDate(request.createdAt)}
                      {request.acceptedAt && (
                        <span className="ml-4">
                          Accepted: {formatDate(request.acceptedAt)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/requests/${request.request.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* No duplicate review section here */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
