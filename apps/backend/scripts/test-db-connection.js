const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...');
  console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Set (hidden for security)' : 'NOT SET');
  
  try {
    console.log('\n⏳ Attempting to connect to MongoDB...');
    
    // Test the current connection string
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test basic operations
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
    console.log('✅ Database write test successful!');
    
    const testDoc = await testCollection.findOne({ test: 'connection' });
    console.log('✅ Database read test successful!');
    
    // Clean up test document
    await testCollection.deleteOne({ test: 'connection' });
    console.log('✅ Database cleanup successful!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed') || error.message.includes('Invalid credentials')) {
      console.log('\n🔧 SOLUTION: Authentication Error Detected');
      console.log('This usually means:');
      console.log('1. Username or password is incorrect');
      console.log('2. Database user permissions have changed');
      console.log('3. IP address is not whitelisted');
      console.log('\n📋 Try these solutions:');
      console.log('1. Check MongoDB Atlas dashboard for user credentials');
      console.log('2. Verify IP whitelist includes your current IP');
      console.log('3. Try using a local MongoDB instance instead');
      
      // Suggest local MongoDB setup
      console.log('\n🏠 LOCAL MONGODB SETUP:');
      console.log('1. Install MongoDB locally');
      console.log('2. Update .env file:');
      console.log('   MONGODB_URI=mongodb://localhost:27017/nurse-platform');
      
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
      console.log('\n🌐 SOLUTION: Network Error Detected');
      console.log('1. Check internet connection');
      console.log('2. Verify MongoDB cluster is running');
      console.log('3. Check firewall settings');
    }
    
    return false;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
  
  return true;
}

// Alternative connection strings to try
async function tryAlternativeConnections() {
  console.log('\n🔄 Trying alternative connection methods...');
  
  const alternatives = [
    // Local MongoDB
    'mongodb://localhost:27017/nurse-platform',
    // MongoDB with different options
    'mongodb+srv://finalProject:xF7Ccz3NiPezOmoS@nurse.vvrww9a.mongodb.net/nurse-platform?retryWrites=true&w=majority',
  ];
  
  for (const uri of alternatives) {
    try {
      console.log(`\n⏳ Trying: ${uri.includes('localhost') ? 'Local MongoDB' : 'Cloud MongoDB (alternative)'}`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log('✅ Connection successful!');
      await mongoose.disconnect();
      
      console.log(`\n🎯 WORKING CONNECTION FOUND!`);
      console.log(`Update your .env file with:`);
      console.log(`MONGODB_URI=${uri}`);
      return uri;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message.substring(0, 100)}...`);
      try { await mongoose.disconnect(); } catch {}
    }
  }
  
  return null;
}

// Run the tests
async function main() {
  const success = await testDatabaseConnection();
  
  if (!success) {
    await tryAlternativeConnections();
  }
}

main();
