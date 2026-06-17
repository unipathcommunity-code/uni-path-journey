import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Billing = "monthly" | "yearly";

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tier: string;
  monthly_price: number;
  yearly_price: number | null;
  currency: string;
  max_students: number;
  max_teachers: number;
  features: Record<string, boolean>;
  highlight: boolean;
  sort_order: number;
  paddle_monthly_product_id: string | null;
  paddle_yearly_product_id: string | null;
};

const FEATURE_LABELS: Record<string, string> = {
  ai_tutor: "NOVA Yordamchi (24/7)",
  ai_lesson_planner: "Aqlli dars rejasi",
  ai_presentation: "Avtomatik prezentatsiya",
  homework: "Uy vazifalari",
  payments: "Tolovlar va invoyslar",
  biometric: "Face ID + GPS check-in",
  nova_store: "Nova Coins do'koni",
  live_classes: "Onlayn darslar",
  telegram_bot: "Telegram bot",
  parent_mirror: "Ota-ona oynasi",
  qr_attendance: "QR davomat",
  website_builder: "Sayt konstruktori",
  crm: "CRM yetakchilar",
};

const fmtMoney = (n: number, ccy: string) =>
  new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(n) +
  " " +
  (ccy || "UZS");

export default function PricingPlans() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [billing, setBilling] = useState<Billing>("monthly");
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) {
        toast.error("Tariflarni yuklashda xato");
        setPlans([]);
        return;
      }
      setPlans((data || []) as unknown as Plan[]);
    })();
  }, []);

  const startCheckout = async (plan: Plan) => {
    const productId =
      billing === "monthly" ? plan.paddle_monthly_product_id : plan.paddle_yearly_product_id;
    if (!productId) {
      toast.error("Bu tarif uchun to'lov hali sozlanmagan", {
        description: "Iltimos administrator bilan bog'laning yoki demoga yoziling.",
      });
      return;
    }
    setCheckingOut(plan.id);
    try {
      // Paddle ulangach bu yerga `Paddle.Checkout.open({ items: [{ priceId: productId, quantity: 1 }] })`
      // chaqiruvi qo'yiladi. Hozircha foydalanuvchini lead formaga yo'naltiramiz.
      toast.message("Tolov tizimi ulanmoqda", {
        description: `${plan.name} (${billing === "monthly" ? "oylik" : "yillik"}) — tez orada faollashadi.`,
      });
    } finally {
      setCheckingOut(null);
    }
  };

  return (
    <div className="min-h-screen bg-background nova-grid-bg">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            NOVA tariflari
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-bold tracking-tight font-heading"
          >
            Markazingizga mos tarifni tanlang
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-muted-foreground max-w-xl mx-auto"
          >
            Yillik to'lovda 2 oy bepul. Istalgan vaqtda yangilash yoki bekor qilish mumkin.
          </motion.p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex p-1 rounded-full glass-strong border border-border/40">
            {(["monthly", "yearly"] as Billing[]).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  billing === b
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {b === "monthly" ? "Oylik" : "Yillik"}
                {b === "yearly" && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-bold">
                    −17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Plans grid */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        {plans === null ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Yuklanmoqda…
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Hozircha faol tariflar yo'q. Administrator yangilarini qo'shadi.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p, i) => {
              const monthly = Number(p.monthly_price) || 0;
              const yearly =
                p.yearly_price != null
                  ? Number(p.yearly_price)
                  : Math.round(monthly * 12 * 0.83); // ~17% off fallback
              const showPrice = billing === "monthly" ? monthly : yearly;
              const period = billing === "monthly" ? "/oy" : "/yil";
              const features = Object.entries(p.features || {})
                .filter(([, v]) => v)
                .map(([k]) => FEATURE_LABELS[k] || k);

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={`relative glass-strong p-7 flex flex-col ${
                    p.highlight ? "ring-2 ring-primary/60 shadow-glow" : ""
                  }`}
                >
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg">
                      Eng mashhur
                    </div>
                  )}
                  <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {p.tier}
                  </div>
                  <h3 className="text-2xl font-bold font-heading">{p.name}</h3>
                  {p.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                  )}

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">
                      {fmtMoney(showPrice, p.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">{period}</span>
                  </div>
                  {billing === "yearly" && monthly > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      ≈ {fmtMoney(Math.round(yearly / 12), p.currency)} / oy
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/40 p-2 text-center">
                      <div className="font-semibold">{p.max_students}</div>
                      <div className="text-muted-foreground">talaba</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2 text-center">
                      <div className="font-semibold">{p.max_teachers}</div>
                      <div className="text-muted-foreground">o'qituvchi</div>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2 text-sm flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {features.length === 0 && (
                      <li className="text-muted-foreground text-xs">Asosiy imkoniyatlar</li>
                    )}
                  </ul>

                  <Button
                    onClick={() => startCheckout(p)}
                    disabled={checkingOut === p.id}
                    className={`mt-6 w-full ${p.highlight ? "" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                    variant={p.highlight ? "default" : "secondary"}
                  >
                    {checkingOut === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Boshlash <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-10 text-sm text-muted-foreground">
          Savollar bormi?{" "}
          <Link to="/pricing" className="text-primary hover:underline">
            Demoga yoziling
          </Link>
        </div>
      </section>
    </div>
  );
}
