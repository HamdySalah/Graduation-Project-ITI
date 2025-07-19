const fetch = require('node-fetch');

async function testRequestStatusUpdate() {
  console.log('🧪 Testing Request Status Update Fix...');
  
  const requestId = '68799961dc3d30e963c5c7fa'; // From the error message
  const apiUrl = `http://localhost:3001/api/requests/${requestId}/status`;
  
  console.log('📍 Testing URL:', apiUrl);
  
  try {
    // Test the PATCH request that was failing
    console.log('\n1️⃣ Testing PATCH request status update...');
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-nurse-token' // Mock token for testing
      },
      body: JSON.stringify({
        status: 'completed'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.status === 500) {
      console.log('❌ Still getting 500 error - check if the fix worked');
    } else if (response.status === 401) {
      console.log('✅ Getting 401 (auth error) instead of 500 - fix likely worked!');
    } else if (response.status === 404) {
      console.log('✅ Getting 404 (not found) instead of 500 - fix likely worked!');
    } else {
      console.log('✅ No 500 error - fix worked!');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running. Please start it first.');
    } else {
      console.error('❌ Error testing API:', error.message);
    }
  }
}

testRequestStatusUpdate();
