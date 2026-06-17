import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SEGMENTS = [
  { label: "2 UniCoin", type: "credits", value: 2 },
  { label: "Nothing", type: "nothing", value: 0 },
  { label: "1 UniCoin", type: "credits", value: 1 },
  { label: "Nothing", type: "nothing", value: 0 },
  { label: "3 UniCoin", type: "credits", value: 3 },
  { label: "Nothing", type: "nothing", value: 0 },
  { label: "1 UniCoin", type: "credits", value: 1 },
  { label: "Nothing", type: "nothing", value: 0 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role for trusted operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check eligibility: last spin must be > 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: lastSpin } = await supabaseAdmin
      .from("spin_wheel_logs")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSpin) {
      const lastDate = new Date(lastSpin.created_at);
      if (lastDate > oneWeekAgo) {
        const nextSpin = new Date(lastDate);
        nextSpin.setDate(nextSpin.getDate() + 7);
        const daysLeft = Math.ceil(
          (nextSpin.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return new Response(
          JSON.stringify({ error: "cooldown", cooldownDays: daysLeft }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get global spin count for "lucky" logic
    const { count: globalCount } = await supabaseAdmin
      .from("spin_wheel_logs")
      .select("*", { count: "exact", head: true });

    const nextSpinNumber = (globalCount || 0) + 1;
    const isLucky = nextSpinNumber % 20 === 0;

    // Determine prize server-side
    let winIndex: number;
    const winningIndices = SEGMENTS.map((s, i) =>
      s.type === "credits" ? i : -1
    ).filter((i) => i >= 0);
    const losingIndices = SEGMENTS.map((s, i) =>
      s.type === "nothing" ? i : -1
    ).filter((i) => i >= 0);

    if (isLucky) {
      winIndex =
        winningIndices[Math.floor(Math.random() * winningIndices.length)];
    } else {
      const rand = Math.random();
      if (rand < 0.15) {
        winIndex =
          winningIndices[Math.floor(Math.random() * winningIndices.length)];
      } else {
        winIndex =
          losingIndices[Math.floor(Math.random() * losingIndices.length)];
      }
    }

    const prize = SEGMENTS[winIndex];

    // Log the spin
    await supabaseAdmin.from("spin_wheel_logs").insert({
      user_id: userId,
      prize_type: prize.type,
      prize_value: prize.value,
      spin_number: nextSpinNumber,
    });

    // Award credits if won
    if (prize.type === "credits" && prize.value > 0) {
      const { data: credits } = await supabaseAdmin
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const currentBalance = credits?.balance || 0;
      await supabaseAdmin
        .from("user_credits")
        .upsert(
          { user_id: userId, balance: currentBalance + prize.value },
          { onConflict: "user_id" }
        );

      await supabaseAdmin.from("credit_transactions").insert({
        user_id: userId,
        amount: prize.value,
        transaction_type: "spin_wheel",
        description: `Won ${prize.value} UniCoin from Lucky Wheel`,
      });
    }

    return new Response(
      JSON.stringify({
        winIndex,
        prizeType: prize.type,
        prizeValue: prize.value,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
