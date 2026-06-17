const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bpokyebvwhigpjrembcg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU';

async function testNova() {
  console.log("Creating client for default ('public') schema...");
  const clientPublic = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log("Querying websites from public schema...");
  const { data: sPub, error: errPub } = await clientPublic
    .from('websites')
    .select('*')
    .limit(1);
  console.log("Public schema websites query result:", { data: sPub, error: errPub });

  console.log("\nCreating client for 'nova' schema...");
  const clientNova = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: {
      schema: 'nova'
    }
  });

  console.log("Querying websites from 'nova' schema...");
  const { data: sNova, error: errNova } = await clientNova
    .from('websites')
    .select('*')
    .limit(1);
  console.log("Nova schema websites query result:", { data: sNova, error: errNova });

  console.log("\nChecking RPC site_branding_by_slug...");
  const { data: branding, error: errBranding } = await clientPublic
    .rpc("site_branding_by_slug", { _slug: 'ashraf' });
  console.log("RPC site_branding_by_slug result:", { data: branding, error: errBranding });
}

testNova().catch(console.error);
