const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/user/.gemini/antigravity/brain/30f5ad31-6aea-462a-9530-571323d424c2/scratch/diff_output_utf8.txt';
const content = fs.readFileSync(filePath, 'utf8');

const sections = content.split('=== Diff for ');

function showSection(pattern) {
  const sec = sections.find(s => s.startsWith(pattern));
  if (sec) {
    console.log(`\n=== Diff for ${pattern} ===`);
    // Print the first 100 lines of the diff
    const lines = sec.split('\n');
    console.log(lines.slice(1, 120).join('\n'));
    if (lines.length > 120) {
      console.log(`... and ${lines.length - 120} more lines`);
    }
  } else {
    console.log(`\nNo diff found for pattern: ${pattern}`);
  }
}

// Show diffs for key files
showSection('apps/unipath-core/src/App.tsx');
showSection('apps/unipath-core/src/hooks/useUserRole.ts');
showSection('apps/unipath-core/src/pages/DashboardRedirect.tsx');
showSection('packages/tenant/src/verticals.ts');
