import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../..');
const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.sql'));

console.log('SQL files found in root:', files);

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.toLowerCase().includes('websites')) {
    console.log(`\n=== Found "websites" in ${file} ===`);
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes('websites')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
      }
    });
  }
});
