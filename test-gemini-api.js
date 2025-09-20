// Simple script to test GEMINI API key
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config({ path: '.env.local' });

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Testing GEMINI API Key...');
  console.log(`API Key length: ${apiKey ? apiKey.length : 0}`);
  
  if (!apiKey) {
    console.log('❌ No API key found in environment variables');
    return;
  }
  
  try {
    const genAI = new GoogleGenAI({ apiKey });
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent("Say 'API KEY WORKING' if this works");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API Key is working!');
    console.log(`Response: ${text}`);
    
  } catch (error) {
    console.log('❌ API Key test failed:');
    console.log(error.message);
  }
}

testGeminiAPI();
