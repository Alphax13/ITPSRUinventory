// Test Cloudinary connection
import { getCloudinary } from '../src/lib/cloudinary.js';

async function testCloudinary() {
  try {
    console.log('Testing Cloudinary connection...');
    
    const cloudinary = await getCloudinary();
    console.log('Cloudinary config loaded successfully');
    
    // Test API call
    const result = await cloudinary.api.ping();
    console.log('API Ping result:', result);
    
    console.log('Cloudinary is working correctly!');
  } catch (error) {
    console.error('Cloudinary test failed:', error);
  }
}

testCloudinary();
