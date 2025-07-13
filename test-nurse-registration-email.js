// test-nurse-registration-email.js
// Test script to verify nurse registration email functionality

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, 'apps/backend/.env');
try {
  require('dotenv').config({ path: envPath });
} catch (error) {
  console.error('Error loading .env file:', error);
  process.exit(1);
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function testNurseRegistration() {
  console.log('🧪 Testing Nurse Registration with Email...\n');
  
  // Use a unique email with timestamp to avoid conflicts
  const timestamp = Date.now();
  const testEmail = `test-nurse-${timestamp}@gmail.com`;
  
  const testNurseData = {
    name: 'Test Nurse Email',
    email: testEmail,
    password: 'test123456',
    phone: '+201234567890',
    role: 'nurse',
    coordinates: [31.233, 30.033],
    address: 'Test Address, Cairo, Egypt',
    licenseNumber: `TEST${timestamp}`,
    yearsOfExperience: 5,
    specializations: ['general', 'pediatric'],
    education: 'Bachelor of Nursing, Test University',
    certifications: ['CPR Certified', 'First Aid'],
    hourlyRate: 50,
    bio: 'Test nurse for email verification',
    languages: ['Arabic', 'English']
  };

  try {
    console.log('📝 Registering test nurse...');
    console.log('Test data:', JSON.stringify(testNurseData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, testNurseData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registration successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.user) {
      console.log('\n👩‍⚕️ Nurse registered successfully:');
      console.log('ID:', response.data.data.user.id);
      console.log('Name:', response.data.data.user.name);
      console.log('Email:', response.data.data.user.email);
      console.log('Role:', response.data.data.user.role);
      console.log('Status:', response.data.data.user.status);
      
      console.log('\n📧 Email should have been sent to:', testNurseData.email);
      console.log('Please check the email inbox for the welcome message.');
      console.log('Also check spam/junk folder if not found in inbox.');
    }

  } catch (error) {
    console.error('❌ Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testEmailConfiguration() {
  console.log('\n🔧 Testing Email Configuration...\n');
  
  console.log('Email Configuration:');
  console.log('MAIL_HOST:', process.env.MAIL_HOST);
  console.log('MAIL_USER:', process.env.MAIL_USER);
  console.log('MAIL_PASSWORD:', process.env.MAIL_PASSWORD ? '******' : 'NOT SET');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
    console.error('❌ Email configuration is incomplete!');
    console.error('Please set MAIL_HOST, MAIL_USER, and MAIL_PASSWORD in your .env file.');
    return false;
  }
  
  console.log('✅ Email configuration appears to be set up correctly.');
  return true;
}

async function main() {
  console.log('🚀 Starting Nurse Registration Email Test\n');
  
  // First test email configuration
  const emailConfigOk = await testEmailConfiguration();
  
  if (!emailConfigOk) {
    console.log('\n❌ Cannot proceed with registration test due to email configuration issues.');
    return;
  }
  
  // Then test nurse registration
  await testNurseRegistration();
  
  console.log('\n✅ Test completed!');
  console.log('\n📋 Summary:');
  console.log('1. Email configuration checked');
  console.log('2. Nurse registration tested');
  console.log('3. Welcome email should have been sent');
  console.log('\n💡 If you didn\'t receive an email, check:');
  console.log('   - Email configuration in .env file');
  console.log('   - SMTP server settings');
  console.log('   - Spam/junk folder');
  console.log('   - Gmail app password settings');
}

main().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
}); 