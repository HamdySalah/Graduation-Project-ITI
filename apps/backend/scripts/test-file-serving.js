const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testFileServing() {
  try {
    console.log('🔍 Testing File Serving...');
    
    // Test the problematic file URL
    const testUrl = 'http://localhost:3001/api/uploads/nurse-documents/backgroundCheckDocument-1752788165767-185311339.png';
    console.log('📡 Testing URL:', testUrl);
    
    const response = await fetch(testUrl);
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ File serving is working!');
      console.log('📄 Content-Type:', response.headers.get('content-type'));
      console.log('📏 Content-Length:', response.headers.get('content-length'));
    } else {
      console.log('❌ File serving failed');
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
    }
    
    // Also test if the file exists on disk
    const uploadsPath = path.join(process.cwd(), 'uploads', 'nurse-documents');
    console.log('\n📁 Checking uploads directory:', uploadsPath);
    
    if (fs.existsSync(uploadsPath)) {
      console.log('✅ Uploads directory exists');
      const files = fs.readdirSync(uploadsPath);
      console.log(`📋 Found ${files.length} files:`);
      files.forEach((file, i) => {
        console.log(`   ${i + 1}. ${file}`);
      });
      
      // Check if the specific file exists
      const targetFile = 'backgroundCheckDocument-1752788165767-185311339.png';
      if (files.includes(targetFile)) {
        console.log(`✅ Target file ${targetFile} exists on disk`);
        const filePath = path.join(uploadsPath, targetFile);
        const stats = fs.statSync(filePath);
        console.log(`📏 File size: ${stats.size} bytes`);
      } else {
        console.log(`❌ Target file ${targetFile} not found on disk`);
      }
    } else {
      console.log('❌ Uploads directory does not exist');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running on port 3001');
      console.log('💡 Try starting it with: npm run dev:backend');
    }
  }
}

testFileServing();
