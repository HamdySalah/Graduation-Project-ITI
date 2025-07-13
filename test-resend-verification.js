// test-resend-verification.js
// This script tests the resend verification email functionality

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
const envPath = path.join(__dirname, 'apps/backend/.env');
console.log('Loading .env from:', envPath);
console.log('File exists:', fs.existsSync(envPath));

try {
  require('dotenv').config({ path: envPath });
} catch (error) {
  console.error('Error loading .env file:', error);
}

const API_ENDPOINT = 'http://localhost:3001/api/auth/resend-verification';
const TEST_EMAIL = 'om399724@gmail.com';

async function resendVerificationEmail() {
  console.log('Requesting verification email for:', TEST_EMAIL);
  console.log('API endpoint:', API_ENDPOINT);
  
  try {
    const response = await axios.post(API_ENDPOINT, { email: TEST_EMAIL });
    
    console.log('\nRequest successful!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.message) {
      console.log('\nMessage from server:', response.data.message);
    }
    
    console.log('\nCheck your email inbox for the verification email.');
    return true;
  } catch (error) {
    console.error('\nRequest failed:');
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data && error.response.data.message) {
        console.error('Error message:', error.response.data.message);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. The server may be down or not accessible.');
      console.error('Request:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error setting up the request:', error.message);
    }
    
    return false;
  }
}

// Run the test
resendVerificationEmail()
  .then(result => {
    if (result) {
      console.log('\nResend verification test completed. Check your email at:', TEST_EMAIL);
    } else {
      console.log('\nResend verification test failed. Check the error messages above.');
    }
  })
  .catch(error => {
    console.error('\nUnexpected error during test:', error);
  });
