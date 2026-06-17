import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// A custom domain pointed at Vercel resolves (via CNAME/A) to Vercel infra.
const VERCEL_HINTS = ['vercel', '76.76.21.', '76.76.', 'cname.vercel-dns.com'];

/** Real DNS lookup via Cloudflare DNS-over-HTTPS. Returns resolved records. */
async function resolveDns(domain: string, type: 'A' | 'CNAME'): Promise<string[]> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      { headers: { accept: 'application/dns-json' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.Answer ?? []).map((a: { data: string }) => String(a.data));
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No authorization header' }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: callerErr } = await supabaseUser.auth.getUser();
    if (callerErr || !caller) return json({ error: 'Unauthorized' }, 401);
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles').select('role').eq('user_id', caller.id).maybeSingle();
    if (callerProfile?.role !== 'super_admin') {
      return json({ error: 'Only super_admin can verify domains' }, 403);
    }

    const { domain, tenantId } = await req.json();
    if (!domain || !tenantId) return json({ error: 'domain and tenantId are required' }, 400);

    // 1. Real DNS resolution.
    const [aRecords, cnameRecords] = await Promise.all([
      resolveDns(domain, 'A'),
      resolveDns(domain, 'CNAME'),
    ]);
    const all = [...aRecords, ...cnameRecords].map((r) => r.toLowerCase());
    const resolves = all.length > 0;
    const pointsToVercel = all.some((r) => VERCEL_HINTS.some((h) => r.includes(h)));

    // 2. Honest status — no faking.
    let status: string;
    let ssl: string;
    if (!resolves) {
      status = 'dns_not_found'; ssl = 'pending';
    } else if (pointsToVercel) {
      status = 'active'; ssl = 'active';   // resolves to Vercel → live + auto-SSL
    } else {
      status = 'dns_misconfigured'; ssl = 'pending';
    }

    // 3. Persist the REAL result into tenants.config.domains[domain].
    const { data: tenantData, error: fetchErr } = await supabaseAdmin
      .from('tenants').select('config').eq('id', tenantId).single();
    if (fetchErr) return json({ error: 'Tenant not found: ' + fetchErr.message }, 404);

    const config = tenantData?.config ?? {};
    const domains = config.domains ?? {};
    domains[domain] = { ssl, status, checked_at: new Date().toISOString(), records: all };

    const { error: updateErr } = await supabaseAdmin
      .from('tenants').update({ config: { ...config, domains } }).eq('id', tenantId);
    if (updateErr) return json({ error: 'Failed to save result: ' + updateErr.message }, 500);

    return json({ success: true, domain, status, ssl, resolves, pointsToVercel, records: all });
  } catch (error) {
    console.error('verify-domain error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
