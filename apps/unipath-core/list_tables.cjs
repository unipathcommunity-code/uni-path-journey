const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bpokyebvwhigpjrembcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU'
);

async function test() {
  console.log("Fetching schema info...");
  // Let's run a query to get list of tables. Wait, since we are using anon key, 
  // postgrest only exposes tables that we can access. Let's try querying postgrest schema info 
  // or query a known table, or check if we can call a system catalog or use postgres directly if we find credentials.
  
  // Since we cannot run raw SQL via Postgrest unless we have an RPC, let's see which tables 
  // return a success or 404/403.
  const tables = [
    'profiles', 'tenants', 'user_roles', 'branches', 'roles', 'audit_logs', 
    'academy_groups', 'academy_attendance', 'hotel_rooms', 'hotel_bookings',
    'inventory_suppliers', 'inventory_items', 'inventory_movements',
    'restaurant_tables', 'restaurant_orders', 'gym_memberships', 'gym_schedules',
    'mfg_boms', 'mfg_stages', 'mfg_piecework_salaries', 'camera_devices',
    'camera_events', 'notification_queue', 'applications', 'universities'
  ];

  for (const table of tables) {
    const { status, error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table: ${table} -> Status: ${status}, Error Code: ${error ? error.code : 'None'}`);
  }
}

test().catch(console.error);
