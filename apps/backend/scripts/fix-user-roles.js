const mongoose = require('mongoose');
require('dotenv').config();

// User schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['patient', 'nurse', 'admin'], default: 'patient' },
  status: { type: String, enum: ['pending', 'verified', 'suspended'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

async function fixUserRoles() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);

    for (const user of users) {
      console.log(`User: ${user.email}, Role: ${user.role}, Status: ${user.status}, ID: ${user._id}`);
    }

    // Find users who might need role fixes
    const usersWithoutNurseRole = await User.find({ 
      email: { $regex: /nurse|@nurse|nursing/i },
      role: { $ne: 'nurse' }
    });

    if (usersWithoutNurseRole.length > 0) {
      console.log('\nFound users that might need nurse role:');
      for (const user of usersWithoutNurseRole) {
        console.log(`- ${user.email} (current role: ${user.role})`);
      }

      // Ask for confirmation (in a real scenario, you'd want manual confirmation)
      console.log('\nUpdating roles to nurse...');
      for (const user of usersWithoutNurseRole) {
        await User.findByIdAndUpdate(user._id, { role: 'nurse' });
        console.log(`Updated ${user.email} role to nurse`);
      }
    }

    // Also check for any users that should be nurses based on registration pattern
    const allUsers = await User.find({});
    console.log('\nAll users after potential fixes:');
    for (const user of allUsers) {
      console.log(`- ${user.email}: role=${user.role}, status=${user.status}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixUserRoles();
