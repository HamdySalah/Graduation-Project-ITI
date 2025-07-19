const fetch = require('node-fetch');

async function testNurseDetailsAPI() {
  console.log('🧪 Testing Nurse Details API...');

  const nurseId = '687a44398c63843d6e313b80';
  const detailsUrl = `http://localhost:3001/api/admin/nurse-details/${nurseId}`;
  const verifyUrl = `http://localhost:3001/api/admin/verify-nurse/${nurseId}`;

  console.log('📍 Testing Details URL:', detailsUrl);
  console.log('📍 Testing Verify URL:', verifyUrl);

  try {
    // Test nurse details endpoint
    console.log('\n1️⃣ Testing nurse details endpoint...');
    const response1 = await fetch(detailsUrl);
    console.log('Details Status:', response1.status);
    console.log('Details Status Text:', response1.statusText);

    if (response1.ok) {
      console.log('✅ Details endpoint working');
    } else {
      const errorText1 = await response1.text();
      console.log('❌ Details Response:', errorText1);
    }

    // Test verify nurse endpoint
    console.log('\n2️⃣ Testing verify nurse endpoint...');
    const response2 = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      }
    });
    console.log('Verify Status:', response2.status);
    console.log('Verify Status Text:', response2.statusText);

    const responseText2 = await response2.text();
    console.log('Verify Response:', responseText2);

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testNurseDetailsAPI();
