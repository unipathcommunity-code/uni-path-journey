const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bpokyebvwhigpjrembcg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Querying profiles table for unipath.community@gmail.com...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'unipath.community@gmail.com');

  if (error) {
    console.error('Error querying profiles:', error.message);
    return;
  }

  console.log(`Found ${profiles.length} profiles:`);
  console.log(JSON.stringify(profiles, null, 2));
}

check().catch(console.error);
