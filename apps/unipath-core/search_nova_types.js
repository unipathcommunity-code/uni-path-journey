import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typesPath = path.resolve(__dirname, '../nova/src/integrations/supabase/types.ts');

if (!fs.existsSync(typesPath)) {
  console.log('Nova types file does not exist at ' + typesPath);
  process.exit(0);
}

const content = fs.readFileSync(typesPath, 'utf8');
const lines = content.split('\n');

console.log('Searching nova types...');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('websites') || line.toLowerCase().includes('website_blocks')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
