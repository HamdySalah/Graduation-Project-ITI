const fetch = require('node-fetch');

async function testNurseEndpoint() {
  try {
    console.log('🔍 Testing Nurse Endpoint...');
    
    const nurseId = '68725c4a16c044facbfae06c';
    const url = `http://localhost:3001/api/nurses/${nurseId}`;
    
    console.log('📡 Testing URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success! Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNurseEndpoint();
