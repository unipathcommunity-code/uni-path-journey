const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../../'); // Project root

const targetKeys = [
  'commissionRate',
  'coinMultiplier',
  'gdsEnabled',
  'smsProvider',
  'baseApr',
  'testDriveLimit',
  'universitySync',
  'unipath_tenant_configs'
];

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
        targetKeys.forEach(key => {
          if (content.includes(key)) {
            console.log(`Found "${key}" in file: ${filePath}`);
            const lines = content.split('\n');
            lines.forEach((line, i) => {
              if (line.includes(key)) {
                console.log(`  Line ${i+1}: ${line.trim()}`);
              }
            });
          }
        });
      } catch (e) {
        // ignore read errors
      }
    }
  }
}

walk(dir);
