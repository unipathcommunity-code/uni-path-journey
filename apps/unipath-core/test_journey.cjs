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
  const userId = authData.user.id;
  console.log("Logged in user:", userId);

  console.log("1. Querying documents...");
  const docsRes = await supabase.from('documents').select('id, status').eq('user_id', userId);
  console.log("Documents res:", docsRes.data, docsRes.error);

  console.log("2. Querying applications...");
  const appsRes = await supabase.from('applications').select('id, status, university:universities(name, country, city)').eq('user_id', userId);
  console.log("Applications res:", appsRes.data, appsRes.error);

  console.log("3. Querying visa_applications...");
  const visasRes = await supabase.from('visa_applications').select('id, status, visa_received').eq('user_id', userId);
  console.log("Visas res:", visasRes.data, visasRes.error);

  console.log("4. Querying student_feature_overrides...");
  const overridesRes = await supabase.from('student_feature_overrides').select('feature_key, is_unlocked').eq('user_id', userId);
  console.log("Overrides res:", overridesRes.data, overridesRes.error);
}

test().catch(console.error);
