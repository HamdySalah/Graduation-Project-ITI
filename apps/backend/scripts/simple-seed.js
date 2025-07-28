const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🌱 Starting database seed...');
console.log('📍 MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/nurse-platform');

// Simple User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['patient', 'nurse', 'admin'], required: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected', 'suspended'], default: 'pending' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: { type: String, required: true },
  profileImage: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seedDatabase() {
  try {
    // Connect to MongoDB with timeout
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nurse-platform', {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    console.log('✅ Connected to MongoDB successfully');

    // Clear existing users
    console.log('🧹 Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Cleared existing data');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('🔐 Password hashed');

    // Create admin user
    console.log('👑 Creating admin user...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@careconnect.com',
      password: hashedPassword,
      phone: '+201000000000',
      role: 'admin',
      status: 'verified',
      location: {
        type: 'Point',
        coordinates: [31.2357, 30.0444] // Cairo, Egypt
      },
      address: 'CareConnect Headquarters, New Cairo, Egypt',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    });
    console.log('✅ Admin created:', admin.email);

    // Create patient user
    console.log('🏥 Creating patient user...');
    const patient = await User.create({
      name: 'Ahmed Hassan',
      email: 'patient@gmail.com',
      password: hashedPassword,
      phone: '+201111111111',
      role: 'patient',
      status: 'verified',
      location: {
        type: 'Point',
        coordinates: [31.2357, 30.0444]
      },
      address: '123 Tahrir Square, Cairo, Egypt',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    });
    console.log('✅ Patient created:', patient.email);

    // Create nurse user
    console.log('👩‍⚕️ Creating nurse user...');
    const nurse = await User.create({
      name: 'Dr. Amira Mostafa',
      email: 'nurse@gmail.com',
      password: hashedPassword,
      phone: '+201222222221',
      role: 'nurse',
      status: 'verified',
      location: {
        type: 'Point',
        coordinates: [31.2357, 30.0444]
      },
      address: '100 Medical District, Cairo, Egypt',
      profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'
    });
    console.log('✅ Nurse created:', nurse.email);

    console.log('\n🎉 Seed completed successfully!');
    console.log('='.repeat(50));
    console.log('📝 Test Credentials:');
    console.log('👑 ADMIN: admin@careconnect.com | password123');
    console.log('🏥 PATIENT: patient@gmail.com | password123');
    console.log('👩‍⚕️ NURSE: nurse@gmail.com | password123');
    console.log('='.repeat(50));
    console.log('🌐 Visit: http://localhost:3000');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding database:');
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('🔌 MongoDB connection failed. Please ensure MongoDB is running.');
      console.error('💡 Try: mongod --dbpath /path/to/your/db');
    } else if (error.code === 11000) {
      console.error('📧 Duplicate email error. Users might already exist.');
    } else {
      console.error('🐛 Unexpected error:', error.message);
    }
    
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the seed
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✨ Database seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database seeding failed');
      process.exit(1);
    });
}

module.exports = { seedDatabase };
