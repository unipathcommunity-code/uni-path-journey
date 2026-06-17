import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coreSrc = path.resolve(__dirname, 'src');

function walk(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const filePath = path.join(currentDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.toLowerCase().includes('unitour') || content.toLowerCase().includes('tour')) {
        const relPath = path.relative(coreSrc, filePath);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('unitour') || line.includes('tour') || line.includes('/tour') || line.includes('/unitour')) {
            console.log(`[${relPath}] Line ${i + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('Searching core src...');
walk(coreSrc);
