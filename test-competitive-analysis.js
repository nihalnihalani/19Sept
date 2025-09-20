// Simple test script to test competitive analysis
const fs = require('fs');
const path = require('path');

async function testCompetitiveAnalysis() {
  console.log('🧪 Testing competitive analysis...');
  
  try {
    // Test if the image file exists
    const imagePath = '/Users/nihalnihalani/Downloads/male-nike-sneakers-qvGW4n4-600.jpg';
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Image file not found:', imagePath);
      return;
    }
    
    console.log('✅ Image file exists');
    
    // Test the API endpoint
    const FormData = require('form-data');
    const fetch = require('node-fetch');
    
    const form = new FormData();
    form.append('imageFile', fs.createReadStream(imagePath));
    
    console.log('🚀 Sending request to competitive analysis API...');
    
    const response = await fetch('http://localhost:3000/api/competitive-analysis', {
      method: 'POST',
      body: form,
      timeout: 30000 // 30 second timeout
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Competitive analysis successful!');
      console.log('📊 Result:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testCompetitiveAnalysis();
