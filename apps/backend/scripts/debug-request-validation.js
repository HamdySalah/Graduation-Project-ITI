const fetch = require('node-fetch');

async function debugRequestValidation() {
  console.log('🔍 Debugging Request Validation Issues...\n');
  
  // First, let's get a valid auth token by logging in
  console.log('1️⃣ Getting authentication token...');
  
  try {
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ahmed@example.com', // Patient user from seed data
        password: 'patient123' // From seed data
      }),
    });
    
    console.log('📊 Login Response Status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('📊 Login Response Body:', JSON.stringify(loginData, null, 2));

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Cannot proceed without auth token.');
      console.log('💡 Please check the patient user credentials in the database.');
      return;
    }

    // Extract token from response (handle different response structures)
    var authToken = loginData.access_token || loginData.data?.access_token || loginData.token;

    console.log('✅ Authentication successful');
    console.log('🔑 Token preview:', authToken ? authToken.substring(0, 50) + '...' : 'No token received');
    
    // Test 2: Try creating a request with minimal valid data
    console.log('\n2️⃣ Testing request creation with minimal valid data...');
    
    const minimalRequestData = {
      title: 'Test Request Title',
      description: 'This is a test description that is longer than 10 characters',
      serviceType: 'home_care',
      coordinates: [31.233, 30.033],
      address: '123 Test Street, Cairo, Egypt - This is longer than 10 chars',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      estimatedDuration: 2,
      urgencyLevel: 'medium'
    };
    
    console.log('📤 Sending request data:', JSON.stringify(minimalRequestData, null, 2));
    
    const createResponse = await fetch('http://localhost:3001/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(minimalRequestData),
    });
    
    console.log('📊 Response Status:', createResponse.status);
    const responseText = await createResponse.text();
    console.log('📊 Response Body:', responseText);
    
    if (!createResponse.ok) {
      console.log('\n❌ Request creation failed. Let\'s try with different variations...');
      
      // Test 3: Try without optional fields
      console.log('\n3️⃣ Testing with only required fields...');
      
      const requiredOnlyData = {
        title: 'Test Request Title',
        description: 'This is a test description that is longer than 10 characters',
        serviceType: 'home_care',
        coordinates: [31.233, 30.033],
        address: '123 Test Street, Cairo, Egypt - This is longer than 10 chars',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      console.log('📤 Sending required-only data:', JSON.stringify(requiredOnlyData, null, 2));
      
      const createResponse2 = await fetch('http://localhost:3001/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requiredOnlyData),
      });
      
      console.log('📊 Response Status:', createResponse2.status);
      const responseText2 = await createResponse2.text();
      console.log('📊 Response Body:', responseText2);
      
      if (!createResponse2.ok) {
        // Test 4: Try with different service type
        console.log('\n4️⃣ Testing with different service type...');
        
        const differentServiceData = {
          ...requiredOnlyData,
          serviceType: 'wound_care'
        };
        
        console.log('📤 Sending different service type data:', JSON.stringify(differentServiceData, null, 2));
        
        const createResponse3 = await fetch('http://localhost:3001/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(differentServiceData),
        });
        
        console.log('📊 Response Status:', createResponse3.status);
        const responseText3 = await createResponse3.text();
        console.log('📊 Response Body:', responseText3);
      } else {
        console.log('✅ Request creation successful with required fields only!');
      }
    } else {
      console.log('✅ Request creation successful!');
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

debugRequestValidation();
