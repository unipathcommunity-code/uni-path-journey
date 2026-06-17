import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Compass, ArrowRight, CheckCircle2, GraduationCap, Building2, User, Loader2, Zap, Shield, Globe, BarChart3, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ORG_TYPES = [
  { value: "center", label: "O'quv markazi", icon: Compass, desc: "Tilshunoslik, IT, repetitorlik markazlari" },
  { value: "school", label: "Xususiy maktab", icon: Building2, desc: "1-11 sinflar, parallellar bilan" },
  { value: "tutor", label: "Repetitor / Studiya", icon: User, desc: "1-1 yoki kichik guruhlar" },
];

const FEATURES = [
  { icon: Zap, title: "NOVA Yordamchi 24/7", desc: "O'quvchilar uchun shaxsiy aqlli mentor" },
  { icon: GraduationCap, title: "Avtomatik darsliklar", desc: "1 daqiqada 10-slayd taqdimot tayyor bo'ladi" },
  { icon: Shield, title: "QR + GPS davomat", desc: "2 sekundda kirish, soxtalashtirish mumkin emas" },
  { icon: BarChart3, title: "Real vaqtli analitika", desc: "Davomat, baholar, to'lovlar — bir ekran" },
  { icon: Globe, title: "3 til (UZ/RU/EN)", desc: "Har bir markaz o'z tilini tanlaydi" },
  { icon: Palette, title: "Sizning brendingiz", desc: "Logo, rang — to'liq oq-yorliq panel" },
];

const Demo = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    org_name: "",
    org_type: "center",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    city: "",
    expected_students: "",
    message: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("leads").insert({
      ...form,
      expected_students: form.expected_students ? Number(form.expected_students) : null,
      source: "website",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSubmitted(true);
    toast.success("Murojaatingiz qabul qilindi!");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-strong p-8 rounded-2xl max-w-md text-center">
          <div className="w-16 h-16 mx-auto bg-success/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-2">Rahmat, {form.contact_name}!</h2>
          <p className="text-muted-foreground mb-6">
            Murojaatingiz qabul qilindi. Jamoamiz 24 soat ichida {form.contact_email} manziliga aloqaga chiqadi va
            sizning <strong>{form.org_name}</strong> markazingiz uchun shaxsiy demo tashkil qiladi.
          </p>
          <button onClick={() => navigate("/")} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-semibold">
            Bosh sahifaga qaytish
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background nova-grid-bg relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-full bg-primary/5 blur-[200px] pointer-events-none" />

      {/* Hero */}
      <section className="relative z-10 px-4 sm:px-6 pt-12 sm:pt-20 pb-8 max-w-6xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-primary/30 text-xs font-semibold text-primary mb-6">
          <Zap className="w-3 h-3" /> NOVA · Apple of Education
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl font-heading font-black mb-4">
          O'quv markazingiz uchun <span className="text-gradient-primary">o'z NOVA kabineti</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          eMaktab va LC-Up dan ko'ra zamonaviyroq. Sizning logoyingiz, sizning rangingiz, sizning ma'lumotlaringiz —
          to'liq izolyatsiya. Aqlli yordamchi, avtomatik darsliklar, QR davomat. 14 kun bepul sinov.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-3 flex-wrap">
          <a href="#demo-form" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-primary/30">
            Bepul demo so'rash <ArrowRight className="w-4 h-4" />
          </a>
          <button onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 px-6 py-3 glass border border-border rounded-xl font-semibold">
            Kirish
          </button>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 px-4 sm:px-6 py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="glass p-5 rounded-2xl border border-border hover:border-primary/40 transition">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo form */}
      <section id="demo-form" className="relative z-10 px-4 sm:px-6 py-12 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="glass-strong p-6 sm:p-8 rounded-2xl">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-2">Demo so'rash</h2>
          <p className="text-sm text-muted-foreground mb-6">
            24 soat ichida sizga aloqaga chiqamiz va shaxsiy demoni tashkil qilamiz.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">
                Tashkilot turi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ORG_TYPES.map((t) => (
                  <button type="button" key={t.value}
                    onClick={() => setForm({ ...form, org_type: t.value })}
                    className={`p-3 rounded-xl border text-left transition ${
                      form.org_type === t.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    }`}>
                    <t.icon className={`w-5 h-5 mb-1 ${form.org_type === t.value ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <Input label="Tashkilot nomi *" value={form.org_name} required
              onChange={(v) => setForm({ ...form, org_name: v })} />
            <Input label="Ismingiz *" value={form.contact_name} required
              onChange={(v) => setForm({ ...form, contact_name: v })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Email *" type="email" value={form.contact_email} required
                onChange={(v) => setForm({ ...form, contact_email: v })} />
              <Input label="Telefon" value={form.contact_phone}
                onChange={(v) => setForm({ ...form, contact_phone: v })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Shahar" value={form.city}
                onChange={(v) => setForm({ ...form, city: v })} />
              <Input label="Taxminiy o'quvchilar soni" type="number" value={form.expected_students}
                onChange={(v) => setForm({ ...form, expected_students: v })} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Xabar (ixtiyoriy)</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="Sizning markazingiz haqida bir-ikki so'z..." />
            </div>

            <button type="submit" disabled={loading}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-primary/30 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Yuborish"}
            </button>
          </form>
        </motion.div>
      </section>

      <footer className="relative z-10 text-center text-xs text-muted-foreground py-8">
        © NOVA Platform · Apple of Education
      </footer>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) => (
  <div>
    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">{label}</label>
    <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition" />
  </div>
);

export default Demo;
