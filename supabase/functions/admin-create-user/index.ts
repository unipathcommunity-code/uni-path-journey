import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASSIGNABLE_ROLES = [
  'owner', 'admin', 'manager', 'accountant', 'agent',
  'specialist', 'mentor', 'teacher', 'parent', 'user', 'student',
];

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

    // 1. Verify caller is a super_admin.
    const { data: { user: caller }, error: callerErr } = await supabaseUser.auth.getUser();
    if (callerErr || !caller) return json({ error: 'Unauthorized' }, 401);

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles').select('role').eq('user_id', caller.id).maybeSingle();
    if (callerProfile?.role !== 'super_admin') {
      return json({ error: 'Only super_admin can create users' }, 403);
    }

    // 2. Validate input.
    const { email, password, fullName, role, tenantId } = await req.json();
    if (!email || !password) return json({ error: 'email and password are required' }, 400);
    if (String(password).length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);
    const finalRole = role && ASSIGNABLE_ROLES.includes(role) ? role : 'admin';

    // 3. Create the auth user (email pre-confirmed so they can log in immediately).
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName ?? email,
        role: finalRole,
        tenant_id: tenantId ?? null,
      },
    });
    if (createErr || !created?.user) {
      return json({ error: 'Failed to create user: ' + (createErr?.message ?? 'unknown') }, 400);
    }

    // 4. Ensure the profile reflects role + tenant (the handle_new_user trigger may
    //    or may not copy them — upsert to be certain).
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: created.user.id,
        email,
        full_name: fullName ?? email,
        role: finalRole,
        tenant_id: tenantId ?? null,
      }, { onConflict: 'user_id' });
    if (profileErr) {
      console.error('Profile upsert after create failed:', profileErr.message);
    }

    // 5. If role is owner and a tenant is linked, update tenants.owner_email
    if (finalRole === 'owner' && tenantId) {
      const { error: tenantErr } = await supabaseAdmin
        .from('tenants')
        .update({ owner_email: email })
        .eq('id', tenantId);
      if (tenantErr) {
        console.error('Failed to update tenant owner email:', tenantErr.message);
      }
    }

    return json({ success: true, user_id: created.user.id, role: finalRole });
  } catch (error) {
    console.error('admin-create-user error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
