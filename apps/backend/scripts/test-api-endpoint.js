const fetch = require('node-fetch');

async function testNurseDetailsEndpoint() {
  try {
    console.log('🔍 Testing Nurse Details API Endpoint...');
    
    const nurseId = '68796b98cad16551e0138377';
    const apiUrl = `http://localhost:3001/api/admin/nurse-details/${nurseId}`;
    
    console.log('📡 Making request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('❌ Error Body:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if data structure is correct
    if (data && data.success && data.data) {
      console.log('\n✅ Response structure is correct');
      console.log('👤 Nurse Name:', data.data.name);
      console.log('📧 Nurse Email:', data.data.email);
      console.log('📋 Completion Status:', data.data.completionStatus);
    } else {
      console.log('\n❌ Unexpected response structure');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running. Start it with: npm run dev:backend');
    }
  }
}

testNurseDetailsEndpoint();
