const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting Sombango Backend Server...\n');

// Kill any existing node processes
console.log('1. Stopping existing server processes...');
const killProcess = spawn('taskkill', ['/IM', 'node.exe', '/F'], {
  stdio: 'inherit',
  shell: true
});

killProcess.on('close', (code) => {
  console.log(`✅ Processes stopped (exit code: ${code})`);

  // Wait a moment before starting new server
  setTimeout(() => {
    console.log('\n2. Starting new server instance...');

    // Start the server
    const serverProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname),
      stdio: 'inherit',
      shell: true
    });

    serverProcess.on('close', (code) => {
      console.log(`\n🏁 Server process exited with code: ${code}`);
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Error starting server:', error);
    });

    // Give server time to start
    setTimeout(() => {
      console.log('\n🎉 Server restart completed!');
      console.log('📡 Backend should be running on http://localhost:4000');
      console.log('📖 API docs: http://localhost:4000/api-docs');
      process.exit(0);
    }, 3000);

  }, 2000);
});

killProcess.on('error', (error) => {
  console.log('⚠️  No existing processes to kill or error:', error.message);
  console.log('2. Starting server directly...');

  // Start server anyway
  const serverProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname),
    stdio: 'inherit',
    shell: true
  });

  setTimeout(() => {
    console.log('\n🎉 Server start completed!');
    console.log('📡 Backend running on http://localhost:4000');
    console.log('📖 API docs: http://localhost:4000/api-docs');
    process.exit(0);
  }, 3000);
});