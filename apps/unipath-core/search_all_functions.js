import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.resolve(__dirname, '../../full_database_schema.sql');
const content = fs.readFileSync(sqlPath, 'utf8');
const lines = content.split('\n');

console.log('Searching for database functions...');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('create') && line.toLowerCase().includes('function')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
