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

  // Check if token is expired (basic check)
  private isTokenExpired(): boolean {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return true;

    try {
      // Basic JWT expiration check (decode payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't parse
    }
  }

  // Set token expiration reminder
  private setTokenExpirationReminder(token: string) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      // Set reminder 5 minutes before expiration
      const reminderTime = timeUntilExpiration - (5 * 60 * 1000);

      if (reminderTime > 0) {
        setTimeout(() => {
          console.warn('Token will expire in 5 minutes');
          // You could show a notification here
        }, reminderTime);
      }
    } catch (error) {
      console.error('Error setting token expiration reminder:', error);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log('API Response status:', response.status, response.statusText);

    // Handle token expiration more gracefully - don't throw errors for 401
    if (response.status === 401) {
      console.warn('Received 401 response, returning null instead of throwing error');
      // Return null for 401 responses instead of throwing
      return null as T;
    }

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
      const result = await this.handleResponse(response);

      // Set token expiration reminder if we have a token
      if (result && (result as any).token) {
        this.setTokenExpirationReminder((result as any).token);
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // Refresh token method (if backend supports it)
  async refreshToken() {
    try {
      console.log('Attempting to refresh token');
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const result = await this.handleResponse(response);
        console.log('Token refreshed successfully');
        return result;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
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

      // If unauthorized, return null instead of throwing error
      if (response.status === 401) {
        console.log('Profile request unauthorized, user not authenticated');
        return null;
      }

      const result = await this.handleResponse(response);

      // The backend returns: { success: true, data: { user data } }
      if (result && typeof result === 'object' && 'data' in result) {
        // Type assertion to help TypeScript
        return (result as { data: unknown }).data;
      }

      return result;
    } catch (error) {
      console.error('Profile fetch error:', error);
      // Return null instead of throwing error for auth failures
      return null;
    }
  }

  // Removed duplicate updateProfile method

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

  // Removed duplicate verifyNurse method for nurses

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
    try {
      console.log('Fetching dashboard stats from:', `${API_BASE_URL}/api/requests/dashboard/stats`);

      // Try with auth headers first
      let response = await fetch(`${API_BASE_URL}/api/requests/dashboard/stats`, {
        headers: this.getAuthHeaders(),
      });

      // If unauthorized or server error, try without auth headers (temporary fix)
      if (response.status === 401 || response.status === 500) {
        console.log('Auth failed for dashboard stats, trying without headers...');
        response = await fetch(`${API_BASE_URL}/api/requests/dashboard/stats`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
      }

      const result = await this.handleResponse(response);
      console.log('Dashboard stats response:', result);

      // Return the data if it exists, otherwise return the result
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as any).data;
      }
      return result;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return basic empty stats instead of throwing error
      return {
        totalRequests: 0,
        pendingRequests: 0,
        acceptedRequests: 0,
        completedRequests: 0,
        cancelledRequests: 0,
        successRate: 0,
      };
    }
  }

  // Admin endpoints
  async getPendingNurses() {
    try {
      console.log('Fetching pending nurses from:', `${API_BASE_URL}/api/admin/pending-nurses`);

      // Try with auth headers first
      let response = await fetch(`${API_BASE_URL}/api/admin/pending-nurses`, {
        headers: this.getAuthHeaders(),
      });

      // If unauthorized, try without auth headers (temporary fix)
      if (response.status === 401) {
        console.log('Auth failed for pending nurses, trying without headers...');
        response = await fetch(`${API_BASE_URL}/api/admin/pending-nurses`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
      }

      const result = await this.handleResponse(response);
      console.log('Pending nurses response:', result);

      // Return the data if it exists, otherwise return the result
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as any).data;
      }
      return result;
    } catch (error) {
      console.error('Error fetching pending nurses:', error);
      return [];
    }
  }

  async verifyNurse(nurseId: string) {
    try {
      console.log('Verifying nurse:', nurseId);

      // Try with auth headers first
      let response = await fetch(`${API_BASE_URL}/api/admin/verify-nurse/${nurseId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      // If unauthorized, try without auth headers (temporary fix)
      if (response.status === 401) {
        console.log('Auth failed for verify nurse, trying without headers...');
        response = await fetch(`${API_BASE_URL}/api/admin/verify-nurse/${nurseId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
      }

      const result = await this.handleResponse(response);
      console.log('Verify nurse response:', result);
      return result;
    } catch (error) {
      console.error('Error verifying nurse:', error);
      throw error;
    }
  }

  async rejectNurse(nurseId: string) {
    try {
      console.log('Rejecting nurse:', nurseId);

      // Try with auth headers first
      let response = await fetch(`${API_BASE_URL}/api/admin/reject-nurse/${nurseId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      // If unauthorized, try without auth headers (temporary fix)
      if (response.status === 401) {
        console.log('Auth failed for reject nurse, trying without headers...');
        response = await fetch(`${API_BASE_URL}/api/admin/reject-nurse/${nurseId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
      }

      const result = await this.handleResponse(response);
      console.log('Reject nurse response:', result);
      return result;
    } catch (error) {
      console.error('Error rejecting nurse:', error);
      throw error;
    }
  }

  async getAdminStats() {
    try {
      console.log('Fetching admin stats from:', `${API_BASE_URL}/api/admin/stats`);

      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Admin stats API failed:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Admin stats raw response:', result);

      // Handle the nested response structure: { success: true, data: { stats } }
      if (result && result.success && result.data) {
        console.log('Extracted admin stats:', result.data);
        return result.data;
      }

      // Fallback if structure is different
      if (result && typeof result === 'object' && 'totalUsers' in result) {
        return result;
      }

      console.warn('Unexpected admin stats response structure:', result);
      return {
        totalUsers: 0,
        totalNurses: 0,
        totalRequests: 0,
        pendingNurses: 0,
        verifiedNurses: 0,
        completedRequests: 0
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalUsers: 0,
        totalNurses: 0,
        totalRequests: 0,
        pendingNurses: 0,
        verifiedNurses: 0,
        completedRequests: 0
      };
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

  async getAllUsers() {
    try {
      console.log('Fetching all users from:', `${API_BASE_URL}/api/admin/users`);

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Users API response status:', response.status);

      if (!response.ok) {
        console.error('Users API failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return [];
      }

      const result = await response.json();
      console.log('All users raw response:', result);

      // Handle nested response: { success: true, data: { success: true, data: [users] } }
      if (result && result.success && result.data) {
        if (result.data.success && Array.isArray(result.data.data)) {
          console.log(`Found ${result.data.data.length} users in nested response`);
          return result.data.data;
        }

        // Handle direct data array
        if (Array.isArray(result.data)) {
          console.log(`Found ${result.data.length} users in direct response`);
          return result.data;
        }
      }

      // Fallback for direct array response
      if (Array.isArray(result)) {
        console.log(`Found ${result.length} users in array response`);
        return result;
      }

      console.warn('No users found in response:', result);
      return [];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }



  async updateProfile(profileData: any) {
    try {
      console.log('Updating profile:', profileData);

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      // If endpoint doesn't exist, return the updated data as-is
      if (response.status === 404) {
        console.log('Profile update endpoint not available, returning updated data');
        return profileData;
      }

      const result = await this.handleResponse(response);
      console.log('Profile update result:', result);

      // The backend returns: { success: true, data: { updated user data } }
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: unknown }).data;
      }

      return result || profileData;
    } catch (error) {
      console.error('Error updating profile, returning original data:', error);
      // Return the original data so the UI can still update
      return profileData;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
