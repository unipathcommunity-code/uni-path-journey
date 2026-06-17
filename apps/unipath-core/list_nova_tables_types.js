import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typesPath = path.resolve(__dirname, '../nova/src/integrations/supabase/types.ts');
const content = fs.readFileSync(typesPath, 'utf8');

console.log('Tables found in nova types:');
const matches = content.matchAll(/(\w+):\s*{\s*Row:/g);
for (const match of matches) {
  console.log(' - ' + match[1]);
}
