import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Compass, ArrowRight, User, Building2, School, Crown, Loader2 } from "lucide-react";
import { usePlans, type SubscriptionPlan } from "@/hooks/usePlans";

type Category = "tutor" | "center" | "school" | "academy";

const CATEGORIES: { id: Category; label: string; icon: typeof User; desc: string }[] = [
  { id: "tutor", label: "Repetitor", icon: User, desc: "Yakka ustozlar" },
  { id: "center", label: "O'quv markazi", icon: Compass, desc: "Til, IT, repetitorlik" },
  { id: "school", label: "Xususiy maktab", icon: School, desc: "1-11 sinflar" },
  { id: "academy", label: "Akademiya", icon: Crown, desc: "Universitetlar" },
];

const FEATURE_LABELS: Record<string, string> = {
  ai_tutor: "NOVA Yordamchi (24/7)",
  homework: "Uy vazifalari",
  payments: "To'lovlar",
  biometric: "Biometrik davomat",
  nova_store: "Nova Store (gamification)",
  live_classes: "Jonli darslar",
  parent_mirror: "Ota-ona kabineti",
  qr_attendance: "QR davomat",
  ai_presentation: "Avtomatik taqdimot generator",
  ai_lesson_planner: "Avtomatik dars rejasi",
  crm: "CRM lid voronkasi",
  website_builder: "Veb-sayt builder",
  telegram_bot: "Telegram bot",
  advanced_analytics: "Kengaytirilgan analitika",
  white_label: "White-label (oq yorliq)",
  custom_domain: "Custom domen",
  priority_support: "Ustuvor qo'llab-quvvatlash",
  api_access: "API kirish",
};

const formatPrice = (n: number) => n === 0 ? "—" : new Intl.NumberFormat("uz").format(n);
const formatLimit = (n: number) => n >= 999999 ? "Cheksiz" : n.toLocaleString();

const Pricing = () => {
  const [active, setActive] = useState<Category>("center");
  const { plans, loading } = usePlans();

  useEffect(() => {
    document.title = "Tariflar — NOVA";
  }, []);

  const filtered = plans.filter((p) => p.org_type === active);

  const enabledFeatures = (plan: SubscriptionPlan) =>
    Object.entries(plan.features)
      .filter(([, v]) => v === true)
      .map(([k]) => FEATURE_LABELS[k] || k);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-heading font-black text-lg">NOVA</span>
          </Link>
          <Link to="/demo" className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            Demo so'rash
          </Link>
        </div>
      </nav>

      <section className="px-4 sm:px-6 py-12 sm:py-16 text-center max-w-3xl mx-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">10 ta tarif</div>
        <h1 className="text-4xl sm:text-6xl font-heading font-black mb-4 leading-tight">
          Hajmingizga mos <span className="text-gradient-primary">tarif tanlang</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          14 kun bepul sinov. Karta talab qilinmaydi. Istalgan vaqt o'zgartirish mumkin.
        </p>
      </section>

      <div className="px-4 sm:px-6 max-w-5xl mx-auto mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 glass p-2 rounded-2xl">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setActive(c.id)}
              className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                active === c.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "hover:bg-muted/50"
              }`}>
              <c.icon className="w-5 h-5" />
              <span>{c.label}</span>
              <span className={`text-[10px] font-normal ${active === c.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{c.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="px-4 sm:px-6 max-w-7xl mx-auto pb-16">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Bu kategoriya uchun tarif topilmadi.</p>
        ) : (
          <div className={`grid gap-4 ${filtered.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" :
            filtered.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"}`}>
            {filtered.map((p, i) => {
              const features = enabledFeatures(p);
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`glass-strong p-6 rounded-2xl relative flex flex-col ${
                    p.highlight ? "border-primary shadow-2xl shadow-primary/20" : ""
                  }`}>
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                      Eng mashhur
                    </div>
                  )}
                  <h3 className="font-heading font-black text-xl mb-1">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {formatLimit(p.max_students)} o'quvchi · {formatLimit(p.max_teachers)} o'qituvchi
                  </p>
                  <div className="mb-5">
                    <span className="text-3xl font-heading font-black">{formatPrice(p.monthly_price)}</span>
                    <span className="text-sm text-muted-foreground"> {p.currency}/oy</span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mb-4 italic">{p.description}</p>
                  )}
                  <ul className="space-y-2 mb-6 flex-1">
                    {features.slice(0, 8).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {features.length > 8 && (
                      <li className="text-xs text-muted-foreground pl-6">+ {features.length - 8} ta yana</li>
                    )}
                  </ul>
                  <Link to="/demo" className={`block w-full text-center py-2.5 rounded-lg font-semibold text-sm transition ${
                    p.highlight ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90" :
                    "border border-border hover:border-primary/50"
                  }`}>
                    14 kun bepul <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground max-w-xl mx-auto">
          Barcha tariflarga: ma'lumot ko'chirish bepul · Bepul yangilanishlar · 99.9% uptime kafolati ·
          <Link to="/demo" className="text-primary hover:underline ml-1">Maslahat olish</Link>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
