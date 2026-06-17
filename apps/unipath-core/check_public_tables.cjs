const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bpokyebvwhigpjrembcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU'
);

async function test() {
  console.log("Checking tables in public schema...");
  const tables = [
    'organizations', 'leads', 'payments', 'lessons', 'attendance', 'user_roles'
  ];

  for (const table of tables) {
    const { status, error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table: public.${table} -> Status: ${status}, Error Code: ${error ? error.code : 'None'}`);
  }
}

test().catch(console.error);
