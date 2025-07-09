// Test script to examine full API responses
import axios from 'axios';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Test user data
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`, // Unique email to avoid conflicts
  password: 'Test123!',
  phone: '01012345678', // Egyptian phone format
  role: 'patient',
  coordinates: [31.2357, 30.0444] // Cairo coordinates
};

// Setup axios with detailed logging
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add request interceptor for logging
api.interceptors.request.use(request => {
  console.log('Request:', {
    url: request.url,
    method: request.method,
    data: request.data,
    headers: request.headers
  });
  return request;
});

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  error => {
    console.error('Error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response',
      request: error.request ? 'Request was made but no response received' : 'Request setup error'
    });
    return Promise.reject(error);
  }
);

// Test registration
async function testRegistration() {
  console.log('=== TESTING REGISTRATION ===');
  console.log('Test user data:', testUser);
  
  try {
    const response = await api.post('/api/auth/register', testUser);
    console.log('Registration successful!');
    console.log('Response structure:', JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      token: response.data.access_token || response.data.data?.access_token,
      user: response.data.user || response.data.data?.user
    };
  } catch (error) {
    console.error('Registration failed');
    return { success: false, error };
  }
}

// Test login with the created user
async function testLogin(email, password) {
  console.log(`\n=== TESTING LOGIN (${email}) ===`);
  
  try {
    const response = await api.post('/api/auth/login', { email, password });
    console.log('Login successful!');
    console.log('Response structure:', JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      token: response.data.access_token || response.data.data?.access_token,
      user: response.data.user || response.data.data?.user
    };
  } catch (error) {
    console.error('Login failed');
    return { success: false, error };
  }
}

// Run tests
async function runTests() {
  // Test registration
  const regResult = await testRegistration();
  
  // If registration succeeded, test login
  if (regResult.success) {
    await testLogin(testUser.email, testUser.password);
  }
  
  console.log('\n=== TESTS COMPLETED ===');
}

runTests();
