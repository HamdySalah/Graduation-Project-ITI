const mongoose = require('mongoose');
require('dotenv').config();

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: { type: String, enum: ['patient', 'nurse', 'admin'], default: 'patient' },
  status: { type: String, enum: ['pending', 'verified', 'suspended'], default: 'pending' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: String,
  profileImage: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Nurse Profile schema
const nurseProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Profile completion tracking
  completionStatus: {
    type: String,
    enum: ['not_started', 'step_1_completed', 'step_2_completed', 'step_3_completed', 'submitted', 'approved', 'rejected'],
    default: 'not_started'
  },
  lastUpdated: { type: Date, default: Date.now },
  
  // Step 1: Basic Information
  fullName: String,
  emailAddress: String,
  step1Completed: { type: Boolean, default: false },
  step1CompletedAt: Date,
  
  // Step 2: Verification Documents
  licenseNumber: String,
  licenseExpirationDate: Date,
  licenseDocument: {
    fileName: String,
    originalName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  },
  backgroundCheckDocument: {
    fileName: String,
    originalName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  },
  resumeDocument: {
    fileName: String,
    originalName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  },
  step2Completed: { type: Boolean, default: false },
  step2CompletedAt: Date,
  
  // Step 3: Complete Profile
  certificationName: String,
  issuingOrganization: String,
  certificationLicenseNumber: String,
  certificationExpirationDate: Date,
  skills: [String],
  workExperience: String,
  institutionName: String,
  degree: String,
  graduationDate: Date,
  additionalDocuments: [{
    fileName: String,
    originalName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    documentType: String
  }],
  step3Completed: { type: Boolean, default: false },
  step3CompletedAt: Date,
  
  // Legacy fields
  yearsOfExperience: Number,
  specializations: [String],
  education: String,
  certifications: [String],
  documents: [String],
  rating: { type: Number, min: 0, max: 5, default: 0 },
  totalReviews: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  hourlyRate: Number,
  bio: String,
  languages: [String],
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Profile submission tracking
  submittedAt: Date,
  adminNotes: String,
  rejectionReason: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const NurseProfile = mongoose.model('NurseProfile', nurseProfileSchema);

async function testNurseData() {
  try {
    console.log('🔍 Testing Nurse Data Structure...');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/nurse-platform');
    console.log('✅ Connected to database');

    // Find all nurses
    const nurses = await User.find({ role: 'nurse' }).select('-password');
    console.log(`👥 Found ${nurses.length} nurses in database`);

    if (nurses.length === 0) {
      console.log('❌ No nurses found in database');
      return;
    }

    // Get nurse profiles
    const nurseIds = nurses.map(nurse => nurse._id);
    const nurseProfiles = await NurseProfile.find({ userId: { $in: nurseIds } });
    console.log(`📋 Found ${nurseProfiles.length} nurse profiles`);

    // Test the data structure for each nurse
    for (let i = 0; i < Math.min(nurses.length, 3); i++) {
      const nurse = nurses[i];
      const profile = nurseProfiles.find(p => p.userId.toString() === nurse._id.toString());
      
      console.log(`\n👤 Nurse ${i + 1}: ${nurse.name} (${nurse.email})`);
      console.log('   Status:', nurse.status);
      console.log('   Role:', nurse.role);
      console.log('   Created:', nurse.createdAt);
      
      if (profile) {
        console.log('   Profile Status:', profile.completionStatus);
        console.log('   Step 1:', profile.step1Completed ? '✅' : '❌');
        console.log('   Step 2:', profile.step2Completed ? '✅' : '❌');
        console.log('   Step 3:', profile.step3Completed ? '✅' : '❌');
        console.log('   License:', profile.licenseNumber || 'Not set');
        console.log('   Experience:', profile.yearsOfExperience || 0, 'years');
        console.log('   Specializations:', profile.specializations || []);
        
        if (profile.licenseDocument) {
          console.log('   License Doc:', profile.licenseDocument.originalName);
        }
        if (profile.backgroundCheckDocument) {
          console.log('    Experience or Recommendation:', profile.backgroundCheckDocument.originalName);
        }
        if (profile.resumeDocument) {
          console.log('   Resume:', profile.resumeDocument.originalName);
        }
      } else {
        console.log('   ❌ No profile found');
      }
    }

    // Test the API endpoint structure
    console.log('\n🔧 Testing API endpoint structure...');
    
    const testNurse = nurses[0];
    const testProfile = nurseProfiles.find(p => p.userId.toString() === testNurse._id.toString());
    
    const apiResponse = {
      id: testNurse._id.toString(),
      name: testNurse.name,
      email: testNurse.email,
      phone: testNurse.phone,
      status: testNurse.status,
      address: testNurse.address,
      location: testNurse.location,
      createdAt: testNurse.createdAt,
      
      ...(testProfile && {
        fullName: testProfile.fullName,
        licenseNumber: testProfile.licenseNumber,
        completionStatus: testProfile.completionStatus,
        step1Completed: testProfile.step1Completed,
        step2Completed: testProfile.step2Completed,
        step3Completed: testProfile.step3Completed,
        licenseDocument: testProfile.licenseDocument,
        backgroundCheckDocument: testProfile.backgroundCheckDocument,
        resumeDocument: testProfile.resumeDocument,
        yearsOfExperience: testProfile.yearsOfExperience,
        specializations: testProfile.specializations,
        skills: testProfile.skills,
        workExperience: testProfile.workExperience,
        adminNotes: testProfile.adminNotes,
        rejectionReason: testProfile.rejectionReason,
      })
    };
    
    console.log('📊 Sample API Response Structure:');
    console.log(JSON.stringify(apiResponse, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testNurseData();
