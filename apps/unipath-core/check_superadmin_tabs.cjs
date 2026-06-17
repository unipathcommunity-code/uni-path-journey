const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\user\\.gemini\\antigravity\\scratch\\uni-path-journey-main\\apps\\unipath-core\\src\\pages\\superadmin\\SuperAdminDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('<Tabs') || line.includes('<TabsContent') || line.includes('TabsTrigger') || line.includes('Global Tariflar') || line.includes('pricing_plans')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
