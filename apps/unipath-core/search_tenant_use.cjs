const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../../'); // Project root

function walk(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const filePath = path.join(currentDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.vercel' && file !== 'dist') {
        walk(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('activeTenant') || content.includes('tenant_id') || content.includes('TenantProvider')) {
          if (filePath.includes('nova') || filePath.includes('unitour') || filePath.includes('admin/Admin')) {
            console.log(`Found tenant ref in: ${filePath}`);
            const lines = content.split('\n');
            lines.forEach((line, i) => {
              if (line.includes('activeTenant') && (line.includes('.config') || line.includes('.settings'))) {
                console.log(`  Line ${i+1}: ${line.trim()}`);
              }
            });
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

walk(dir);
