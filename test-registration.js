// test-registration.js
// This script tests the registration flow and email verification

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

const API_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_ENDPOINT = 'http://localhost:3001/api/auth/register';

// Test registration data for a nurse account
const testUser = {
  name: 'Test User',
  email: 'om399724@gmail.com', // The email we want to test
  password: 'Test@12345', // Must contain uppercase, lowercase, and number
  role: 'nurse', // Using nurse role to test document upload
  phone: '01012345678', // Must be a valid Egyptian format
  address: 'Test Address, Cairo, Egypt',
  coordinates: [31.2357, 30.0444], // [longitude, latitude]
  // Nurse-specific fields
  licenseNumber: 'NL12345678',
  yearsOfExperience: 5,
  specializations: ['general', 'geriatric'],
  education: 'Bachelor of Science in Nursing, Cairo University',
  certifications: ['CPR Certified', 'Advanced Nursing Care'],
  documents: ['https://example.com/license.pdf'],
  hourlyRate: 50,
  bio: 'Experienced nurse with 5 years in general and elderly care',
  languages: ['English', 'Arabic']
};

async function testRegistration() {
  console.log('Starting registration test with:', testUser.email);
  console.log('API endpoint:', API_ENDPOINT);
  
  try {
    console.log('Sending registration request...');
    console.log('User data:', JSON.stringify(testUser, null, 2));
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    const response = await axios.post(API_ENDPOINT, testUser, { headers });
    
    console.log('\nRegistration successful!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.message) {
      console.log('\nMessage from server:', response.data.message);
    }
    
    console.log('\nCheck your email inbox for the verification email.');
    console.log('Email should be sent to:', testUser.email);
    console.log('If you don\'t receive an email, check the server logs for errors.');
    
    return true;
  } catch (error) {
    console.error('\nRegistration failed:');
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data && error.response.data.message) {
        console.error('Error message:', error.response.data.message);
      }
      
      // Check if the user already exists - we can proceed with the test
      if (error.response.status === 409 && error.response.data.message.includes('already exists')) {
        console.log('\nThis email is already registered. This is fine for testing email functionality.');
        console.log('You can check your inbox for previous verification emails or request a new one.');
        return true;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. The server may be down or not accessible.');
      console.error('Is the backend server running? Try running: npm run dev:backend');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up the request:', error.message);
    }
    
    return false;
  }
}

// Run the test
testRegistration()
  .then(result => {
    if (result) {
      console.log('\nRegistration test completed. Check your email at:', testUser.email);
    } else {
      console.log('\nRegistration test failed. Check the error messages above.');
    }
  })
  .catch(error => {
    console.error('\nUnexpected error during test:', error);
  });
