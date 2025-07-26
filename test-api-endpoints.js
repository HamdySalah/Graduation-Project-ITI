// Test script for API endpoints
const fetch = require('isomorphic-fetch');

const API_BASE_URL = 'http://localhost:3001';

// Mock token for testing
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGUiOiJudXJzZSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

async function testEndpoint(url, options = {}) {
  try {
    console.log(`Testing endpoint: ${url}`);
    const response = await fetch(url, options);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 204) {
      return { status: response.status, message: 'No content' };
    }
    
    try {
      const data = await response.json();
      return data;
    } catch (e) {
      console.log('Response is not JSON:', e.message);
      const text = await response.text();
      return { status: response.status, text: text.substring(0, 100) + '...' };
    }
  } catch (error) {
    console.error(`Error testing endpoint ${url}:`, error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('=== API TEST RESULTS ===');
  
  // Test health endpoint
  const healthResult = await testEndpoint(`${API_BASE_URL}/api/health`);
  console.log('Health check:', healthResult);
  
  // Test requests endpoint without auth
  const requestsNoAuthResult = await testEndpoint(`${API_BASE_URL}/api/requests`);
  console.log('Requests (no auth):', requestsNoAuthResult);
  
  // Test requests endpoint with auth
  const requestsWithAuthResult = await testEndpoint(`${API_BASE_URL}/api/requests`, {
    headers: {
      'Authorization': `Bearer ${mockToken}`
    }
  });
  console.log('Requests (with auth):', requestsWithAuthResult);
  
  // Test profile endpoint with auth
  const profileResult = await testEndpoint(`${API_BASE_URL}/api/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${mockToken}`
    }
  });
  console.log('Profile:', profileResult);
  
  console.log('=== TEST COMPLETE ===');
}

runTests().catch(console.error);
