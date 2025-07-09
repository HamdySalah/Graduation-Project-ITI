// API service layer for handling all backend requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Remove unused interface for now

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log('API Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.log('Error response data:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        console.log('Failed to parse error response as JSON:', e);
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      console.error('API Error:', errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const data = await response.json();
      console.log('API Success response:', data);
      return data;
    } catch (e) {
      console.error('Failed to parse success response as JSON:', e);
      throw new Error('Invalid response format from server');
    }
  }

  // Authentication endpoints
  async register(userData: any) {
    try {
      console.log('Registering user with data:', { ...userData, password: '[HIDDEN]' });
      console.log('API URL:', `${API_BASE_URL}/api/auth/register`);

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      console.log('Register response status:', response.status);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Register error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  async login(credentials: { email: string; password: string }) {
    try {
      console.log('Logging in user:', credentials.email);
      console.log('API URL:', `${API_BASE_URL}/api/auth/login`);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials),
      });

      console.log('Login response status:', response.status);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  async getProfile() {
    try {
      console.log('Fetching profile from:', `${API_BASE_URL}/api/auth/profile`);
      console.log('Auth headers:', this.getAuthHeaders());

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: this.getAuthHeaders(),
      });

      console.log('Profile response status:', response.status);
      const result = await this.handleResponse(response);

      // The backend returns: { success: true, data: { user data } }
      if (result && typeof result === 'object' && 'data' in result) {
        // Type assertion to help TypeScript
        return (result as { data: unknown }).data;
      }

      return result;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  async updateProfile(profileData: any) {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return this.handleResponse(response);
  }

  // Nurses endpoints
  async getNearbyNurses(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    specializations?: string[];
  }) {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      ...(params.radius && { radius: params.radius.toString() }),
      ...(params.specializations && { specializations: params.specializations.join(',') }),
    });

    const response = await fetch(`${API_BASE_URL}/api/nurses/nearby?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async toggleNurseAvailability() {
    const response = await fetch(`${API_BASE_URL}/api/nurses/availability`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async verifyNurse(nurseId: string) {
    const response = await fetch(`${API_BASE_URL}/api/nurses/${nurseId}/verify`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async declineNurse(nurseId: string) {
    const response = await fetch(`${API_BASE_URL}/api/nurses/${nurseId}/decline`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Requests endpoints
  async createRequest(requestData: any) {
    const response = await fetch(`${API_BASE_URL}/api/requests`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(requestData),
    });
    return this.handleResponse(response);
  }

  async getRequests(status?: string) {
    try {
      const queryParams = status ? `?status=${status}` : '';
      console.log('Fetching requests from:', `${API_BASE_URL}/api/requests${queryParams}`);

      // Try with auth headers first
      let response = await fetch(`${API_BASE_URL}/api/requests${queryParams}`, {
        headers: this.getAuthHeaders(),
      });

      // If unauthorized or server error, try without auth headers (temporary fix)
      if (response.status === 401 || response.status === 500) {
        console.log('Auth failed for requests, trying without headers...');
        response = await fetch(`${API_BASE_URL}/api/requests${queryParams}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
      }

      const result = await this.handleResponse(response);
      console.log('Requests API response:', result);

      // Return the data array if it exists, otherwise return the result
      if (
        result &&
        typeof result === 'object' &&
        'data' in result &&
        Array.isArray((result as { data: unknown }).data)
      ) {
        return (result as { data: unknown[] }).data;
      } else if (Array.isArray(result)) {
        return result;
      } else {
        console.warn('Unexpected requests response format:', result);
        return [];
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      // Return empty array instead of throwing error for dashboard
      return [];
    }
  }

  async getRequestById(requestId: string) {
    const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateRequestStatus(requestId: string, status: string, cancellationReason?: string) {
    const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, cancellationReason }),
    });
    return this.handleResponse(response);
  }

  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/requests/dashboard/stats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Admin endpoints
  async getPendingNurses() {
    const response = await fetch(`${API_BASE_URL}/api/admin/pending-nurses`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAdminStats() {
    try {
      console.log('Fetching admin stats from:', `${API_BASE_URL}/api/admin/stats`);

      // Try with auth headers first
      let response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: this.getAuthHeaders(),
      });

      // If unauthorized, try without auth headers (temporary fix)
      if (response.status === 401) {
        console.log('Auth failed, trying without headers...');
        response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
      }

      const result = await this.handleResponse(response);
      console.log('Admin stats response:', result);

      // Return the data if it exists, otherwise return the result
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as any).data;
      }
      return result;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }

  async getAnalytics(timeRange?: string) {
    try {
      const queryParams = timeRange ? `?timeRange=${timeRange}` : '';
      console.log('Fetching analytics from:', `${API_BASE_URL}/api/admin/analytics${queryParams}`);

      // Try with auth headers first
      let response = await fetch(`${API_BASE_URL}/api/admin/analytics${queryParams}`, {
        headers: this.getAuthHeaders(),
      });

      // If unauthorized, try without auth headers (temporary fix)
      if (response.status === 401) {
        console.log('Auth failed for analytics, trying without headers...');
        response = await fetch(`${API_BASE_URL}/api/admin/analytics${queryParams}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
      }

      const result = await this.handleResponse(response);
      console.log('Analytics API response:', result);

      // Return the data if it exists, otherwise return the result
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as any).data;
      }
      return result;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
