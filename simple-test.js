console.log('Testing Node.js');
console.log('Node version:', process.version);
console.log('Current directory:', __dirname);

// Try loading nodemailer
try {
  const nodemailer = require('nodemailer');
  console.log('Nodemailer loaded successfully, version:', nodemailer.version);
} catch (error) {
  console.error('Failed to load nodemailer:', error);
}

// Try loading dotenv
try {
  const dotenv = require('dotenv');
  console.log('Dotenv loaded successfully');
} catch (error) {
  console.error('Failed to load dotenv:', error);
}
