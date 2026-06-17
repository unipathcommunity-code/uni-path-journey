import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../..');

function walk(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const filePath = path.join(currentDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.vercel' && file !== 'dist') {
        walk(filePath);
      }
    } else if (file.endsWith('.sql') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.toLowerCase().includes('create table websites') || content.toLowerCase().includes('create table if not exists websites') || content.toLowerCase().includes('create schema') || content.toLowerCase().includes('websites')) {
        const relPath = path.relative(rootDir, filePath);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.toLowerCase().includes('create table') && line.toLowerCase().includes('websites')) {
            console.log(`[${relPath}] Line ${i + 1}: ${line.trim()}`);
          } else if (line.toLowerCase().includes('create schema')) {
            console.log(`[${relPath}] Line ${i + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('Searching repository...');
walk(rootDir);
