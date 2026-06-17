const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bpokyebvwhigpjrembcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU'
);

async function run() {
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

  console.log("Fetching first organization...");
  const { data: orgs, error: orgsErr } = await supabase.from('organizations').select('*').limit(1);
  if (orgsErr) {
    console.error("Fetch orgs error:", orgsErr);
    return;
  }
  if (!orgs || orgs.length === 0) {
    console.log("No organizations found.");
    return;
  }
  const org = orgs[0];
  console.log("Found organization:", org.name, org.id);

  console.log("Attempting to update features on organizations view...");
  const { data: updateData, error: updateErr } = await supabase
    .from('organizations')
    .update({ name: org.name + ' Test', features: { ...org.features, test: true } })
    .eq('id', org.id);

  if (updateErr) {
    console.error("Update error:", updateErr);
  } else {
    console.log("Update success!", updateData);
  }
}

run().catch(console.error);
