import { apiService } from './api';

export interface CreateReviewRequest {
  requestId: string;
  revieweeId?: string;
  reviewType: 'user_to_user' | 'service_review';
  rating: number;
  feedback?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  feedback?: string;
}

export interface Review {
  id: string;
  requestId: string;
  reviewerId: string;
  reviewerRole: 'patient' | 'nurse';
  revieweeId?: string;
  reviewType: 'user_to_user' | 'service_review';
  rating: number;
  feedback?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  reviewee?: {
    id: string;
    name: string;
    email: string;
  };
  request?: {
    id: string;
    title: string;
    serviceType: string;
    scheduledDate: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface GetReviewsQuery {
  requestId?: string;
  reviewerId?: string;
  revieweeId?: string;
  reviewType?: 'user_to_user' | 'service_review';
  page?: number;
  limit?: number;
}

export interface GetReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
}

class ReviewApiService {
  private baseUrl = '/api/reviews';

  async createReview(data: CreateReviewRequest): Promise<Review> {
    const response = await apiService.post(this.baseUrl, data);
    return response.data;
  }

  async getReviews(query: GetReviewsQuery = {}): Promise<GetReviewsResponse> {
    const params = new URLSearchParams();

    if (query.requestId) params.append('requestId', query.requestId);
    if (query.reviewerId) params.append('reviewerId', query.reviewerId);
    if (query.revieweeId) params.append('revieweeId', query.revieweeId);
    if (query.reviewType) params.append('reviewType', query.reviewType);
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());

    const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  }

  async getReviewsByRequest(requestId: string): Promise<Review[]> {
    try {
      const response = await fetch(`${this.baseUrl}/request/${requestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching reviews by request:', error);
      return [];
    }
  }

  async getReviewStats(userId: string, reviewType?: 'user_to_user' | 'service_review'): Promise<ReviewStats> {
    const params = reviewType ? `?reviewType=${reviewType}` : '';

    try {
      const response = await fetch(`${this.baseUrl}/stats/${userId}${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  }

  async canUserReview(
    requestId: string,
    reviewType: 'user_to_user' | 'service_review',
    revieweeId?: string
  ): Promise<CanReviewResponse> {
    const params = new URLSearchParams();
    params.append('reviewType', reviewType);
    if (revieweeId) params.append('revieweeId', revieweeId);

    try {
      const response = await fetch(`${this.baseUrl}/can-review/${requestId}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error checking if user can review:', error);
      return { canReview: false, reason: 'Error checking review eligibility' };
    }
  }

  async updateReview(reviewId: string, data: UpdateReviewRequest): Promise<Review> {
    try {
      const response = await fetch(`${this.baseUrl}/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  async deleteReview(reviewId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  // Helper methods for common use cases
  async getMyReviews(page = 1, limit = 10): Promise<GetReviewsResponse> {
    // This will be filtered by the backend based on the authenticated user
    return this.getReviews({ page, limit });
  }

  async getReviewsForUser(userId: string, page = 1, limit = 10): Promise<GetReviewsResponse> {
    return this.getReviews({ revieweeId: userId, page, limit });
  }

  async getReviewsForRequest(requestId: string): Promise<Review[]> {
    return this.getReviewsByRequest(requestId);
  }

  async getUserToUserReviews(userId: string, page = 1, limit = 10): Promise<GetReviewsResponse> {
    return this.getReviews({ revieweeId: userId, reviewType: 'user_to_user', page, limit });
  }

  async getServiceReviews(page = 1, limit = 10): Promise<GetReviewsResponse> {
    return this.getReviews({ reviewType: 'service_review', page, limit });
  }

  // Review eligibility checks
  async canReviewUser(requestId: string, revieweeId: string): Promise<CanReviewResponse> {
    return this.canUserReview(requestId, 'user_to_user', revieweeId);
  }

  async canReviewService(requestId: string): Promise<CanReviewResponse> {
    return this.canUserReview(requestId, 'service_review');
  }
}

export const reviewApiService = new ReviewApiService();
