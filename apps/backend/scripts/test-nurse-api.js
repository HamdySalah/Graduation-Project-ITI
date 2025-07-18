const fetch = require('node-fetch');

async function testNurseAPI() {
  try {
    console.log('🔍 Testing Nurse Details API...');
    
    const nurseId = '68796b98cad16551e0138377';
    const baseUrl = 'http://localhost:3001';
    const endpoint = `/api/admin/nurse-details/${nurseId}`;
    const fullUrl = `${baseUrl}${endpoint}`;
    
    console.log('📡 Testing URL:', fullUrl);
    
    // Test the API endpoint
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response received');
    console.log('🔍 Response structure:', {
      success: data.success,
      message: data.message,
      hasData: !!data.data,
      dataType: typeof data.data
    });
    
    if (data.data) {
      console.log('🔍 Nurse data fields:', Object.keys(data.data));
      console.log('👤 Basic info:', {
        id: data.data.id,
        name: data.data.name,
        email: data.data.email,
        fullName: data.data.fullName,
        emailAddress: data.data.emailAddress,
        status: data.data.status,
        completionStatus: data.data.completionStatus
      });
    }
    
    console.log('\n📋 Full Response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server might not be running on port 3001');
      console.log('💡 Try starting it with: npm run dev:backend');
    }
  }
}

testNurseAPI();
