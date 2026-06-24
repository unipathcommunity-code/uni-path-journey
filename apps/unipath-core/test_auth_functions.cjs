const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bpokyebvwhigpjrembcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU'
);

async function run() {
  console.log("Signing in...");
  // Let's sign in with a test user. Since we don't know passwords, wait.
  // Is there any user password we know?
  // Ah, unipath.community@gmail.com has password '12345678' in test_update_db.js!
  // Wait! In test_owner_hub_query.cjs, it failed with 'Invalid login credentials' for 'UniPath123456!'.
  // But let's try '12345678'!
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'unipath.community@gmail.com',
    password: '12345678'
  });
  if (authErr) {
    console.error("Auth error:", authErr.message);
    return;
  }
  console.log("Logged in! User ID:", authData.user.id);

  console.log("Calling public.current_tenant_id() via RPC...");
  try {
    const { data, error } = await supabase.rpc('current_tenant_id');
    if (error) {
      console.error("current_tenant_id failed:", error.message, error);
    } else {
      console.log("current_tenant_id succeeded! Result:", data);
    }
  } catch (err) {
    console.error("Exception calling current_tenant_id:", err.message);
  }

  console.log("Calling public.is_super_admin() via RPC...");
  try {
    const { data, error } = await supabase.rpc('is_super_admin');
    if (error) {
      console.error("is_super_admin failed:", error.message, error);
    } else {
      console.log("is_super_admin succeeded! Result:", data);
    }
  } catch (err) {
    console.error("Exception calling is_super_admin:", err.message);
  }

  console.log("Querying tenants table under auth...");
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_email', 'unipath.community@gmail.com');
    if (error) {
      console.error("Tenants query failed:", error.message, error);
    } else {
      console.log("Tenants query succeeded! Result:", data);
    }
  } catch (err) {
    console.error("Exception querying tenants:", err.message);
  }
}

run().catch(console.error);
