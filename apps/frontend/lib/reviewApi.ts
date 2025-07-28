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
    const response = await apiService.get(url);
    return response.data;
  }

  async getReviewsByRequest(requestId: string): Promise<Review[]> {
    const response = await apiService.get(`${this.baseUrl}/request/${requestId}`);
    return response.data;
  }

  async getReviewStats(userId: string, reviewType?: 'user_to_user' | 'service_review'): Promise<ReviewStats> {
    const params = reviewType ? `?reviewType=${reviewType}` : '';
    const response = await apiService.get(`${this.baseUrl}/stats/${userId}${params}`);
    return response.data;
  }

  async canUserReview(
    requestId: string, 
    reviewType: 'user_to_user' | 'service_review', 
    revieweeId?: string
  ): Promise<CanReviewResponse> {
    const params = new URLSearchParams();
    params.append('reviewType', reviewType);
    if (revieweeId) params.append('revieweeId', revieweeId);

    const response = await apiService.get(`${this.baseUrl}/can-review/${requestId}?${params.toString()}`);
    return response.data;
  }

  async updateReview(reviewId: string, data: UpdateReviewRequest): Promise<Review> {
    const response = await apiService.put(`${this.baseUrl}/${reviewId}`, data);
    return response.data;
  }

  async deleteReview(reviewId: string): Promise<{ message: string }> {
    const response = await apiService.delete(`${this.baseUrl}/${reviewId}`);
    return response.data;
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
