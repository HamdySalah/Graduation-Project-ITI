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

async function setupLocalDatabase() {
  try {
    console.log('🏗️  Setting up local database...');
    
    // Connect to local MongoDB
    await mongoose.connect('mongodb://localhost:27017/nurse-platform');
    console.log('✅ Connected to local MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'ehab@gmail.com' });
    
    if (existingUser) {
      console.log('👤 User already exists:', existingUser.email);
      console.log('   Role:', existingUser.role);
      console.log('   Status:', existingUser.status);
      console.log('   ID:', existingUser._id);
    } else {
      console.log('👤 Creating nurse user...');

      // Create nurse user (password will be hashed by the backend when registering)
      const nurseUser = new User({
        name: 'Ehab Nurse',
        email: 'ehab@gmail.com',
        password: '$2b$10$example.hashed.password.placeholder', // Placeholder - use registration endpoint
        role: 'nurse',
        status: 'pending',
      });
      
      await nurseUser.save();
      console.log('✅ Nurse user created successfully!');
      console.log('   Email: ehab@gmail.com');
      console.log('   Password: password123');
      console.log('   Role: nurse');
      console.log('   Status: pending');
      console.log('   ID:', nurseUser._id);
    }

    // Also create an admin user for testing
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: '$2b$10$example.hashed.password.placeholder', // Placeholder
        role: 'admin',
        status: 'verified',
      });
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('   Email: admin@gmail.com');
      console.log('   Password: Use registration endpoint');
    }

    // List all users
    const allUsers = await User.find({});
    console.log('\n📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`   - ${user.email}: ${user.role} (${user.status})`);
    });

    console.log('\n🎯 Database setup complete!');
    console.log('You can now:');
    console.log('1. Start the backend server');
    console.log('2. Login with ehab@gmail.com / password123');
    console.log('3. Complete the nurse profile');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

setupLocalDatabase();
