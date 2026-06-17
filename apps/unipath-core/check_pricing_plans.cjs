const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bpokyebvwhigpjrembcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU'
);

async function check() {
  console.log("Checking subscription_plans...");
  const { data: subPlans, error: subErr, status: subStatus } = await supabase.from('subscription_plans').select('*').limit(5);
  if (subErr) {
    console.error("subscription_plans error:", subErr.message, "status:", subStatus);
  } else {
    console.log("subscription_plans count:", subPlans.length, "status:", subStatus);
    if (subPlans.length > 0) {
      console.log("subscription_plans sample keys:", Object.keys(subPlans[0]));
      console.log("subscription_plans sample row:", JSON.stringify(subPlans[0], null, 2));
    }
  }

  console.log("\nChecking pricing_plans...");
  const { data: pricePlans, error: priceErr, status: priceStatus } = await supabase.from('pricing_plans').select('*').limit(5);
  if (priceErr) {
    console.error("pricing_plans error:", priceErr.message, "status:", priceStatus);
  } else {
    console.log("pricing_plans count:", pricePlans.length, "status:", priceStatus);
    if (pricePlans.length > 0) {
      console.log("pricing_plans sample keys:", Object.keys(pricePlans[0]));
      console.log("pricing_plans sample row:", JSON.stringify(pricePlans[0], null, 2));
    }
  }
}

check().catch(console.error);
