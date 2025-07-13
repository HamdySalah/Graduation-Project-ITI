// test-mail.js
// This file is used to verify email configuration settings

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
const envPath = path.join(__dirname, 'apps/backend/.env');
console.log('Loading .env from:', envPath);
console.log('File exists:', fs.existsSync(envPath));

try {
  require('dotenv').config({ path: envPath });
} catch (error) {
  console.error('Error loading .env file:', error);
  process.exit(1);
}

// Log loaded environment variables (without showing password)
console.log('Environment variables loaded:');
console.log('MAIL_HOST:', process.env.MAIL_HOST);
console.log('MAIL_USER:', process.env.MAIL_USER);
console.log('MAIL_PASSWORD:', process.env.MAIL_PASSWORD ? '******' : 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

async function testEmailConfig() {
  console.log('\nStarting email configuration test...');
  
  // Create SMTP transporter
  const transportConfig = {
    host: process.env.MAIL_HOST,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true // Enable debug output
  };
  
  console.log('SMTP Configuration:', JSON.stringify(transportConfig, null, 2).replace(process.env.MAIL_PASSWORD, '*****'));
  
  const transporter = nodemailer.createTransport(transportConfig);
  
  try {
    // Verify connection
    console.log('Verifying connection to mail server...');
    const connection = await transporter.verify();
    console.log('Connection successful:', connection);
    
    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Nurse Platform Test" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER, // Send to same address for testing
      subject: 'Email Configuration Test',
      text: 'This is a test message to verify email configuration',
      html: '<b>This is a test message</b> to verify email configuration'
    });
    
    console.log('Message sent successfully!');
    console.log('Message ID:', info.messageId);
    
    if (info.messageId) {
      return true;
    } else {
      console.log('No message ID returned, sending might have failed');
      return false;
    }
  } catch (error) {
    console.error('Error during email testing:');
    console.error(error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.command) {
      console.error('Failed command:', error.command);
    }
    return false;
  }
}

testEmailConfig()
  .then(result => {
    if (result) {
      console.log('\nEmail configuration test completed successfully!');
    } else {
      console.log('\nEmail configuration test failed!');
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
