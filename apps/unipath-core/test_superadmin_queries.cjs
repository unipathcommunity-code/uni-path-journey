const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bpokyebvwhigpjrembcg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Attempting sign-in for unipath.community@gmail.com...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'unipath.community@gmail.com',
    password: '12345678'
  });

  if (loginError) {
    console.error('Login failed:', loginError.message);
    return;
  }
  console.log('Login successful! User ID:', loginData.user.id);

  console.log('\nQuerying tenants...');
  const tenantsRes = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
  if (tenantsRes.error) {
    console.error('Tenants Query Failed:', tenantsRes.error.message);
  } else {
    console.log('Tenants Query Succeeded. Count:', tenantsRes.data.length);
  }

  console.log('\nQuerying profiles...');
  const profilesRes = await supabase.from("profiles").select("user_id, role, created_at");
  if (profilesRes.error) {
    console.error('Profiles Query Failed:', profilesRes.error.message);
  } else {
    console.log('Profiles Query Succeeded. Count:', profilesRes.data.length);
  }

  console.log('\nQuerying pricing_plans...');
  const plansRes = await supabase.from("pricing_plans").select("vertical, name, price, currency");
  if (plansRes.error) {
    console.error('Pricing Plans Query Failed:', plansRes.error.message);
  } else {
    console.log('Pricing Plans Query Succeeded. Count:', plansRes.data.length);
  }
}

check().catch(console.error);
