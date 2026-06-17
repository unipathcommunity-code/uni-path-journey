import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role (super_admin, owner, manager, or admin)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const allowedRoles = ['super_admin', 'owner', 'manager', 'admin'];
    const isAdmin = !profileError && profile && allowedRoles.includes(profile.role);

    if (profileError || !isAdmin) {
      console.error('User is not admin or error fetching profile:', profileError, profile?.role);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action, transaction_id, user_id, amount, description } = body;

    if (action === 'confirm_payment') {
      if (!transaction_id) {
        return new Response(JSON.stringify({ error: 'transaction_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get transaction
      const { data: tx, error: txErr } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transaction_id)
        .single();

      if (txErr || !tx) {
        return new Response(JSON.stringify({ error: 'Transaction not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (tx.status === 'confirmed') {
        return new Response(JSON.stringify({ error: 'Already confirmed' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update transaction status
      await supabase
        .from('payment_transactions')
        .update({ status: 'confirmed', confirmed_by: user.id, confirmed_at: new Date().toISOString() })
        .eq('id', transaction_id);

      // Add coins to user balance
      const { data: credits } = await supabase
        .from('user_credits')
        .select('balance, total_purchased')
        .eq('user_id', tx.user_id)
        .single();

      if (credits) {
        await supabase
          .from('user_credits')
          .update({
            balance: credits.balance + tx.unicoin_amount,
            total_purchased: credits.total_purchased + tx.unicoin_amount,
          })
          .eq('user_id', tx.user_id);
      } else {
        await supabase
          .from('user_credits')
          .insert({ user_id: tx.user_id, balance: tx.unicoin_amount, total_purchased: tx.unicoin_amount });
      }

      // Record credit transaction
      await supabase.from('credit_transactions').insert({
        user_id: tx.user_id,
        amount: tx.unicoin_amount,
        transaction_type: 'purchase',
        description: `Click to'lov: ${Number(tx.uzs_amount).toLocaleString()} UZS → ${tx.unicoin_amount} UniCoin`,
        reference_id: transaction_id,
      });

      // Send notification
      await supabase.from('notifications').insert({
        user_id: tx.user_id,
        title: "To'lov tasdiqlandi!",
        message: `${tx.unicoin_amount} UniCoin balansingizga qo'shildi.`,
        type: 'success',
        link: '/student/dashboard',
      });

      return new Response(JSON.stringify({ success: true, coins_added: tx.unicoin_amount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'manual_add_coins') {
      if (!user_id || !amount) {
        return new Response(JSON.stringify({ error: 'user_id and amount required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: credits } = await supabase
        .from('user_credits')
        .select('balance, total_purchased')
        .eq('user_id', user_id)
        .single();

      const newBalance = (credits?.balance || 0) + amount;

      if (credits) {
        await supabase
          .from('user_credits')
          .update({ balance: newBalance, total_purchased: (credits.total_purchased || 0) + (amount > 0 ? amount : 0) })
          .eq('user_id', user_id);
      } else {
        await supabase
          .from('user_credits')
          .insert({ user_id, balance: newBalance, total_purchased: amount > 0 ? amount : 0 });
      }

      await supabase.from('credit_transactions').insert({
        user_id,
        amount,
        transaction_type: amount > 0 ? 'admin_add' : 'admin_remove',
        description: description || `Admin tomonidan ${amount > 0 ? 'qo\'shildi' : 'ayirildi'}: ${Math.abs(amount)} UniCoin`,
      });

      return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
