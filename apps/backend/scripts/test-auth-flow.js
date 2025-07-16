const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['patient', 'nurse', 'admin'], default: 'patient' },
  status: { type: String, enum: ['pending', 'verified', 'suspended'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

async function testAuthFlow() {
  try {
    console.log('🔍 Testing Authentication Flow...');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/nurse-platform');
    console.log('✅ Connected to database');

    // Find the nurse user
    const user = await User.findOne({ email: 'ehab@gmail.com' });
    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log('👤 User found:');
    console.log('   ID:', user._id.toString());
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Status:', user.status);

    // Test JWT token generation (same as auth service)
    const payload = { 
      email: user.email, 
      sub: user._id.toString(), 
      role: user.role 
    };
    
    const jwtSecret = process.env.JWT_SECRET || 'nurse-platform-super-secret-jwt-key-2024';
    console.log('\n🔑 JWT Secret exists:', !!jwtSecret);
    
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '24h',
      issuer: 'nurse-platform',
      audience: 'nurse-platform-users',
    });
    
    console.log('\n🎫 Generated Token:', token.substring(0, 50) + '...');
    
    // Test JWT token decoding (same as JWT strategy)
    try {
      const decoded = jwt.verify(token, jwtSecret, {
        issuer: 'nurse-platform',
        audience: 'nurse-platform-users',
      });
      
      console.log('\n✅ Token decoded successfully:');
      console.log('   sub (user ID):', decoded.sub);
      console.log('   email:', decoded.email);
      console.log('   role:', decoded.role);
      console.log('   iat:', new Date(decoded.iat * 1000).toLocaleString());
      console.log('   exp:', new Date(decoded.exp * 1000).toLocaleString());
      
      // Test what the JWT strategy would return
      const userFromDb = await User.findById(decoded.sub);
      if (userFromDb) {
        const strategyResult = {
          id: String(userFromDb._id),
          role: userFromDb.role,
          email: userFromDb.email,
          status: userFromDb.status,
        };
        
        console.log('\n🎯 JWT Strategy would return:');
        console.log('   id:', strategyResult.id);
        console.log('   role:', strategyResult.role);
        console.log('   email:', strategyResult.email);
        console.log('   status:', strategyResult.status);
        
        console.log('\n✅ Authentication flow test PASSED!');
        console.log('The user ID should be:', strategyResult.id);
        
      } else {
        console.error('❌ User not found in database with decoded ID');
      }
      
    } catch (decodeError) {
      console.error('❌ Token decode failed:', decodeError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testAuthFlow();
