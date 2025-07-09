const axios = require('axios');

const testData = {
  "email": "test.nurse.final" + Date.now() + "@gmail.com",
  "password": "Om123456789@",
  "name": "mostafa comanda",
  "role": "nurse",
  "phone": "01234567890",
  "specializations": ["pediatric", "surgical"],
  "coordinates": [31.2357, 30.0444],
  "yearsOfExperience": 5,
  "licenseNumber": "98435450",
  "bio": "خريجة جامعة سوهاج تمريض",
  "education": "بكالوريوس تمريض - جامعة سوهاج",
  "certifications": ["شهاده الاسعافات الاوليه", "شهادة رعاية الجروح المتقدمة"],
  "address": "طما ش سعد زغلول",
  "hourlyRate": 200
};

async function testRegistration() {
  try {
    console.log('Testing nurse registration...');
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:3001/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Registration failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received. Is the server running?');
      console.log('Error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get('http://localhost:3001');
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:3001');
    console.log('Please start the backend server first with: npm run dev:backend');
    return;
  }
  
  console.log('✅ Server is running');
  await testRegistration();
}

main();
