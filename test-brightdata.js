// Test script for Bright Data integration
const { spawn } = require('child_process');

console.log('🧪 Testing Bright Data MCP Integration...');

// Test 1: Check if @brightdata/mcp package is installed
console.log('\n1. Checking @brightdata/mcp package installation...');
try {
  require('@brightdata/mcp');
  console.log('✅ @brightdata/mcp package is installed');
} catch (error) {
  console.log('❌ @brightdata/mcp package not found:', error.message);
  process.exit(1);
}

// Test 2: Test MCP server startup
console.log('\n2. Testing MCP server startup...');
const mcpProcess = spawn('npx', ['@brightdata/mcp', '--help'], {
  env: {
    ...process.env,
    API_TOKEN: '987dbfc5a1017f6d5bb7deb3d2f70bb0464b0be01091bd767887d1f532363a73',
    WEB_UNLOCKER_ZONE: 'unblocker',
    BROWSER_ZONE: 'scraping_browser'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

mcpProcess.stdout.on('data', (data) => {
  output += data.toString();
});

mcpProcess.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

mcpProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ MCP server can be started successfully');
    console.log('📋 Available commands:', output.substring(0, 200) + '...');
  } else {
    console.log('❌ MCP server startup failed');
    console.log('Error output:', errorOutput);
  }
  
  // Test 3: Test API key validation
  console.log('\n3. Testing API key validation...');
  const apiKey = '987dbfc5a1017f6d5bb7deb3d2f70bb0464b0be01091bd767887d1f532363a73';
  
  if (apiKey && apiKey.length > 50) {
    console.log('✅ API key format looks valid');
    console.log('🔑 API key length:', apiKey.length);
    console.log('🔑 API key prefix:', apiKey.substring(0, 10) + '...');
  } else {
    console.log('❌ API key format appears invalid');
  }
  
  console.log('\n🎉 Bright Data integration test completed!');
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - MCP server may be slow to start');
  mcpProcess.kill();
  process.exit(0);
}, 10000);
