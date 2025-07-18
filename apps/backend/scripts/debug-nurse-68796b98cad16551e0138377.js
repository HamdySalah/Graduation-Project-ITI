const mongoose = require('mongoose');
require('dotenv').config();

async function debugSpecificNurse() {
  try {
    console.log('🔍 Debugging Nurse ID: 68796b98cad16551e0138377');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nurse-platform';
    console.log('📡 Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    const nurseId = '68796b98cad16551e0138377';
    
    // Check if this is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(nurseId)) {
      console.error('❌ Invalid ObjectId format');
      return;
    }

    console.log('\n1️⃣ Checking User Collection...');
    
    // Find the user by ID
    const user = await mongoose.connection.db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(nurseId) 
    });
    
    if (!user) {
      console.log('❌ User not found in users collection');
      
      // Check if any users exist
      const totalUsers = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`📊 Total users in database: ${totalUsers}`);
      
      // Show some sample user IDs
      const sampleUsers = await mongoose.connection.db.collection('users').find({}).limit(5).toArray();
      console.log('📋 Sample user IDs:');
      sampleUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u._id} - ${u.name} (${u.email}) - ${u.role}`);
      });
      
      return;
    }

    console.log('✅ User found:');
    console.log('   ID:', user._id.toString());
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Status:', user.status);
    console.log('   Phone:', user.phone);
    console.log('   Address:', user.address);
    console.log('   Created:', user.createdAt);

    if (user.role !== 'nurse') {
      console.log('❌ User is not a nurse, role is:', user.role);
      return;
    }

    console.log('\n2️⃣ Checking NurseProfile Collection...');
    
    // Find the nurse profile
    const nurseProfile = await mongoose.connection.db.collection('nurseprofiles').findOne({ 
      userId: new mongoose.Types.ObjectId(nurseId) 
    });
    
    if (!nurseProfile) {
      console.log('❌ Nurse profile not found in nurseprofiles collection');
      
      // Check if any nurse profiles exist
      const totalProfiles = await mongoose.connection.db.collection('nurseprofiles').countDocuments();
      console.log(`📊 Total nurse profiles in database: ${totalProfiles}`);
      
      // Show some sample profiles
      const sampleProfiles = await mongoose.connection.db.collection('nurseprofiles').find({}).limit(3).toArray();
      console.log('📋 Sample nurse profiles:');
      sampleProfiles.forEach((p, i) => {
        console.log(`   ${i + 1}. UserID: ${p.userId} - License: ${p.licenseNumber} - Status: ${p.completionStatus}`);
      });
      
      return;
    }

    console.log('✅ Nurse profile found:');
    console.log('   Profile ID:', nurseProfile._id.toString());
    console.log('   User ID:', nurseProfile.userId.toString());
    console.log('   Completion Status:', nurseProfile.completionStatus);
    console.log('   Step 1 Completed:', nurseProfile.step1Completed);
    console.log('   Step 2 Completed:', nurseProfile.step2Completed);
    console.log('   Step 3 Completed:', nurseProfile.step3Completed);
    console.log('   License Number:', nurseProfile.licenseNumber);
    console.log('   Full Name:', nurseProfile.fullName);
    console.log('   Email Address:', nurseProfile.emailAddress);
    console.log('   Years Experience:', nurseProfile.yearsOfExperience);
    console.log('   Specializations:', nurseProfile.specializations);
    console.log('   Submitted At:', nurseProfile.submittedAt);
    console.log('   Last Updated:', nurseProfile.lastUpdated);

    console.log('\n3️⃣ Testing API Response Structure...');
    
    // Simulate the API response structure
    const apiResponse = {
      success: true,
      message: 'Nurse details retrieved successfully',
      data: {
        // Basic user information
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        address: user.address,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        
        // Profile completion data
        fullName: nurseProfile.fullName,
        emailAddress: nurseProfile.emailAddress,
        step1Completed: nurseProfile.step1Completed,
        step1CompletedAt: nurseProfile.step1CompletedAt,
        
        licenseNumber: nurseProfile.licenseNumber,
        licenseExpirationDate: nurseProfile.licenseExpirationDate,
        licenseDocument: nurseProfile.licenseDocument,
        backgroundCheckDocument: nurseProfile.backgroundCheckDocument,
        resumeDocument: nurseProfile.resumeDocument,
        step2Completed: nurseProfile.step2Completed,
        step2CompletedAt: nurseProfile.step2CompletedAt,
        
        certificationName: nurseProfile.certificationName,
        issuingOrganization: nurseProfile.issuingOrganization,
        certificationLicenseNumber: nurseProfile.certificationLicenseNumber,
        certificationExpirationDate: nurseProfile.certificationExpirationDate,
        skills: nurseProfile.skills,
        workExperience: nurseProfile.workExperience,
        institutionName: nurseProfile.institutionName,
        degree: nurseProfile.degree,
        graduationDate: nurseProfile.graduationDate,
        additionalDocuments: nurseProfile.additionalDocuments,
        step3Completed: nurseProfile.step3Completed,
        step3CompletedAt: nurseProfile.step3CompletedAt,
        
        yearsOfExperience: nurseProfile.yearsOfExperience,
        specializations: nurseProfile.specializations,
        education: nurseProfile.education,
        certifications: nurseProfile.certifications,
        rating: nurseProfile.rating,
        totalReviews: nurseProfile.totalReviews,
        completedJobs: nurseProfile.completedJobs,
        isAvailable: nurseProfile.isAvailable,
        hourlyRate: nurseProfile.hourlyRate,
        bio: nurseProfile.bio,
        languages: nurseProfile.languages,
        
        completionStatus: nurseProfile.completionStatus,
        submittedAt: nurseProfile.submittedAt,
        adminNotes: nurseProfile.adminNotes,
        rejectionReason: nurseProfile.rejectionReason,
        lastUpdated: nurseProfile.lastUpdated,
      }
    };

    console.log('📊 Complete API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n4️⃣ Checking Document Fields...');
    if (nurseProfile.licenseDocument) {
      console.log('📄 License Document:', nurseProfile.licenseDocument);
    } else {
      console.log('❌ No license document found');
    }
    
    if (nurseProfile.backgroundCheckDocument) {
      console.log('📄 Background Check Document:', nurseProfile.backgroundCheckDocument);
    } else {
      console.log('❌ No background check document found');
    }
    
    if (nurseProfile.resumeDocument) {
      console.log('📄 Resume Document:', nurseProfile.resumeDocument);
    } else {
      console.log('❌ No resume document found');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

debugSpecificNurse();
