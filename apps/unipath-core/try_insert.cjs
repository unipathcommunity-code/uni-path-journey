const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bpokyebvwhigpjrembcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU'
);

const candidates = [
  'car_showroom',
  'car-showroom',
  'showroom',
  'car',
  'car_dealership',
  'dealership',
  'auto',
  'auto_service'
];

async function check() {
  for (const candidate of candidates) {
    console.log(`Trying candidate vertical: '${candidate}'...`);
    // Try to insert a temporary tenant and immediately delete it if it succeeds, or roll it back (well, just delete it)
    const tempSubdomain = 'temp-test-vertical-' + Math.floor(Math.random() * 10000);
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        name: 'Temp Test ' + candidate,
        subdomain: tempSubdomain,
        status: 'pending',
        vertical: candidate,
        plan: 'Starter'
      })
      .select();

    if (error) {
      console.log(`  FAILED for '${candidate}':`, error.message);
    } else {
      console.log(`  SUCCESS for '${candidate}'! Created ID:`, data[0].id);
      // Clean up immediately
      await supabase.from('tenants').delete().eq('id', data[0].id);
    }
  }
}

check().catch(console.error);
