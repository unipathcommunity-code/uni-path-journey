const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bpokyebvwhigpjrembcg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU';

const supabase = createClient(supabaseUrl, supabaseKey);

const parsePrice = (raw) => {
  if (raw == null) return 0;
  const digits = String(raw).replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const MONTH_LABELS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

async function check() {
  console.log('Fetching raw data...');
  const [tenantsRes, profilesRes, plansRes] = await Promise.all([
    supabase.from("tenants").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("user_id, role, created_at"),
    supabase.from("pricing_plans").select("vertical, name, price, currency"),
  ]);

  console.log('Calculating stats...');
  const rawTenants = tenantsRes.data || [];
  const profiles = profilesRes.data || [];
  const plans = plansRes.data || [];

  const priceByPlan = new Map();
  for (const p of plans) {
    priceByPlan.set(`${p.vertical}|${p.name}`, {
      price: parsePrice(p.price),
      currency: p.currency || "UZS",
    });
  }

  const tenants = rawTenants.map((t) => {
    const vertical = t.vertical || t.config?.business_type || "consulting";
    const plan = t.plan || null;
    const match = plan ? priceByPlan.get(`${vertical}|${plan}`) : undefined;
    return {
      id: t.id,
      name: t.name,
      vertical,
      status: t.status || "pending",
      plan,
      subdomain: t.subdomain || null,
      custom_domain: t.custom_domain || null,
      owner_name: t.owner_name || null,
      owner_email: t.owner_email || null,
      monthlyPrice: match?.price || 0,
      currency: match?.currency || "UZS",
      created_at: t.created_at,
    };
  });

  const liveTenants = tenants.filter((t) => ["active", "approved"].includes(t.status));

  const byVertical = {};
  for (const t of tenants) byVertical[t.vertical] = (byVertical[t.vertical] || 0) + 1;

  const byPlan = {};
  for (const t of liveTenants) {
    const key = t.plan || "—";
    byPlan[key] = (byPlan[key] || 0) + 1;
  }

  const byRole = {};
  for (const p of profiles) {
    const r = p.role || "user";
    byRole[r] = (byRole[r] || 0) + 1;
  }

  const mrr = liveTenants.reduce((s, t) => s + t.monthlyPrice, 0);

  const now = new Date();
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const count = tenants.filter((t) => t.created_at && monthKey(new Date(t.created_at)) === key).length;
    trend.push({ label: MONTH_LABELS[d.getMonth()], count });
  }

  console.log('Calculation successful!');
  console.log('Totals:', {
    tenants: tenants.length,
    live: liveTenants.length,
    pending: tenants.filter((t) => t.status === "pending").length,
    users: profiles.length,
    mrr,
  });
}

check().catch(console.error);
