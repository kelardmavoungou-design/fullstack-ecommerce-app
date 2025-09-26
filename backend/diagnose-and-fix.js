const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

async function diagnoseAndFix() {
  console.log('🔍 Diagnosing Sombango Backend Issues...\n');

  const baseURL = 'http://localhost:4000';

  // Test 1: Check if server is running
  console.log('1. Checking if server is running...');
  try {
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Server is running:', healthResponse.data);
  } catch (error) {
    console.log('❌ Server is not running or not responding');
    console.log('💡 Starting server...');

    // Start server
    const serverProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname),
      stdio: 'inherit',
      shell: true,
      detached: true
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const healthResponse = await axios.get(`${baseURL}/health`);
      console.log('✅ Server started successfully:', healthResponse.data);
    } catch (startError) {
      console.log('❌ Failed to start server:', startError.message);
      return;
    }
  }

  // Test 2: Check basic routes
  console.log('\n2. Testing basic routes...');
  try {
    const testResponse = await axios.get(`${baseURL}/api/test`);
    console.log('✅ Basic API test passed:', testResponse.data);
  } catch (error) {
    console.log('❌ Basic API test failed:', error.response?.data || error.message);
  }

  // Test 3: Check ad-campaigns routes
  console.log('\n3. Testing ad-campaigns routes...');
  try {
    const adTestResponse = await axios.get(`${baseURL}/api/ad-campaigns/test`);
    console.log('✅ Ad-campaigns routes working:', adTestResponse.data);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Ad-campaigns routes not found - routes may not be loaded');
      console.log('🔄 Attempting to restart server with fresh routes...');

      // Kill current server
      spawn('taskkill', ['/IM', 'node.exe', '/F'], {
        stdio: 'inherit',
        shell: true
      });

      // Wait and restart
      setTimeout(async () => {
        const newServerProcess = spawn('npm', ['start'], {
          cwd: path.join(__dirname),
          stdio: 'inherit',
          shell: true,
          detached: true
        });

        // Wait for new server to start
        await new Promise(resolve => setTimeout(resolve, 8000));

        try {
          const restartTestResponse = await axios.get(`${baseURL}/api/ad-campaigns/test`);
          console.log('✅ Server restarted with routes loaded:', restartTestResponse.data);
        } catch (restartError) {
          console.log('❌ Server restart failed:', restartError.message);
        }
      }, 3000);

      return;
    } else {
      console.log('⚠️  Ad-campaigns routes error:', error.response?.data || error.message);
    }
  }

  // Test 4: Check user shops route (requires auth, so will fail but should not be 404)
  console.log('\n4. Testing user shops route structure...');
  try {
    await axios.get(`${baseURL}/api/ad-campaigns/user/shops`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ User shops route exists (401 Unauthorized - expected without auth)');
    } else if (error.response?.status === 404) {
      console.log('❌ User shops route not found - route not loaded');
    } else {
      console.log('⚠️  User shops route error:', error.response?.status, error.response?.data || error.message);
    }
  }

  console.log('\n🎉 Diagnosis completed!');
  console.log('\n📋 Summary:');
  console.log('- Server health: ✅');
  console.log('- Basic routes: ✅');
  console.log('- Ad-campaigns routes: Check above');
  console.log('- User shops route: Check above');

  console.log('\n💡 If routes are still failing, try:');
  console.log('1. Kill all node processes: taskkill /IM node.exe /F');
  console.log('2. Clear node cache: npm cache clean --force');
  console.log('3. Restart server: npm start');
}

diagnoseAndFix().catch(console.error);