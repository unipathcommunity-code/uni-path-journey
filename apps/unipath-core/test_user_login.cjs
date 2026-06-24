const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bpokyebvwhigpjrembcg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Attempting sign-in for unipath.community@gmail.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'unipath.community@gmail.com',
    password: '12345678'
  });

  if (error) {
    console.error('Login failed:', error.message);
    return;
  }

  console.log('Login successful!');
  console.log('User ID:', data.user.id);
  console.log('User Email:', data.user.email);
  console.log('User App Metadata:', JSON.stringify(data.user.app_metadata, null, 2));
  console.log('User User Metadata:', JSON.stringify(data.user.user_metadata, null, 2));

  // Query profiles table for this user
  console.log('\nQuerying profiles table for user_id:', data.user.id);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Failed to query profiles:', profileError.message);
  } else {
    console.log('Profile:', JSON.stringify(profile, null, 2));
  }
}

check().catch(console.error);
