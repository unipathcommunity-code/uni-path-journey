import { createClient } from @supabase/supabase-js;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from(tenants).select(*);
  console.log(JSON.stringify(data, null, 2));
}
run();