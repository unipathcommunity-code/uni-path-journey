import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typesPath = path.resolve(__dirname, '../nova/src/integrations/supabase/types.ts');
const content = fs.readFileSync(typesPath, 'utf8');

const lines = content.split('\n');

function printBlock(searchStr, maxLines = 40) {
  let found = false;
  let braces = 0;
  let output = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!found && line.includes(searchStr)) {
      found = true;
      console.log(`Found "${searchStr}" at line ${i + 1}`);
    }
    
    if (found) {
      output.push(line);
      const openCount = (line.match(/{/g) || []).length;
      const closeCount = (line.match(/}/g) || []).length;
      braces += openCount - closeCount;
      
      if (braces <= 0 && output.length > 1) {
        break;
      }
      if (output.length >= maxLines) {
        output.push('... truncated ...');
        break;
      }
    }
  }
  
  console.log(output.join('\n'));
}

console.log('=== Websites Table Type ===');
printBlock('websites: {');

console.log('\n=== Website Blocks Table Type ===');
printBlock('website_blocks: {');
