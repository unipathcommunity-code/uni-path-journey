const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bpokyebvwhigpjrembcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU'
);

async function check() {
  console.log("Querying single tenant record...");
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error("Error fetching tenants:", error);
  } else {
    console.log("Tenant data sample:", data);
  }
}

check().catch(console.error);
