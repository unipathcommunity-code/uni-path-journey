const fs = require('fs');
const path = require('path');

const mainDir = 'C:/uni-path-journey-main';
const scratchDir = 'C:/Users/user/.gemini/antigravity/scratch/uni-path-journey-main';

const skippedFiles = new Set([
  'packages/tenant/src/TenantProvider.tsx',
  'apps/unipath-core/src/components/ProtectedRoute.tsx',
  'apps/unipath-core/src/pages/DashboardRedirect.tsx',
  'apps/unipath-core/src/hooks/useUserRole.ts',
  'apps/unipath-core/src/App.tsx',
  'scripts/push_to_github.js'
]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function merge(dir) {
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
      merge(fullPath);
    } else {
      if (skippedFiles.has(relativeFilePath)) {
        console.log(`Skipping protected file: ${relativeFilePath}`);
        continue;
      }
      
      const mainPath = path.join(mainDir, relativeFilePath);
      ensureDir(path.dirname(mainPath));
      fs.copyFileSync(fullPath, mainPath);
      console.log(`Copied: ${relativeFilePath}`);
    }
  }
}

console.log('--- Starting Merge of Claude\'s Work ---');
merge(scratchDir);
console.log('--- Merge Complete ---');
