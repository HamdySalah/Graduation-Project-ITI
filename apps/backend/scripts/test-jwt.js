const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test JWT token decoding
function testJWT() {
  console.log('JWT Secret exists:', !!process.env.JWT_SECRET);
  
  // Create a test token for the user we found
  const testPayload = {
    sub: '6877b4f1f970d13532cb54b2', // The user ID we found
    email: 'ehab@gmail.com',
    role: 'nurse',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  };

  try {
    const token = jwt.sign(testPayload, process.env.JWT_SECRET);
    console.log('Generated test token:', token);
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    console.log('\nToken validation successful!');
    console.log('User ID:', decoded.sub);
    console.log('Email:', decoded.email);
    console.log('Role:', decoded.role);
    
  } catch (error) {
    console.error('JWT Error:', error.message);
  }
}

testJWT();
