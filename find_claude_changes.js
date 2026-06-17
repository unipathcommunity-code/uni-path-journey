const fs = require('fs');
const path = require('path');

const mainDir = 'C:/uni-path-journey-main';
const scratchDir = 'C:/Users/user/.gemini/antigravity/scratch/uni-path-journey-main';

const changedFiles = [];
const newFiles = [];

function scan(dir) {
  const relPath = path.relative(scratchDir, dir).replace(/\\/g, '/');
  
  // Ignore directories we don't care about
  if (relPath.includes('node_modules') || relPath.includes('.git') || relPath.includes('dist') || relPath.includes('.vercel') || relPath.includes('.gemini') || relPath.includes('scratch')) {
    return;
  }
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativeFilePath = path.relative(scratchDir, fullPath).replace(/\\/g, '/');
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scan(fullPath);
    } else {
      const mainPath = path.join(mainDir, relativeFilePath);
      if (!fs.existsSync(mainPath)) {
        newFiles.push(relativeFilePath);
      } else {
        const scratchContent = fs.readFileSync(fullPath);
        const mainContent = fs.readFileSync(mainPath);
        if (!scratchContent.equals(mainContent)) {
          changedFiles.push(relativeFilePath);
        }
      }
    }
  }
}

console.log('Scanning Scratch Workspace for changes against Main Workspace...');
scan(scratchDir);

console.log('\n--- NEW FILES IN SCRATCH ---');
console.log(newFiles);

console.log('\n--- MODIFIED FILES IN SCRATCH ---');
console.log(changedFiles);
