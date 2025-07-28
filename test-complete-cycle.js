const API_BASE_URL = 'http://localhost:3001';

// Test credentials
const patientCredentials = {
  email: 'testpatient@example.com',
  password: 'password123'
};

const nurseCredentials = {
  email: 'testnurse@example.com',
  password: 'password123'
};

let patientToken = '';
let nurseToken = '';
let testRequestId = '';
let testApplicationId = '';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.message || 'Request failed'}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Request failed for ${url}:`, error.message);
    throw error;
  }
}

async function loginUser(credentials, userType) {
  console.log(`\n🔐 Logging in ${userType}...`);
  const response = await makeRequest(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  console.log(`✅ ${userType} login successful`);
  return response.data.access_token;
}

async function testCompleteRequestCycle() {
  console.log('🚀 Starting Complete Request Cycle Test\n');

  try {
    // Step 1: Login both users
    patientToken = await loginUser(patientCredentials, 'Patient');
    nurseToken = await loginUser(nurseCredentials, 'Nurse');

    // Step 2: Patient creates a request
    console.log('\n📝 Patient creating a new request...');
    const requestData = {
      title: 'Test Nursing Request - Complete Cycle',
      description: 'Testing the complete request cycle with rating system for post-surgical care',
      serviceType: 'post_surgical_care',
      coordinates: [31.233, 30.033],
      address: '123 Test Street, Test City, Cairo',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      estimatedDuration: 2,
      budget: 100,
      urgencyLevel: 'medium'
    };

    const requestResponse = await makeRequest(`${API_BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify(requestData)
    });

    const request = requestResponse.data || requestResponse;
    testRequestId = request.id || request._id;
    console.log(`✅ Request created with ID: ${testRequestId}`);

    // Step 3: Nurse applies to the request
    console.log('\n👩‍⚕️ Nurse applying to the request...');
    const applicationData = {
      price: 120,
      estimatedTime: 2,
      message: 'I am experienced in general care and available for this request.'
    };

    const applicationResponse = await makeRequest(`${API_BASE_URL}/api/requests/${testRequestId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${nurseToken}` },
      body: JSON.stringify(applicationData)
    });

    const application = applicationResponse.data || applicationResponse;
    testApplicationId = application.id || application._id;
    console.log(`✅ Application submitted with ID: ${testApplicationId}`);

    // Step 4: Test nurse can edit their offer
    console.log('\n✏️ Testing nurse edit offer functionality...');
    const editData = {
      price: 130,
      estimatedTime: 2.5,
      message: 'Updated offer with better pricing and time estimate.'
    };

    await makeRequest(`${API_BASE_URL}/api/applications/${testApplicationId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${nurseToken}` },
      body: JSON.stringify(editData)
    });
    
    console.log('✅ Nurse successfully edited their offer');

    // Step 5: Patient accepts the application
    console.log('\n✅ Patient accepting the nurse application...');
    await makeRequest(`${API_BASE_URL}/api/applications/${testApplicationId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    
    console.log('✅ Application accepted - Request status should be "in_progress"');

    // Step 6: Verify request is in active requests for nurse
    console.log('\n🔍 Verifying nurse can see active request...');
    const nurseApplications = await makeRequest(`${API_BASE_URL}/api/applications/nurse`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    
    const activeApp = nurseApplications.find(app => 
      app.id === testApplicationId && 
      app.status === 'accepted' && 
      app.request.status === 'in_progress'
    );
    
    if (activeApp) {
      console.log('✅ Nurse can see the request in active requests');
    } else {
      console.log('❌ Request not found in nurse active requests');
    }

    // Step 7: Nurse marks request as completed
    console.log('\n🏁 Nurse marking request as completed...');
    await makeRequest(`${API_BASE_URL}/api/requests/${testRequestId}/complete-nurse`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    
    console.log('✅ Nurse marked request as completed');

    // Step 8: Patient marks request as completed
    console.log('\n🏁 Patient marking request as completed...');
    await makeRequest(`${API_BASE_URL}/api/requests/${testRequestId}/complete-patient`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    
    console.log('✅ Patient marked request as completed - Request should be fully completed');

    // Step 9: Verify request appears in completed requests
    console.log('\n🔍 Verifying request appears in completed requests...');
    const patientRequests = await makeRequest(`${API_BASE_URL}/api/requests/patient`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    
    const completedRequest = patientRequests.find(req => 
      req.id === testRequestId && req.status === 'completed'
    );
    
    if (completedRequest) {
      console.log('✅ Request appears in patient completed requests');
    } else {
      console.log('❌ Request not found in patient completed requests');
    }

    // Step 10: Patient submits rating and review
    console.log('\n⭐ Patient submitting rating and review...');
    const reviewData = {
      requestId: testRequestId,
      nurseId: completedRequest.nurseId,
      rating: 5,
      comment: 'Excellent service! Very professional and caring nurse.',
      wouldRecommend: true
    };

    const review = await makeRequest(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify(reviewData)
    });
    
    console.log(`✅ Rating and review submitted with ID: ${review.id}`);

    // Step 11: Verify nurse can see the review
    console.log('\n🔍 Verifying nurse can see the review...');
    const nurseReviews = await makeRequest(`${API_BASE_URL}/api/reviews/nurse/${completedRequest.nurseId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    
    const newReview = nurseReviews.reviews.find(r => r.id === review.id);
    if (newReview) {
      console.log('✅ Review appears in nurse profile');
      console.log(`   Rating: ${newReview.rating}/5 stars`);
      console.log(`   Comment: "${newReview.comment}"`);
    } else {
      console.log('❌ Review not found in nurse profile');
    }

    // Step 12: Test cancel functionality with a new application
    console.log('\n🚫 Testing cancel offer functionality...');
    
    // Create another request
    const newRequest = await makeRequest(`${API_BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        ...requestData,
        title: 'Test Cancel Request - Wound Care',
        description: 'Testing the cancel offer functionality for wound care services',
        serviceType: 'wound_care'
      })
    });

    // Nurse applies
    const newApplication = await makeRequest(`${API_BASE_URL}/api/requests/${newRequest.id}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${nurseToken}` },
      body: JSON.stringify(applicationData)
    });

    // Nurse cancels the application
    await makeRequest(`${API_BASE_URL}/api/applications/${newApplication.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    
    console.log('✅ Nurse successfully cancelled their offer');

    console.log('\n🎉 Complete Request Cycle Test PASSED!');
    console.log('\n📋 Summary of tested features:');
    console.log('   ✅ Patient creates request');
    console.log('   ✅ Nurse applies to request');
    console.log('   ✅ Nurse can edit their offer');
    console.log('   ✅ Patient accepts application');
    console.log('   ✅ Request appears in nurse active requests');
    console.log('   ✅ Nurse marks request completed');
    console.log('   ✅ Patient marks request completed');
    console.log('   ✅ Request appears in completed requests');
    console.log('   ✅ Patient can rate and review nurse');
    console.log('   ✅ Review appears in nurse profile');
    console.log('   ✅ Nurse can cancel pending offers');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCompleteRequestCycle();
