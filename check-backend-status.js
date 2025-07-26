// Simple script to check if backend is running
const fetch = require('isomorphic-fetch');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function checkBackend() {
  try {
    console.log('Checking backend server at:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    console.log('Backend server response:', data);
    return data;
  } catch (error) {
    console.error('Backend server check failed:', error);
    return { status: 'error', message: 'Could not connect to backend server' };
  }
}

checkBackend().then(result => {
  console.log('Backend check complete:', result);
});

module.exports = { checkBackend };
