const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testImageUpload() {
  try {
    console.log('🧪 Testing Image Upload Endpoint...');
    
    // First test the test endpoint
    console.log('📡 Testing upload test endpoint...');
    const testResponse = await fetch('http://localhost:3001/api/uploads/test', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('📊 Test Response Status:', testResponse.status);
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Test endpoint response:', testData);
    } else {
      const errorText = await testResponse.text();
      console.error('❌ Test endpoint error:', errorText);
    }
    
    // Create a simple test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Write test image to temporary file
    const testImagePath = 'test-image.png';
    fs.writeFileSync(testImagePath, testImageBuffer);
    
    console.log('📡 Testing image upload...');
    
    // Create form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    const uploadResponse = await fetch('http://localhost:3001/api/uploads/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('📊 Upload Response Status:', uploadResponse.status);
    
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Upload successful:', uploadData);
    } else {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload error:', errorText);
    }
    
    // Clean up test file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImageUpload();
