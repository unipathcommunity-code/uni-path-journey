const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\uni-path-journey-main';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== '.next' && f !== 'dist') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const matches = [];

walkDir(projectRoot, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.json') || filePath.endsWith('.js')) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.toLowerCase().includes('unitour')) {
        matches.push(filePath);
      }
    } catch (e) {
      // ignore
    }
  }
});

console.log("Files containing 'unitour':");
matches.forEach(m => console.log("- " + path.relative(projectRoot, m)));
