const { spawn } = require('child_process');
const path = require('path');

console.log('Starting servers...');

const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname),
  shell: true,
  stdio: 'inherit'
});

setTimeout(() => {
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    shell: true,
    stdio: 'inherit'
  });
}, 2000);

console.log('Servers started. Open http://localhost:5173');
