const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bpokyebvwhigpjrembcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU'
);

async function run() {
  console.log("Signing in...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'unipath.community@gmail.com',
    password: 'UniPath123456!'
  });
  if (authErr) {
    console.error("Auth error:", authErr.message);
    return;
  }
  console.log("Logged in! User ID:", authData.user.id);

  console.log("Running OwnerHub query...");
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('owner_email', 'unipath.community@gmail.com')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Query failed with error:", error.message, error);
  } else {
    console.log("Query succeeded! Tenants count:", data.length);
    console.log("Tenants:", data);
  }
}

run().catch(console.error);
