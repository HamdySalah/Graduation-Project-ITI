
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiService } from '../../lib/api';

interface NurseProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  nurseProfile?: {
    specialization: string;
    experience: number;
    education: string;
    certifications: string[];
    bio: string;
    hourlyRate: number;
    availability: string[];
    languages: string[];
    location: {
      address: string;
      city: string;
      state: string;
    };
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  wouldRecommend: boolean;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    profileImage?: string;
  };
  request: {
    id: string;
    title: string;
    serviceType: string;
    scheduledDate: string;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  recommendationRate: number;
}

interface NurseStats {
  completedRequests: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
}

interface CompletedRequest {
  id: string;
  title: string;
  serviceType: string;
  scheduledDate: string;
  completedAt: string;
  price: number;
  estimatedTime: number;
  patient: {
    id: string;
    name: string;
  };
}

export default function NurseProfilePage() {
  const [nurse, setNurse] = useState<NurseProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [completedRequests, setCompletedRequests] = useState<CompletedRequest[]>([]);
  const [nurseStats, setNurseStats] = useState<NurseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'history'>('overview');
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      loadNurseProfile();
    }
  }, [id]);

  const loadNurseProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load nurse profile
      const nurseData = await apiService.getNurseProfile(id as string);
      setNurse(nurseData);

      // Load reviews and stats
      const [reviewsData, statsData, nurseStatsData] = await Promise.all([
        apiService.getNurseReviews(id as string, 1, 10),
        apiService.getNurseReviewStats(id as string),
        apiService.getNurseStats(id as string)
      ]);

      console.log('Nurse reviews data in profile page:', reviewsData);
      
      // Handle different response formats
      const reviewsArray = reviewsData?.data || reviewsData?.reviews || [];
      setReviews(Array.isArray(reviewsArray) ? reviewsArray : []);
      setReviewStats(statsData);
      setNurseStats(nurseStatsData);

      // Load completed requests (transaction history)
      try {
        const requestsData = await apiService.getNurseCompletedRequests(id as string);
        setCompletedRequests(requestsData.data || requestsData || []);
      } catch (err) {
        console.log('Could not load completed requests:', err);
        setCompletedRequests([]);
      }

    } catch (err) {
      console.error('Error loading nurse profile:', err);
      setError('Failed to load nurse profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
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

  if (error || !nurse) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Nurse not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              {nurse.profileImage ? (
                <img
                  src={apiService.getImageUrl(nurse.profileImage)}
                  alt={nurse.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{nurse.name}</h1>
              <p className="text-lg text-gray-600 mb-2">
                {nurse.nurseProfile?.specialization || 'Registered Nurse'}
              </p>
              
              {reviewStats && (
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    {renderStars(Math.round(reviewStats.averageRating))}
                    <span className="ml-2 text-gray-600">
                      {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews} reviews)
                    </span>
                  </div>
                  <div className="text-green-600 font-medium">
                    {Math.round(reviewStats.recommendationRate * 100)}% recommend
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Experience:</span> {nurse.nurseProfile?.experience || 'N/A'} years
                </div>
                <div>
                  <span className="font-medium">Rate:</span> {formatCurrency(nurse.nurseProfile?.hourlyRate || 0)}/hour
                </div>
                <div>
                  <span className="font-medium">Location:</span> {nurse.nurseProfile?.location?.city || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'reviews', label: `Reviews (${reviewStats?.totalReviews || 0})` },
                { key: 'history', label: 'Transaction History' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Statistics Cards */}
                {nurseStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">Completed Requests</p>
                          <p className="text-2xl font-bold text-blue-900">{nurseStats.completedRequests}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600">Total Earnings</p>
                          <p className="text-2xl font-bold text-green-900">{nurseStats.totalEarnings} EGP</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-yellow-600">Average Rating</p>
                          <p className="text-2xl font-bold text-yellow-900">{nurseStats.averageRating}/5</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-600">Total Reviews</p>
                          <p className="text-2xl font-bold text-purple-900">{nurseStats.totalReviews}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {nurse.nurseProfile?.bio && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                    <p className="text-gray-700">{nurse.nurseProfile.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Education & Certifications</h3>
                    <div className="space-y-2">
                      {nurse.nurseProfile?.education && (
                        <p className="text-gray-700">
                          <span className="font-medium">Education:</span> {nurse.nurseProfile.education}
                        </p>
                      )}
                      {nurse.nurseProfile?.certifications && nurse.nurseProfile.certifications.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Certifications:</span>
                          <ul className="list-disc list-inside mt-1 text-gray-600">
                            {nurse.nurseProfile.certifications.map((cert, index) => (
                              <li key={index}>{cert}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-2 text-gray-700">
                      <p><span className="font-medium">Email:</span> {nurse.email}</p>
                      <p><span className="font-medium">Phone:</span> {nurse.phone}</p>
                      {nurse.nurseProfile?.location && (
                        <p>
                          <span className="font-medium">Address:</span> {nurse.nurseProfile.location.address}, {nurse.nurseProfile.location.city}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {nurse.nurseProfile?.languages && nurse.nurseProfile.languages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {nurse.nurseProfile.languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {reviewStats && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Rating Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{reviewStats.averageRating.toFixed(1)}</div>
                        <div className="text-gray-600">Average Rating</div>
                        {renderStars(Math.round(reviewStats.averageRating))}
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{reviewStats.totalReviews}</div>
                        <div className="text-gray-600">Total Reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {Math.round(reviewStats.recommendationRate * 100)}%
                        </div>
                        <div className="text-gray-600">Recommend</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No reviews yet.</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              {review.patient.profileImage ? (
                                <img
                                  src={apiService.getImageUrl(review.patient.profileImage)}
                                  alt={review.patient.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-medium">
                                  {review.patient.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{review.patient.name}</p>
                              <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                            </div>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                        
                        <div className="text-sm text-gray-500">
                          Service: {review.request.title} • {formatDate(review.request.scheduledDate)}
                          {review.wouldRecommend && (
                            <span className="ml-2 text-green-600">• Recommends this nurse</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Transaction History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {completedRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No completed requests found.</p>
                ) : (
                  completedRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{request.title}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Patient:</span> {request.patient.name}
                            </div>
                            <div>
                              <span className="font-medium">Service Type:</span> {request.serviceType.replace('_', ' ')}
                            </div>
                            <div>
                              <span className="font-medium">Scheduled:</span> {formatDate(request.scheduledDate)}
                            </div>
                            <div>
                              <span className="font-medium">Completed:</span> {formatDate(request.completedAt)}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {request.estimatedTime} hours
                            </div>
                            <div>
                              <span className="font-medium">Earned:</span> 
                              <span className="text-green-600 font-semibold ml-1">
                                {formatCurrency(request.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


