const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database for nurse ID: 68796b98cad16551e0138377');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/nurse-platform');
    console.log('✅ Connected to database');

    const nurseId = '68796b98cad16551e0138377';
    
    // Check users collection
    console.log('\n1️⃣ Checking users collection...');
    const user = await mongoose.connection.db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(nurseId) 
    });
    
    if (user) {
      console.log('✅ User found:');
      console.log('   Name:', user.name);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Status:', user.status);
    } else {
      console.log('❌ User not found');
      
      // Show all nurses
      const allNurses = await mongoose.connection.db.collection('users').find({ role: 'nurse' }).toArray();
      console.log(`📊 Found ${allNurses.length} nurses in database:`);
      allNurses.forEach((nurse, i) => {
        console.log(`   ${i + 1}. ${nurse._id} - ${nurse.name} (${nurse.email})`);
      });
    }
    
    // Check nurse profiles collection
    console.log('\n2️⃣ Checking nurseprofiles collection...');
    const profile = await mongoose.connection.db.collection('nurseprofiles').findOne({ 
      userId: new mongoose.Types.ObjectId(nurseId) 
    });
    
    if (profile) {
      console.log('✅ Nurse profile found:');
      console.log('   Completion Status:', profile.completionStatus);
      console.log('   License Number:', profile.licenseNumber);
      console.log('   Step 1:', profile.step1Completed);
      console.log('   Step 2:', profile.step2Completed);
      console.log('   Step 3:', profile.step3Completed);
    } else {
      console.log('❌ Nurse profile not found');
      
      // Show all profiles
      const allProfiles = await mongoose.connection.db.collection('nurseprofiles').find({}).toArray();
      console.log(`📊 Found ${allProfiles.length} nurse profiles in database:`);
      allProfiles.forEach((prof, i) => {
        console.log(`   ${i + 1}. UserID: ${prof.userId} - Status: ${prof.completionStatus}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

checkDatabase();
