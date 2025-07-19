const fetch = require('node-fetch');

async function testRequestAPI() {
  try {
    console.log('🔍 Testing Request API Endpoints...');
    
    // Test 1: Create a request (this will fail without auth, but we can see the endpoint response)
    console.log('\n📡 Testing POST /api/requests endpoint...');
    const createResponse = await fetch('http://localhost:3001/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Request',
        description: 'This is a test request for API testing',
        serviceType: 'home_care',
        coordinates: [31.233, 30.033],
        address: 'Test Address, Cairo, Egypt',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        estimatedDuration: 2,
        urgencyLevel: 'medium',
      }),
    });
    
    console.log('📊 Create Response Status:', createResponse.status);
    const createResult = await createResponse.text();
    console.log('📊 Create Response:', createResult);
    
    // Test 2: Get requests (this will also fail without auth)
    console.log('\n📡 Testing GET /api/requests endpoint...');
    const getResponse = await fetch('http://localhost:3001/api/requests');
    console.log('📊 Get Response Status:', getResponse.status);
    const getResult = await getResponse.text();
    console.log('📊 Get Response:', getResult);
    
    // Test 3: Test a specific request ID (will fail without auth and valid ID)
    console.log('\n📡 Testing GET /api/requests/:id endpoint...');
    const getByIdResponse = await fetch('http://localhost:3001/api/requests/507f1f77bcf86cd799439011');
    console.log('📊 Get By ID Response Status:', getByIdResponse.status);
    const getByIdResult = await getByIdResponse.text();
    console.log('📊 Get By ID Response:', getByIdResult);
    
    // Summary
    console.log('\n📋 API Test Summary:');
    console.log(`✅ POST /api/requests: ${createResponse.status === 401 ? 'Endpoint exists (needs auth)' : 'Unexpected response'}`);
    console.log(`✅ GET /api/requests: ${getResponse.status === 401 ? 'Endpoint exists (needs auth)' : 'Unexpected response'}`);
    console.log(`✅ GET /api/requests/:id: ${getByIdResponse.status === 401 ? 'Endpoint exists (needs auth)' : 'Unexpected response'}`);
    
    if (createResponse.status === 401 && getResponse.status === 401 && getByIdResponse.status === 401) {
      console.log('🎉 All endpoints are properly protected and responding!');
    } else {
      console.log('⚠️  Some endpoints may have issues - check responses above');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running on port 3001');
      console.log('💡 Try starting it with: npm run dev:backend');
    }
  }
}

testRequestAPI();
