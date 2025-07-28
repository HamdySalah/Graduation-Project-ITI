const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class ActiveRequestsWorkflowTester {
  constructor() {
    this.tokens = {};
    this.testData = {};
  }

  log(message, data = null) {
    console.log(`\n🔍 ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async login(email, password, role) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password
      });

      const token = response.data.data?.access_token || response.data.access_token || response.data.token;
      if (token) {
        this.tokens[role] = token;
        this.log(`✅ ${role} login successful`);
        return response.data;
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      this.log(`❌ ${role} login failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async createRequest(patientToken) {
    try {
      const requestData = {
        title: 'Test Active Request Workflow',
        description: 'Testing the complete workflow from application to completion',
        serviceType: 'elderly_care',
        urgencyLevel: 'medium',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        estimatedDuration: 2,
        budget: 100,
        address: '123 Test Street, Test City',
        coordinates: [31.233, 30.033], // Cairo coordinates
        contactPhone: '+201234567890',
        specialRequirements: 'Test requirements',
        notes: 'Test notes'
      };

      const response = await axios.post(`${BASE_URL}/api/requests`, requestData, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });

      const requestId = response.data.data?.id || response.data.id;
      this.testData.requestId = requestId;
      this.log('✅ Request created successfully', { requestId: this.testData.requestId });
      return response.data;
    } catch (error) {
      this.log('❌ Request creation failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async applyToRequest(nurseToken, requestId) {
    try {
      const applicationData = {
        requestId: requestId,
        price: 80,
        estimatedTime: 2
      };

      const response = await axios.post(`${BASE_URL}/api/applications`, applicationData, {
        headers: { Authorization: `Bearer ${nurseToken}` }
      });

      const applicationId = response.data.data?.id || response.data.id;
      this.testData.applicationId = applicationId;
      this.log('✅ Application created successfully', { applicationId: this.testData.applicationId });
      return response.data;
    } catch (error) {
      this.log('❌ Application creation failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async acceptApplication(patientToken, applicationId) {
    try {
      const response = await axios.put(`${BASE_URL}/api/applications/${applicationId}/status`, {
        status: 'accepted'
      }, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });

      this.log('✅ Application accepted successfully');
      return response.data;
    } catch (error) {
      this.log('❌ Application acceptance failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async getNurseApplications(nurseToken) {
    try {
      const response = await axios.get(`${BASE_URL}/api/applications/nurse`, {
        headers: { Authorization: `Bearer ${nurseToken}` }
      });

      const applications = response.data.data || response.data;
      const count = Array.isArray(applications) ? applications.length : 'unknown';
      this.log('✅ Nurse applications retrieved', { count });
      return response.data;
    } catch (error) {
      this.log('❌ Failed to get nurse applications:', error.response?.data || error.message);
      throw error;
    }
  }

  async markCompletedByNurse(nurseToken, requestId) {
    try {
      const response = await axios.put(`${BASE_URL}/api/requests/${requestId}/complete-nurse`, {}, {
        headers: { Authorization: `Bearer ${nurseToken}` }
      });

      this.log('✅ Request marked as completed by nurse');
      return response.data;
    } catch (error) {
      this.log('❌ Failed to mark request as completed by nurse:', error.response?.data || error.message);
      throw error;
    }
  }

  async markCompletedByPatient(patientToken, requestId) {
    try {
      const response = await axios.put(`${BASE_URL}/api/requests/${requestId}/complete-patient`, {}, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });

      this.log('✅ Request marked as completed by patient');
      return response.data;
    } catch (error) {
      this.log('❌ Failed to mark request as completed by patient:', error.response?.data || error.message);
      throw error;
    }
  }

  async getRequestDetails(token, requestId) {
    try {
      const response = await axios.get(`${BASE_URL}/api/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      this.log('✅ Request details retrieved', { 
        status: response.data.status,
        nurseCompleted: response.data.nurseCompleted,
        patientCompleted: response.data.patientCompleted
      });
      return response.data;
    } catch (error) {
      this.log('❌ Failed to get request details:', error.response?.data || error.message);
      throw error;
    }
  }

  async registerUser(userData, role) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
      const token = response.data.data?.access_token || response.data.access_token || response.data.token;
      if (token) {
        this.tokens[role] = token;
        this.log(`✅ ${role} registration successful`);
        return response.data;
      } else {
        throw new Error('No token received from registration');
      }
    } catch (error) {
      // If user already exists, try to login
      if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
        this.log(`ℹ️ ${role} already exists, trying to login...`);
        return await this.login(userData.email, userData.password, role);
      }
      this.log(`❌ ${role} registration failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async runCompleteWorkflow() {
    try {
      this.log('🚀 Starting Active Requests Workflow Test');

      // Test data
      const testPatient = {
        name: 'Test Patient',
        email: 'testpatient@example.com',
        password: 'password123',
        phone: '+201234567890',
        role: 'patient',
        coordinates: [31.233, 30.033],
        address: 'Test Address, Cairo, Egypt'
      };

      const testNurse = {
        name: 'Test Nurse',
        email: 'testnurse@example.com',
        password: 'password123',
        phone: '+201234567891',
        role: 'nurse',
        coordinates: [31.235, 30.035],
        address: 'Test Nurse Address, Cairo, Egypt',
        licenseNumber: 'TEST001',
        yearsOfExperience: 3,
        specializations: ['general', 'geriatric'],
        education: 'Bachelor of Nursing',
        certifications: ['CPR Certified']
      };

      // Step 1: Register/Login as patient and nurse
      await this.registerUser(testPatient, 'patient');
      await this.registerUser(testNurse, 'nurse');

      // Step 2: Patient creates a request
      await this.createRequest(this.tokens.patient);

      // Step 3: Nurse applies to the request
      await this.applyToRequest(this.tokens.nurse, this.testData.requestId);

      // Step 4: Patient accepts the application
      await this.acceptApplication(this.tokens.patient, this.testData.applicationId);

      // Step 5: Check request status after acceptance
      await this.getRequestDetails(this.tokens.patient, this.testData.requestId);

      // Step 6: Get nurse applications (should show accepted application)
      const nurseAppsResponse = await this.getNurseApplications(this.tokens.nurse);
      const nurseApps = nurseAppsResponse.data || nurseAppsResponse;
      const acceptedApp = Array.isArray(nurseApps) ? nurseApps.find(app => app.status === 'accepted') : null;
      
      if (acceptedApp) {
        this.log('✅ Found accepted application for nurse', {
          applicationId: acceptedApp.id,
          requestStatus: acceptedApp.request?.status
        });
      } else {
        this.log('❌ No accepted application found for nurse');
      }

      // Step 7: Nurse marks request as completed
      await this.markCompletedByNurse(this.tokens.nurse, this.testData.requestId);

      // Step 8: Check request status after nurse completion
      await this.getRequestDetails(this.tokens.patient, this.testData.requestId);

      // Step 9: Patient marks request as completed
      await this.markCompletedByPatient(this.tokens.patient, this.testData.requestId);

      // Step 10: Check final request status
      await this.getRequestDetails(this.tokens.patient, this.testData.requestId);

      this.log('🎉 Complete workflow test finished successfully!');

    } catch (error) {
      this.log('💥 Workflow test failed:', error.message);
      throw error;
    }
  }
}

// Run the test
const tester = new ActiveRequestsWorkflowTester();
tester.runCompleteWorkflow()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n❌ Test failed:', error.message);
    process.exit(1);
  });
