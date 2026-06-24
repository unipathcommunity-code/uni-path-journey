const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bpokyebvwhigpjrembcg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Querying tenants table...');
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*');

  if (error) {
    console.error('Error querying tenants:', error.message);
    return;
  }

  console.log(`Found ${tenants.length} tenants:`);
  for (const t of tenants) {
    console.log(`- ID: ${t.id}`);
    console.log(`  Name: ${t.name}`);
    console.log(`  Subdomain: ${t.subdomain}`);
    console.log(`  Custom Domain: ${t.custom_domain}`);
    console.log(`  Owner Email: ${t.owner_email}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  Vertical: ${t.vertical || t.business_type}`);
  }
}

check().catch(console.error);
