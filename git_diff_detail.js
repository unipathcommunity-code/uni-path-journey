const fs = require('fs');
const path = require('path');

const mainDir = 'C:/uni-path-journey-main';
const scratchDir = 'C:/Users/user/.gemini/antigravity/scratch/uni-path-journey-main';

const filesToCompare = [
  'packages/tenant/src/TenantProvider.tsx',
  'apps/unipath-core/src/App.tsx',
  'apps/unipath-core/src/hooks/useUserRole.ts',
  'apps/unipath-core/src/pages/DashboardRedirect.tsx',
  'apps/unipath-core/src/pages/Systematize.tsx',
  'apps/unipath-core/src/pages/admin/AdminDashboardPage.tsx',
  'apps/unipath-core/src/pages/admin/AdminTour.tsx',
  'apps/unipath-core/src/pages/admin/AdminManufacturing.tsx',
  'apps/unipath-core/src/pages/superadmin/SuperAdminDashboard.tsx',
  'packages/tenant/src/verticals.ts',
  'packages/tenant/src/BranchSwitcher.tsx'
];

function diffLines(file) {
  const mainPath = path.join(mainDir, file);
  const scratchPath = path.join(scratchDir, file);
  
  if (!fs.existsSync(mainPath)) {
    console.log(`\n--- File: ${file} (Does not exist in Main) ---`);
    return;
  }
  if (!fs.existsSync(scratchPath)) {
    console.log(`\n--- File: ${file} (Does not exist in Scratch) ---`);
    return;
  }
  
  const mainContent = fs.readFileSync(mainPath, 'utf8');
  const scratchContent = fs.readFileSync(scratchPath, 'utf8');
  
  if (mainContent === scratchContent) {
    console.log(`\n--- File: ${file} (Identical) ---`);
    return;
  }
  
  console.log(`\n=== Diff for ${file} (Main vs Scratch) ===`);
  const mainLines = mainContent.split('\n');
  const scratchLines = scratchContent.split('\n');
  
  // Simple diff presentation: print blocks where they differ
  let i = 0, j = 0;
  while (i < mainLines.length || j < scratchLines.length) {
    if (mainLines[i] !== scratchLines[j]) {
      console.log(`Diff at line ${i+1}:`);
      console.log(`- Main:    ${mainLines[i] || '<EOF>'}`);
      console.log(`+ Scratch: ${scratchLines[j] || '<EOF>'}`);
      
      // skip ahead a bit to sync or just break to keep output readable
      let foundSync = false;
      for (let offset = 1; offset < 10; offset++) {
        if (mainLines[i + offset] === scratchLines[j + offset]) {
          i += offset;
          j += offset;
          foundSync = true;
          break;
        }
      }
      if (!foundSync) {
        i++;
        j++;
      }
    } else {
      i++;
      j++;
    }
  }
}

function main() {
  for (const file of filesToCompare) {
    diffLines(file);
  }
}

main();
