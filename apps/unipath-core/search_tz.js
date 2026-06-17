import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tzPath = path.resolve(__dirname, '../../UniPath_TZ_v2.md');
const content = fs.readFileSync(tzPath, 'utf8');
const lines = content.split('\n');

console.log('Searching in UniPath_TZ_v2.md...');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('nova') || line.toLowerCase().includes('unitour') || line.toLowerCase().includes('vertical')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
