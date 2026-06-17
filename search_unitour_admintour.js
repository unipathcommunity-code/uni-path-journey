const fs = require('fs');

const filePath = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\uni-path-journey-main\\apps\\unipath-core\\src\\contexts\\AppContext.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Matches in AppContext.tsx:");
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('unitour')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
