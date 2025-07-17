const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Nurse Platform Backend Server...');
console.log('📁 Working directory:', process.cwd());

// Load environment variables
require('dotenv').config();

console.log('🔧 Environment check:');
console.log('  - MongoDB URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('  - JWT Secret:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('  - Port:', process.env.PORT || '3001');

// Start the server
try {
  console.log('\n🏗️  Building backend...');
  
  // Build first
  const buildProcess = spawn('npx', ['nx', 'build', 'backend'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });

  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build successful!');
      console.log('\n🚀 Starting server...');
      
      // Start the server
      const serverProcess = spawn('node', ['dist/main.js'], {
        stdio: 'inherit',
        shell: true,
        cwd: __dirname
      });

      serverProcess.on('close', (code) => {
        console.log(`\n❌ Server process exited with code ${code}`);
      });

      serverProcess.on('error', (error) => {
        console.error('❌ Server error:', error);
      });

    } else {
      console.error('❌ Build failed with code:', code);
    }
  });

  buildProcess.on('error', (error) => {
    console.error('❌ Build error:', error);
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
}
