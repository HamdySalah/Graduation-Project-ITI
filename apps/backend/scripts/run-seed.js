const { execSync } = require('child_process');
const path = require('path');

console.log('🌱 Running comprehensive database seed...');
console.log('This will create admin users, patients, nurses, requests, and reviews.');
console.log('');

try {
  // Change to backend directory
  const backendDir = path.join(__dirname, '..');
  process.chdir(backendDir);
  
  // Run the TypeScript seed file
  console.log('📦 Compiling and running seed...');
  execSync('npx ts-node src/seeds/comprehensive-seed.ts', { 
    stdio: 'inherit',
    cwd: backendDir
  });
  
  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('You can now login with any of the accounts shown above.');
  console.log('Visit http://localhost:3000 to test the application.');
  
} catch (error) {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
}
