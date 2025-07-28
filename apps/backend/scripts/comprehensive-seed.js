const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema
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

userSchema.index({ location: '2dsphere' });

// Nurse Profile Schema
const nurseProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  licenseNumber: { type: String, required: true, unique: true },
  specializations: [{ 
    type: String, 
    enum: ['home_care', 'elderly_care', 'wound_care', 'medication_administration', 'post_surgical_care', 'vital_signs_monitoring', 'pediatric_care', 'chronic_disease_management']
  }],
  experience: { type: Number, required: true },
  education: String,
  certifications: [String],
  languages: [String],
  availability: {
    monday: { available: Boolean, startTime: String, endTime: String },
    tuesday: { available: Boolean, startTime: String, endTime: String },
    wednesday: { available: Boolean, startTime: String, endTime: String },
    thursday: { available: Boolean, startTime: String, endTime: String },
    friday: { available: Boolean, startTime: String, endTime: String },
    saturday: { available: Boolean, startTime: String, endTime: String },
    sunday: { available: Boolean, startTime: String, endTime: String }
  },
  hourlyRate: { type: Number, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  bio: String,
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// Patient Request Schema
const requestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  serviceType: { 
    type: String, 
    enum: ['home_care', 'elderly_care', 'wound_care', 'medication_administration', 'post_surgical_care', 'vital_signs_monitoring', 'pediatric_care', 'chronic_disease_management'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending' 
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  estimatedDuration: { type: Number, required: true },
  urgencyLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  specialRequirements: String,
  budget: { type: Number, required: true },
  contactPhone: { type: String, required: true },
  notes: String,
  acceptedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  nurseCompleted: { type: Boolean, default: false },
  nurseCompletedAt: Date,
  patientCompleted: { type: Boolean, default: false },
  patientCompletedAt: Date,
}, { timestamps: true });

requestSchema.index({ location: '2dsphere' });

// Review Schema
const reviewSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRequest', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerRole: { type: String, enum: ['patient', 'nurse'], required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewType: { type: String, enum: ['user_to_user', 'service_review'], required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  feedback: { type: String, maxlength: 1000 },
  isActive: { type: Boolean, default: true },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Application Schema
const applicationSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRequest', required: true },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true },
  estimatedTime: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

// Models
const User = mongoose.model('User', userSchema);
const NurseProfile = mongoose.model('NurseProfile', nurseProfileSchema);
const PatientRequest = mongoose.model('PatientRequest', requestSchema);
const Review = mongoose.model('Review', reviewSchema);
const Application = mongoose.model('Application', applicationSchema);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nurse-platform');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      NurseProfile.deleteMany({}),
      PatientRequest.deleteMany({}),
      Review.deleteMany({}),
      Application.deleteMany({})
    ]);

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Admin Users
    console.log('👑 Creating admin users...');
    const adminUsers = await User.insertMany([
      {
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
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.admin@careconnect.com',
        password: hashedPassword,
        phone: '+201000000001',
        role: 'admin',
        status: 'verified',
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444]
        },
        address: 'CareConnect Operations, New Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      }
    ]);

    // 2. Create Patient Users
    console.log('🏥 Creating patient users...');
    const patients = await User.insertMany([
      {
        name: 'Ahmed Hassan',
        email: 'patient@gmail.com',
        password: hashedPassword,
        phone: '+201111111111',
        role: 'patient',
        status: 'verified',
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444] // Cairo
        },
        address: '123 Tahrir Square, Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Fatima Al-Zahra',
        email: 'fatima.patient@gmail.com',
        password: hashedPassword,
        phone: '+201111111112',
        role: 'patient',
        status: 'verified',
        location: {
          type: 'Point',
          coordinates: [31.2001, 29.9187] // Giza
        },
        address: '456 Pyramid Street, Giza, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Omar Mahmoud',
        email: 'omar.patient@gmail.com',
        password: hashedPassword,
        phone: '+201111111113',
        role: 'patient',
        status: 'verified',
        location: {
          type: 'Point',
          coordinates: [31.2461, 30.0588] // Heliopolis
        },
        address: '789 Korba Street, Heliopolis, Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Maryam Ibrahim',
        email: 'maryam.patient@gmail.com',
        password: hashedPassword,
        phone: '+201111111114',
        role: 'patient',
        status: 'pending',
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444]
        },
        address: '321 Maadi Street, Maadi, Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
      }
    ]);

    // 3. Create Nurse Users
    console.log('👩‍⚕️ Creating nurse users...');
    const nurses = await User.insertMany([
      {
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
      },
      {
        name: 'Nurse Yasmin Ali',
        email: 'yasmin.nurse@gmail.com',
        password: hashedPassword,
        phone: '+201222222222',
        role: 'nurse',
        status: 'verified',
        location: {
          type: 'Point',
          coordinates: [31.2001, 29.9187]
        },
        address: '200 Healthcare Avenue, Giza, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Nurse Khaled Farouk',
        email: 'khaled.nurse@gmail.com',
        password: hashedPassword,
        phone: '+201222222223',
        role: 'nurse',
        status: 'verified',
        location: {
          type: 'Point',
          coordinates: [31.2461, 30.0588]
        },
        address: '300 Nursing Plaza, Heliopolis, Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'
      }
    ]);

    console.log('📋 Creating nurse profiles...');
    const nurseProfiles = await NurseProfile.insertMany([
      {
        userId: nurses[0]._id,
        licenseNumber: 'RN-EG-001234',
        specializations: ['wound_care', 'home_care'],
        experience: 8,
        education: 'Bachelor of Nursing, Cairo University',
        certifications: ['Wound Care Specialist', 'Home Healthcare Certified'],
        languages: ['Arabic', 'English'],
        availability: {
          monday: { available: true, startTime: '08:00', endTime: '18:00' },
          tuesday: { available: true, startTime: '08:00', endTime: '18:00' },
          wednesday: { available: true, startTime: '08:00', endTime: '18:00' },
          thursday: { available: true, startTime: '08:00', endTime: '18:00' },
          friday: { available: true, startTime: '08:00', endTime: '16:00' },
          saturday: { available: false },
          sunday: { available: false }
        },
        hourlyRate: 150,
        rating: 4.8,
        totalReviews: 45,
        bio: 'Experienced registered nurse specializing in wound care and home healthcare services.',
        isVerified: true
      },
      {
        userId: nurses[1]._id,
        licenseNumber: 'RN-EG-001235',
        specializations: ['elderly_care', 'medication_administration'],
        experience: 5,
        education: 'Bachelor of Nursing, Alexandria University',
        certifications: ['Geriatric Care Specialist', 'Medication Management'],
        languages: ['Arabic', 'English', 'French'],
        availability: {
          monday: { available: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
          wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
          thursday: { available: true, startTime: '09:00', endTime: '17:00' },
          friday: { available: true, startTime: '09:00', endTime: '15:00' },
          saturday: { available: true, startTime: '10:00', endTime: '14:00' },
          sunday: { available: false }
        },
        hourlyRate: 120,
        rating: 4.6,
        totalReviews: 32,
        bio: 'Compassionate nurse with expertise in elderly care and medication management.',
        isVerified: true
      },
      {
        userId: nurses[2]._id,
        licenseNumber: 'RN-EG-001236',
        specializations: ['post_surgical_care', 'vital_signs_monitoring'],
        experience: 12,
        education: 'Master of Nursing, Ain Shams University',
        certifications: ['Post-Surgical Care Specialist', 'Critical Care Certified'],
        languages: ['Arabic', 'English'],
        availability: {
          monday: { available: true, startTime: '06:00', endTime: '18:00' },
          tuesday: { available: true, startTime: '06:00', endTime: '18:00' },
          wednesday: { available: true, startTime: '06:00', endTime: '18:00' },
          thursday: { available: true, startTime: '06:00', endTime: '18:00' },
          friday: { available: true, startTime: '06:00', endTime: '18:00' },
          saturday: { available: true, startTime: '08:00', endTime: '16:00' },
          sunday: { available: true, startTime: '08:00', endTime: '16:00' }
        },
        hourlyRate: 200,
        rating: 4.9,
        totalReviews: 67,
        bio: 'Senior nurse with extensive experience in post-surgical care and patient monitoring.',
        isVerified: true
      }
    ]);

    console.log('📋 Creating patient requests...');
    const requests = await PatientRequest.insertMany([
      // Completed request with reviews
      {
        patientId: patients[0]._id,
        nurseId: nurses[0]._id,
        title: 'Post-Surgery Wound Care',
        description: 'Need professional wound care after knee surgery. Dressing changes and monitoring required.',
        serviceType: 'wound_care',
        status: 'completed',
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444]
        },
        address: '123 Tahrir Square, Cairo, Egypt',
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        estimatedDuration: 2,
        urgencyLevel: 'high',
        specialRequirements: 'Sterile technique required, patient has diabetes',
        budget: 300,
        contactPhone: '+201111111111',
        notes: 'Patient is elderly and needs gentle care',
        acceptedAt: new Date('2024-01-10T08:00:00Z'),
        completedAt: new Date('2024-01-15T12:00:00Z'),
        nurseCompleted: true,
        nurseCompletedAt: new Date('2024-01-15T12:00:00Z'),
        patientCompleted: true,
        patientCompletedAt: new Date('2024-01-15T12:30:00Z')
      },
      // Pending request
      {
        patientId: patients[2]._id,
        title: 'Medication Administration',
        description: 'Need help with daily insulin injections and blood sugar monitoring.',
        serviceType: 'medication_administration',
        status: 'pending',
        location: {
          type: 'Point',
          coordinates: [31.2461, 30.0588]
        },
        address: '789 Korba Street, Heliopolis, Cairo, Egypt',
        scheduledDate: new Date('2024-01-25T08:00:00Z'),
        estimatedDuration: 1,
        urgencyLevel: 'high',
        specialRequirements: 'Diabetic patient, needs experienced nurse',
        budget: 200,
        contactPhone: '+201111111113',
        notes: 'Prefer morning appointments'
      }
    ]);

    console.log('📝 Creating applications...');
    const applications = await Application.insertMany([
      {
        requestId: requests[1]._id, // Pending request
        nurseId: nurses[0]._id,
        price: 180,
        estimatedTime: 1,
        status: 'pending'
      },
      {
        requestId: requests[1]._id, // Pending request
        nurseId: nurses[1]._id,
        price: 200,
        estimatedTime: 1.5,
        status: 'pending'
      }
    ]);

    console.log('⭐ Creating reviews...');
    const reviews = await Review.insertMany([
      // Patient reviewing nurse (user-to-user)
      {
        requestId: requests[0]._id,
        reviewerId: patients[0]._id,
        reviewerRole: 'patient',
        revieweeId: nurses[0]._id,
        reviewType: 'user_to_user',
        rating: 5,
        feedback: 'Dr. Amira was absolutely wonderful! Very professional, gentle, and knowledgeable. She took great care of my wound and explained everything clearly. Highly recommended!',
        submittedAt: new Date('2024-01-15T13:00:00Z')
      },
      // Nurse reviewing patient (user-to-user)
      {
        requestId: requests[0]._id,
        reviewerId: nurses[0]._id,
        reviewerRole: 'nurse',
        revieweeId: patients[0]._id,
        reviewType: 'user_to_user',
        rating: 5,
        feedback: 'Ahmed was a very cooperative patient. He followed all instructions carefully and was very respectful. Easy to work with.',
        submittedAt: new Date('2024-01-15T13:30:00Z')
      },
      // Service reviews
      {
        requestId: requests[0]._id,
        reviewerId: patients[0]._id,
        reviewerRole: 'patient',
        reviewType: 'service_review',
        rating: 5,
        feedback: 'Excellent service overall! The platform made it easy to find a qualified nurse, and the booking process was smooth.',
        submittedAt: new Date('2024-01-15T14:00:00Z')
      }
    ]);

    console.log('✅ Seed data created successfully!');
    console.log(`👑 Admin users: ${adminUsers.length}`);
    console.log(`🏥 Patients: ${patients.length}`);
    console.log(`👩‍⚕️ Nurses: ${nurses.length}`);
    console.log(`📋 Nurse profiles: ${nurseProfiles.length}`);
    console.log(`📋 Requests: ${requests.length}`);
    console.log(`📝 Applications: ${applications.length}`);
    console.log(`⭐ Reviews: ${reviews.length}`);

    console.log('\n📝 User credentials for testing:');
    console.log('='.repeat(50));
    console.log('ADMIN: admin@careconnect.com | password123');
    console.log('PATIENT: patient@gmail.com | password123');
    console.log('NURSE: nurse@gmail.com | password123');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed
seedDatabase()
  .then(() => {
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database seeding failed:', error);
    process.exit(1);
  });
