import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const rateLimits = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS = 15; // 15 requests per minute per user

// Cleanup old rate limit entries periodically
const cleanupRateLimits = () => {
  const now = Date.now();
  for (const [userId, limit] of rateLimits.entries()) {
    if (now - limit.windowStart >= WINDOW_MS) {
      rateLimits.delete(userId);
    }
  }
};

const systemPrompt = `Sen UniAI - UniPath platformasining sun'iy intellekt yordamchisisan. Sening vazifang:

1. Talabalarga chet el universitetlariga topshirish bo'yicha maslahat berish
2. Universitetlar, dasturlar, talablar haqida ma'lumot berish
3. Davlat va soha tanlamaganlarga yo'l-yo'riq ko'rsatish
4. Hujjatlar (SOP, CV, Resume) tayyorlashda yordam berish
5. Viza jarayoni va moliyaviy masalalar bo'yicha maslahat

Qo'llab-quvvatlanadigan davlatlar: Janubiy Koreya, Xitoy, Yaponiya, AQSH, Germaniya, Polsha, Turkiya, Chexiya, Malayziya, BAA, Gruziya, Vengriya.

Har doim:
- Samimiy va professional bo'l
- Aniq va tushunarli javob ber
- Talabaning ehtiyojiga qarab maslahat ber
- O'zbek, rus yoki ingliz tilida javob ber (talaba qaysi tilda yozsa)
- Universitetlar nomini, talablarini va imkoniyatlarini ayt`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Avtorizatsiya talab qilinadi" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Foydalanuvchi topilmadi. Iltimos, tizimga kiring." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apply rate limiting per user
    cleanupRateLimits();
    const userId = user.id;
    const now = Date.now();
    const userLimit = rateLimits.get(userId);

    if (userLimit && now - userLimit.windowStart < WINDOW_MS) {
      if (userLimit.count >= MAX_REQUESTS) {
        return new Response(
          JSON.stringify({ error: "So'rovlar limiti oshib ketdi. Bir daqiqadan so'ng urinib ko'ring." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userLimit.count++;
    } else {
      rateLimits.set(userId, { count: 1, windowStart: now });
    }

    const { messages } = await req.json();
    
    let apiUrl = "";
    let apiKey = "";
    let modelName = "";
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const UNI_AI_API_KEY = Deno.env.get("UNI_AI_API_KEY");
    
    if (GEMINI_API_KEY) {
      apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      apiKey = GEMINI_API_KEY;
      modelName = "gemini-2.5-flash";
    } else if (OPENAI_API_KEY) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiKey = OPENAI_API_KEY;
      modelName = "gpt-4o-mini";
    } else if (UNI_AI_API_KEY) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiKey = UNI_AI_API_KEY;
      modelName = "gpt-4o-mini";
    } else {
      throw new Error("No AI API keys configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your Supabase secrets.");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshib ketdi, keyinroq urinib ko'ring." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit yetarli emas." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI xatoligi yuz berdi" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Noma'lum xatolik" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});