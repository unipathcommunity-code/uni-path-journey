import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, ArrowRight, Zap, Shield, Globe, BarChart3, Building2,
  User, School, CheckCircle2, Users, Wallet, MessageSquare, QrCode,
  ChevronRight, Star, TrendingUp, Lock, Smartphone, Compass, Lightbulb, Wand2,
  Rocket,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import ThemeLangSwitcher from "@/components/ThemeLangSwitcher";

const ORG_TYPES = [
  { icon: User, title: "Repetitor", desc: "Yakka tartibda yoki kichik guruh", color: "text-primary" },
  { icon: Compass, title: "O'quv markazi", desc: "Til, IT, repetitorlik markazlari", color: "text-accent" },
  { icon: Building2, title: "Xususiy maktab", desc: "1-11 sinflar, parallellar bilan", color: "text-success" },
  { icon: School, title: "Akademiya", desc: "Universitet va katta tashkilotlar", color: "text-warning" },
];

const FEATURES = [
  { icon: QrCode, title: "QR + GPS davomat", desc: "2 sekundda kirish, soxtalashtirish mumkin emas" },
  { icon: Compass, title: "NOVA Yordamchi 24/7", desc: "Har bir o'quvchiga shaxsiy mentor" },
  { icon: BarChart3, title: "Real-time analitika", desc: "Davomat, baholar, to'lovlar — bir ekranda" },
  { icon: Wallet, title: "Moliyaviy boshqaruv", desc: "To'lovlar, qarzlar, ish haqi avtomatik" },
  { icon: Users, title: "CRM lid voronkasi", desc: "Lidlardan to'lovgacha to'liq kuzatuv" },
  { icon: Globe, title: "O'z saytingiz", desc: "Har markaz uchun tayyor veb-sayt" },
  { icon: MessageSquare, title: "SMS / Telegram", desc: "Avtomatik xabarlar va eslatmalar" },
  { icon: Shield, title: "To'liq xavfsizlik", desc: "Ma'lumotlar izolyatsiyasi, RLS, audit log" },
];

const PLANS_PREVIEW = [
  { name: "Tutor Solo", price: "99 000", students: "20 gacha", highlight: false },
  { name: "Center Growth", price: "490 000", students: "150 gacha", highlight: true, badge: "Mashhur" },
  { name: "School Premium", price: "1 490 000", students: "1500 gacha", highlight: false },
];

const FAQ = [
  { q: "NOVA boshqa tizimlardan nimasi bilan farq qiladi?", a: "Bizda LMS + CRM + Moliya + NOVA Yordamchi + Veb-sayt — hammasi bitta joyda. Sizga 5 xil dasturga obuna kerak emas." },
  { q: "Ma'lumotlarimiz xavfsizmi?", a: "Ha. Har bir markaz to'liq izolyatsiyalangan baza, RLS himoyasi, audit log. Boshqa markazlar sizning ma'lumotingizni ko'ra olmaydi." },
  { q: "O'z domeningizni ulash mumkinmi?", a: "Ha, Pro va undan yuqori tariflarda. Misol: kabinet.markazingiz.uz" },
  { q: "Bepul sinov qancha davom etadi?", a: "14 kun to'liq funksiyali bepul sinov. Karta talab qilinmaydi." },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  // If logged in, give a quick way to enter — but only platform roles land in NOVA dashboards.
  // Teachers/students/parents/accountants must use their org's site to access their cabinets.
  const enterApp = () => {
    if (!user) { navigate("/auth"); return; }
    if (hasRole("superadmin")) navigate("/superadmin");
    else if (hasRole("owner")) navigate("/owner");
    else if (hasRole("admin")) navigate("/admin");
    else navigate("/auth");
  };

  useEffect(() => {
    document.title = "NOVA — Apple of Education | O'quv markazlar va xususiy maktablar uchun";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "NOVA — o'quv markazlar, xususiy maktablar va repetitorlar uchun zamonaviy SaaS platforma. Aqlli yordamchi, QR davomat, moliya, CRM va o'z veb-saytingiz — bitta joyda.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description"; m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-black text-lg tracking-tight">NOVA</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Imkoniyatlar</a>
            <a href="#audience" className="hover:text-foreground transition">Kim uchun</a>
            <Link to="/pricing" className="hover:text-foreground transition">Tariflar</Link>
            <a href="#faq" className="hover:text-foreground transition">Savollar</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeLangSwitcher />
            <button onClick={enterApp}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:border-primary/50 transition">
              {user ? "Kabinet" : "Kirish"}
            </button>
            <Link to="/demo"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 transition">
              Demo so'rash <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 sm:pt-24 pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 nova-grid-bg opacity-40 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/10 blur-[180px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30 text-xs font-semibold text-primary mb-6">
            <Zap className="w-3 h-3" /> Apple of Education · UZ · RU · EN
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-heading font-black leading-[1.05] tracking-tight mb-6">
            O'quv biznesingiz uchun{" "}
            <span className="text-gradient-primary">to'liq operatsion tizim</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            eMaktab va LC-Up dan zamonaviyroq. <strong className="text-foreground">LMS + CRM + Moliya + Yordamchi + Veb-sayt</strong> —
            hammasi bitta platformada. Repetitorlardan akademiyalargacha har qanday hajm uchun.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 flex-wrap mb-8">
            <Link to="/demo"
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-base shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all hover:-translate-y-0.5">
              14 kun bepul sinash <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3.5 glass border border-border rounded-xl font-semibold text-base hover:border-primary/50 transition">
              Tariflarni ko'rish
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Karta talab qilinmaydi</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 5 daqiqada sozlash</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Ma'lumot ko'chirish bepul</span>
          </motion.div>
        </div>

        {/* Hero stats */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative mt-16 max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { v: "10x", l: "Tezroq sozlash" },
            { v: "60fps", l: "Ravon UI" },
            { v: "100%", l: "Mobil mos" },
            { v: "24/7", l: "NOVA Yordamchi" },
          ].map((s) => (
            <div key={s.l} className="glass p-4 sm:p-5 rounded-2xl text-center">
              <div className="text-2xl sm:text-3xl font-heading font-black text-gradient-primary">{s.v}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Audience */}
      <section id="audience" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Kim uchun</div>
          <h2 className="text-3xl sm:text-5xl font-heading font-black mb-3">Har qanday o'quv biznes uchun</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bitta repetitordan tortib 5000 o'quvchili akademiyagacha. Sizning hajmingizga moslashadigan tarif tanlang.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ORG_TYPES.map((o, i) => (
            <motion.div key={o.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="glass-strong p-6 rounded-2xl hover:-translate-y-1 transition-all hover:border-primary/40">
              <div className={`w-12 h-12 rounded-xl bg-card flex items-center justify-center mb-4 ${o.color}`}>
                <o.icon className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-1">{o.title}</h3>
              <p className="text-sm text-muted-foreground">{o.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Imkoniyatlar</div>
            <h2 className="text-3xl sm:text-5xl font-heading font-black mb-3">Sizga kerak bo'lgan hamma narsa</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              5 xil dastur o'rniga bitta NOVA. Boshqaruv, moliya, marketing — hammasi yagona ekranda.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                className="glass p-5 rounded-2xl hover:border-primary/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans preview */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Tariflar</div>
          <h2 className="text-3xl sm:text-5xl font-heading font-black mb-3">Hajmingizga mos tarif</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            10 ta tarif rejasi: repetitorlardan akademiyalargacha. Hammasida 14 kun bepul sinov.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {PLANS_PREVIEW.map((p) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className={`glass-strong p-6 rounded-2xl relative ${p.highlight ? "border-primary shadow-2xl shadow-primary/20 scale-105" : ""}`}>
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  {p.badge}
                </div>
              )}
              <h3 className="font-heading font-bold text-lg mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{p.students}</p>
              <div className="mb-4">
                <span className="text-3xl font-heading font-black">{p.price}</span>
                <span className="text-sm text-muted-foreground"> so'm/oy</span>
              </div>
              <Link to="/pricing" className="block w-full text-center py-2.5 rounded-lg border border-border hover:border-primary/50 text-sm font-semibold transition">
                Batafsil
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/pricing" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
            Barcha 10 ta tarifni ko'rish <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Why NOVA */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="absolute inset-0 nova-grid-bg opacity-30 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Nega NOVA?</div>
            <h2 className="text-3xl sm:text-5xl font-heading font-black mb-3">eMaktab va LC-Up'dan farqlar</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: "10x tezroq", desc: "60fps animatsiyalar, oniy yuklanish, real-vaqt yangilanishlar" },
              { icon: Lightbulb, title: "Aqlli avtomatlashtirish", desc: "Mentor, dars rejasi, taqdimot — bir tugma bosishda tayyor" },
              { icon: Smartphone, title: "Mobil-birinchi", desc: "Telefon ekranida ham desktopdek mukammal ishlaydi" },
              { icon: Lock, title: "Haqiqiy izolyatsiya", desc: "Har markaz alohida — boshqalar sizni ko'ra olmaydi" },
              { icon: TrendingUp, title: "O'sishingizga moslashadi", desc: "20 dan 5000 o'quvchigacha — bitta tizimda" },
              { icon: Star, title: "Premium dizayn", desc: "Apple darajasidagi UI/UX — o'quvchilaringiz uchun ham" },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="glass p-5 rounded-2xl">
                <f.icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-heading font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Savol-javob</div>
          <h2 className="text-3xl sm:text-5xl font-heading font-black">Tez-tez so'raladigan</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <motion.details key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="glass p-5 rounded-2xl group">
              <summary className="font-heading font-bold cursor-pointer flex items-center justify-between gap-4">
                {item.q}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform flex-shrink-0" />
              </summary>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{item.a}</p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto glass-strong p-10 sm:p-16 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="relative">
            <Rocket className="w-12 h-12 text-primary mx-auto mb-5" />
            <h2 className="text-3xl sm:text-5xl font-heading font-black mb-4">
              O'quv biznesingizni <span className="text-gradient-primary">bugun</span> yangilang
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              5 daqiqada sozlang. 14 kun bepul. Karta talab qilinmaydi. Istalgan vaqtda bekor qiling.
            </p>
            <Link to="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all hover:-translate-y-0.5">
              Bepul demo olish <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground">NOVA</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/pricing" className="hover:text-foreground transition">Tariflar</Link>
            <Link to="/demo" className="hover:text-foreground transition">Demo</Link>
            <Link to="/auth" className="hover:text-foreground transition">Kirish</Link>
          </div>
          <div className="text-xs flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Asoschisi: <span className="text-foreground font-semibold">Hasanov Behruz</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
