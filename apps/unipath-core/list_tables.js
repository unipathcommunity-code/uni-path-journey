import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env from root
const envPath = path.resolve(__dirname, '../../.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_KEY = env['VITE_SUPABASE_PUBLISHABLE_KEY'];

async function listTables() {
  const schemas = ['public', 'nova', 'travel', 'tour'];
  for (const schema of schemas) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        db: { schema: schema }
      });

      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`Schema "${schema}": table "websites" check got error:`, error.message);
      } else {
        console.log(`Schema "${schema}": table "websites" EXISTS! Data:`, data);
      }
    } catch (err) {
      console.log(`Schema "${schema}": exception:`, err.message);
    }
  }
}

listTables();
