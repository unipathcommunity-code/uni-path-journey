const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\user\\.gemini\\antigravity\\scratch\\uni-path-journey-main\\apps\\unipath-core\\src\\App.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('SuperAdminDashboard')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
