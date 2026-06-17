const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bpokyebvwhigpjrembcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU'
);

async function check() {
  console.log("Checking if we can query pg_type/pg_enum...");
  // Let's try to query pg_type
  const { data, error } = await supabase
    .from('pg_type')
    .select('*')
    .limit(5);
  
  if (error) {
    console.log("pg_type query failed, which is expected if not exposed:", error.message);
  } else {
    console.log("pg_type query succeeded! Data:", data);
  }

  // Let's try to select from tenants and see if there are any other columns
  // Wait, let's try to fetch columns from information_schema
  const { data: cols, error: colsErr } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'tenants');
  
  if (colsErr) {
    console.log("information_schema query failed:", colsErr.message);
  } else {
    console.log("tenants columns from information_schema:", cols);
  }
}

check().catch(console.error);
