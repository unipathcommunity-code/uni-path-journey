const fs = require('fs');
const path = require('path');

const searchRoot = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\uni-path-journey-main\\apps\\unipath-core\\src';
const query = 'pricing_plans';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        searchDir(fullPath);
      }
    } else {
      const ext = path.extname(file);
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.html'].includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(query)) {
          console.log(`Found in: ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes(query)) {
              console.log(`  Line ${index + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }
  }
}

searchDir(searchRoot);
