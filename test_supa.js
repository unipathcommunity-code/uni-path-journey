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
  
  console.log("Checking user roles in nova...");
  const { data: novaRoles, error: novaErr } = await supabase
    .schema('nova')
    .from('user_roles')
    .select('role')
    .eq('user_id', authData.user.id);
  console.log("Nova roles:", novaRoles, novaErr);

  console.log("Checking unitour bootstrap...");
  const { data: rpcData, error: rpcErr } = await supabase.rpc('bootstrap_current_user');
  console.log("RPC result:", rpcData, rpcErr);

  console.log("Checking unitour roles...");
  const { data: tourRoles, error: tourErr } = await supabase
    .schema('tour')
    .from('user_roles')
    .select('role')
    .eq('user_id', authData.user.id);
  console.log("Tour roles:", tourRoles, tourErr);

  // Wait, unitour uses the default schema (public), wait NO, it uses 'tour' or 'public'?
  console.log("Checking public user roles...");
  const { data: pubRoles, error: pubErr } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authData.user.id);
  console.log("Public roles:", pubRoles, pubErr);
}

test().catch(console.error);
