const axios = require('axios');

// Test credentials
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`, // Unique email
  password: 'Test12345!',
  phone: '01012345678',
  role: 'patient',
  coordinates: [31.2357, 30.0444] // Example coordinates for Cairo
};

// Base URL
const API_URL = 'http://localhost:3001';

async function testRegisterEndpoint() {
  console.log('Testing registration endpoint...');
  console.log(`POST ${API_URL}/api/auth/register`);
  console.log('Request body:', JSON.stringify(testUser, null, 2));
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, testUser);
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Registration failed:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function testLoginEndpoint(email, password) {
  console.log('\nTesting login endpoint...');
  console.log(`POST ${API_URL}/api/auth/login`);
  console.log('Request body:', JSON.stringify({ email, password }, null, 2));
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Login failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function runTests() {
  try {
    // Test register
    const registerData = await testRegisterEndpoint();
    
    // Test login with the registered user
    if (registerData) {
      await testLoginEndpoint(testUser.email, testUser.password);
    }
    
    console.log('\n✅ Tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed!');
  }
}

// Run the tests
runTests();
