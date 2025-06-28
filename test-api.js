const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

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
  specializations: ['general', 'elderly_care'],
  education: 'Bachelor of Nursing',
  certifications: ['CPR Certified'],
  hourlyRate: 45,
  bio: 'Test nurse for API testing',
  languages: ['Arabic', 'English']
};

const testRequest = {
  title: 'Test Service Request',
  description: 'Need assistance with elderly care for testing',
  serviceType: 'elderly_care',
  coordinates: [31.240, 30.040],
  address: 'Test Request Address, Cairo, Egypt',
  scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  estimatedDuration: 4,
  urgencyLevel: 'medium',
  specialRequirements: 'Test requirements',
  budget: 200,
  contactPhone: '+201234567890',
  notes: 'Test notes'
};

async function testAPI() {
  console.log('🧪 Starting API Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Register Patient
    console.log('2. Testing Patient Registration...');
    const patientRegResponse = await axios.post(`${BASE_URL}/api/auth/register`, testPatient);
    console.log('✅ Patient Registration:', {
      user: patientRegResponse.data.user,
      hasToken: !!patientRegResponse.data.access_token
    });
    const patientToken = patientRegResponse.data.access_token;
    console.log('');

    // Test 3: Register Nurse
    console.log('3. Testing Nurse Registration...');
    const nurseRegResponse = await axios.post(`${BASE_URL}/api/auth/register`, testNurse);
    console.log('✅ Nurse Registration:', {
      user: nurseRegResponse.data.user,
      hasToken: !!nurseRegResponse.data.access_token
    });
    const nurseToken = nurseRegResponse.data.access_token;
    console.log('');

    // Test 4: Login Patient
    console.log('4. Testing Patient Login...');
    const patientLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testPatient.email,
      password: testPatient.password
    });
    console.log('✅ Patient Login:', {
      user: patientLoginResponse.data.user,
      hasToken: !!patientLoginResponse.data.access_token
    });
    console.log('');

    // Test 5: Create Service Request
    console.log('5. Testing Service Request Creation...');
    const requestResponse = await axios.post(`${BASE_URL}/api/requests`, testRequest, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('✅ Service Request Created:', {
      id: requestResponse.data.id,
      title: requestResponse.data.title,
      status: requestResponse.data.status
    });
    const requestId = requestResponse.data.id;
    console.log('');

    // Test 6: Get Requests (Patient View)
    console.log('6. Testing Get Requests (Patient View)...');
    const patientRequestsResponse = await axios.get(`${BASE_URL}/api/requests`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('✅ Patient Requests:', patientRequestsResponse.data.length, 'requests found');
    console.log('');

    // Test 7: Get Requests (Nurse View)
    console.log('7. Testing Get Requests (Nurse View)...');
    const nurseRequestsResponse = await axios.get(`${BASE_URL}/api/requests`, {
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    console.log('✅ Nurse Requests:', nurseRequestsResponse.data.length, 'requests found');
    console.log('');

    // Test 8: Get Nearby Nurses
    console.log('8. Testing Get Nearby Nurses...');
    const nearbyNursesResponse = await axios.get(`${BASE_URL}/api/nurses/nearby`, {
      params: {
        latitude: 30.033,
        longitude: 31.233,
        radius: 10
      }
    });
    console.log('✅ Nearby Nurses:', nearbyNursesResponse.data.length, 'nurses found');
    console.log('');

    // Test 9: Accept Request (Nurse)
    console.log('9. Testing Accept Request (Nurse)...');
    const acceptResponse = await axios.patch(`${BASE_URL}/api/requests/${requestId}/status`, {
      status: 'accepted'
    }, {
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    console.log('✅ Request Accepted:', acceptResponse.data.message);
    console.log('');

    console.log('🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   npm run dev:backend');
    }
    
    if (error.response?.status === 500 && error.response?.data?.message?.includes('connect')) {
      console.log('\n💡 Make sure MongoDB is running:');
      console.log('   - Local: Start MongoDB service');
      console.log('   - Atlas: Check connection string in .env file');
    }
  }
}

// Run tests
testAPI();
