const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bpokyebvwhigpjrembcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU'
);

async function test() {
  console.log("Signing in...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'unipath.community@gmail.com',
    password: '12345678'
  });
  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }
  console.log("Logged in!", authData.user.id);

  console.log("Fetching tenants...");
  const { data: tenants, error: tenantsErr } = await supabase
    .from('tenants')
    .select('*')
    .limit(5);
  
  if (tenantsErr) {
    console.error("Tenants fetch error:", tenantsErr);
  } else {
    console.log("Tenants found:", tenants?.length);
    tenants?.forEach(t => {
      console.log(`  Tenant ID: ${t.id}, Name: ${t.name}, Vertical: ${t.vertical}, Status: ${t.status}`);
    });
  }
}

test().catch(console.error);
