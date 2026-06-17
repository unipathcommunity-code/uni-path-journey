const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\user\\.gemini\\antigravity\\scratch\\uni-path-journey-main\\apps\\unipath-core\\src\\pages\\superadmin\\SuperAdminDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('impersonat') || line.toLowerCase().includes('active_tenant') || line.toLowerCase().includes('login') || line.toLowerCase().includes('tenant_id')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
