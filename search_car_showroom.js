const fs = require('fs');
const path = require('path');

const scratchDir = 'C:/Users/user/.gemini/antigravity/scratch/uni-path-journey-main';

const matchedFiles = [];

function search(dir) {
  const relPath = path.relative(scratchDir, dir).replace(/\\/g, '/');
  if (relPath.includes('node_modules') || relPath.includes('.git') || relPath.includes('dist') || relPath.includes('.vercel') || relPath.includes('.gemini') || relPath.includes('scratch')) {
    return;
  }
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativeFilePath = path.relative(scratchDir, fullPath).replace(/\\/g, '/');
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      search(fullPath);
    } else {
      if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.css') || item.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('car_showroom') || content.includes('CarShowroom')) {
          matchedFiles.push(relativeFilePath);
        }
      }
    }
  }
}

search(scratchDir);
console.log('Files containing car_showroom or CarShowroom in Scratch Workspace:');
console.log(matchedFiles);
