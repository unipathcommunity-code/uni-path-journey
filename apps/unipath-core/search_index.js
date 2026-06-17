import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.resolve(__dirname, 'src/pages/Index.tsx');

if (!fs.existsSync(indexPath)) {
  console.log('Index file does not exist at ' + indexPath);
  process.exit(0);
}

const content = fs.readFileSync(indexPath, 'utf8');
const lines = content.split('\n');

console.log('Searching Index.tsx...');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('unitour') || line.toLowerCase().includes('/tour') || line.toLowerCase().includes('nova')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
