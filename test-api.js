// test-api.js
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUploadAPI() {
  try {
    console.log('Testing upload API...');
    
    // Create a simple test image buffer
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    const form = new FormData();
    form.append('file', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    form.append('folder', 'test');

    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: form,
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);

    if (response.ok) {
      console.log('Upload API is working!');
    } else {
      console.error('Upload API failed');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUploadAPI();
