const fs = require('fs');
const path = require('path');

// Create a test file to verify file serving
const uploadsDir = path.join(process.cwd(), 'uploads', 'nurse-documents');
const testFilePath = path.join(uploadsDir, 'test-file.txt');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Create test file
const testContent = 'This is a test file to verify static file serving is working correctly.';
fs.writeFileSync(testFilePath, testContent);

console.log('✅ Created test file:', testFilePath);
console.log('🔗 Test URL: http://localhost:3000/uploads/nurse-documents/test-file.txt');
console.log('🔗 Direct backend URL: http://localhost:3001/uploads/nurse-documents/test-file.txt');

// Also check if the problematic file exists
const problemFile = path.join(uploadsDir, 'backgroundCheckDocument-1752788165767-185311339.png');
if (fs.existsSync(problemFile)) {
  console.log('✅ Problem file exists on disk:', problemFile);
  const stats = fs.statSync(problemFile);
  console.log(`📏 File size: ${stats.size} bytes`);
} else {
  console.log('❌ Problem file does not exist on disk');
  
  // List all files in the directory
  const files = fs.readdirSync(uploadsDir);
  console.log(`📋 Files in uploads directory (${files.length}):`);
  files.forEach((file, i) => {
    console.log(`   ${i + 1}. ${file}`);
  });
}
