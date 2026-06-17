import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env from root directory (two levels up from apps/unipath-core/check_ashraf.js? No, root is one level up from apps/unipath-core)
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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAshraf() {
  console.log('Logging in as super admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'unipath.community@gmail.com',
    password: '12345678'
  });

  if (authError) {
    console.error('Failed to log in:', authError.message);
    return;
  }

  console.log('Login successful! Checking tenant ashraf...');
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', 'ashraf')
    .maybeSingle();

  if (tenantError) {
    console.error('Error fetching tenant:', tenantError.message);
  } else if (!tenant) {
    console.log('Tenant "ashraf" not found!');
  } else {
    console.log('Tenant "ashraf" details:', JSON.stringify(tenant, null, 2));
    
    console.log('Checking websites for tenant_id:', tenant.id);
    const { data: websites, error: webError } = await supabase
      .schema('nova')
      .from('websites')
      .select('*')
      .eq('organization_id', tenant.id);
      
    if (webError) {
      console.error('Error fetching websites:', webError.message);
    } else {
      console.log('Websites count:', websites.length);
      console.log('Websites list:', JSON.stringify(websites, null, 2));
    }
  }
}

checkAshraf();
