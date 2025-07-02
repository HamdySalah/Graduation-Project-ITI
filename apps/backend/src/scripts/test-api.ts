import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'http://localhost:3001';

class ApiTester {
  private api: AxiosInstance;
  private tokens: { [key: string]: string } = {};

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
    });
  }

  private log(message: string, data?: any) {
    console.log(`🔍 ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log('');
  }

  private logError(message: string, error: any) {
    console.error(`❌ ${message}`);
    console.error(error.response?.data || error.message);
    console.log('');
  }

  private setAuthHeader(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async testAuth() {
    console.log('🔐 Testing Authentication Endpoints...\n');

    try {
      // Test admin login
      const adminLogin = await this.api.post('/api/auth/login', {
        email: 'admin@nurseplatform.com',
        password: 'admin123',
      });
      this.tokens.admin = adminLogin.data.data.access_token;
      this.log('Admin login successful', adminLogin.data);

      // Test nurse login
      const nurseLogin = await this.api.post('/api/auth/login', {
        email: 'sara@example.com',
        password: 'nurse123',
      });
      this.tokens.nurse = nurseLogin.data.data.access_token;
      this.log('Nurse login successful', nurseLogin.data);

      // Test patient login
      const patientLogin = await this.api.post('/api/auth/login', {
        email: 'ahmed@example.com',
        password: 'patient123',
      });
      this.tokens.patient = patientLogin.data.data.access_token;
      this.log('Patient login successful', patientLogin.data);

      // Test profile retrieval
      this.setAuthHeader(this.tokens.admin);
      const profile = await this.api.get('/api/auth/profile');
      this.log('Profile retrieval successful', profile.data);

    } catch (error) {
      this.logError('Authentication test failed', error);
    }
  }

  async testNurses() {
    console.log('👩‍⚕️ Testing Nurses Endpoints...\n');

    try {
      // Test nearby nurses search
      const nearbyNurses = await this.api.get('/api/nurses/nearby', {
        params: {
          latitude: 30.033,
          longitude: 31.233,
          radius: 10,
        },
      });
      this.log('Nearby nurses search successful', nearbyNurses.data);

      // Test nurse verification (admin only)
      this.setAuthHeader(this.tokens.admin);
      const pendingNurses = await this.api.get('/api/admin/pending-nurses');
      this.log('Pending nurses retrieval successful', pendingNurses.data);

      if (pendingNurses.data.data && pendingNurses.data.data.length > 0) {
        const nurseId = pendingNurses.data.data[0].id;
        const verification = await this.api.patch(`/api/nurses/${nurseId}/verify`);
        this.log('Nurse verification successful', verification.data);
      }

      // Test availability toggle (nurse only)
      this.setAuthHeader(this.tokens.nurse);
      const availability = await this.api.patch('/api/nurses/availability');
      this.log('Availability toggle successful', availability.data);

    } catch (error) {
      this.logError('Nurses test failed', error);
    }
  }

  async testRequests() {
    console.log('📝 Testing Requests Endpoints...\n');

    try {
      // Test request creation (patient only)
      this.setAuthHeader(this.tokens.patient);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const newRequest = await this.api.post('/api/requests', {
        title: 'Test nursing request',
        description: 'This is a test request created by the API tester',
        serviceType: 'home_care',
        coordinates: [31.233, 30.033],
        address: 'Test Address, Cairo, Egypt',
        scheduledDate: tomorrow.toISOString(),
        estimatedDuration: 2,
        urgencyLevel: 'medium',
        budget: 100,
        contactPhone: '+201234567890',
        notes: 'Test request notes',
      });
      this.log('Request creation successful', newRequest.data);

      // Test requests retrieval
      const requests = await this.api.get('/api/requests');
      this.log('Requests retrieval successful', requests.data);

      // Test dashboard stats
      const stats = await this.api.get('/api/requests/dashboard/stats');
      this.log('Dashboard stats retrieval successful', stats.data);

      // Test request status update (nurse)
      if (requests.data.data && requests.data.data.length > 0) {
        const requestId = requests.data.data[0].id;
        
        this.setAuthHeader(this.tokens.nurse);
        const statusUpdate = await this.api.patch(`/api/requests/${requestId}/status`, {
          status: 'accepted',
        });
        this.log('Request status update successful', statusUpdate.data);
      }

    } catch (error) {
      this.logError('Requests test failed', error);
    }
  }

  async testAdmin() {
    console.log('👑 Testing Admin Endpoints...\n');

    try {
      this.setAuthHeader(this.tokens.admin);

      // Test admin stats
      const adminStats = await this.api.get('/api/admin/stats');
      this.log('Admin stats retrieval successful', adminStats.data);

      // Test pending nurses
      const pendingNurses = await this.api.get('/api/admin/pending-nurses');
      this.log('Pending nurses retrieval successful', pendingNurses.data);

    } catch (error) {
      this.logError('Admin test failed', error);
    }
  }

  async testErrorHandling() {
    console.log('⚠️ Testing Error Handling...\n');

    try {
      // Test invalid login
      try {
        await this.api.post('/api/auth/login', {
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });
      } catch (error) {
        this.log('Invalid login properly rejected', error.response?.data);
      }

      // Test unauthorized access
      try {
        this.api.defaults.headers.common['Authorization'] = 'Bearer invalid-token';
        await this.api.get('/api/auth/profile');
      } catch (error) {
        this.log('Unauthorized access properly rejected', error.response?.data);
      }

      // Test invalid request data
      try {
        this.setAuthHeader(this.tokens.patient);
        await this.api.post('/api/requests', {
          title: 'A', // Too short
          description: 'B', // Too short
          serviceType: 'invalid_service',
          coordinates: [200, 100], // Invalid coordinates
        });
      } catch (error) {
        this.log('Invalid request data properly rejected', error.response?.data);
      }

    } catch (error) {
      this.logError('Error handling test failed', error);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting API Tests...\n');
    console.log('=' .repeat(50));

    await this.testAuth();
    await this.testNurses();
    await this.testRequests();
    await this.testAdmin();
    await this.testErrorHandling();

    console.log('=' .repeat(50));
    console.log('✅ All API tests completed!');
    console.log('📚 Check Swagger documentation at: http://localhost:3001/api/docs');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new ApiTester();
  tester.runAllTests().catch(console.error);
}

export default ApiTester;
