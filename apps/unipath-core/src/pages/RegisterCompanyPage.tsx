import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyCompany } from "@/hooks/useTourCompany";

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);

const isValidSlug = (s: string) => /^[a-z0-9]{3,12}$/.test(s);

const RegisterCompanyPage = () => {
  const { user, loading, signUpWithEmail } = useAuth();
  const { data: existing } = useMyCompany();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(user ? 2 : 1);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [account, setAccount] = useState({ fullName: "", email: "", password: "" });
  const [company, setCompany] = useState({
    name: "", slug: "", email: "", phone: "", description: "", city: "Toshkent",
  });

  if (loading)
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (existing) return <Navigate to="/company" replace />;

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (account.password.length < 6) return toast.error("Parol kamida 6 ta belgidan iborat bo'lsin");
    setSubmitting(true);
    try {
      const { error } = await signUpWithEmail(account.email, account.password, account.fullName, "");
      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("Bu email allaqachon ro'yxatdan o'tgan. Avval kiring.");
          navigate("/auth"); return;
        }
        throw error;
      }
      setCompany((c) => ({ ...c, email: account.email }));
      toast.success("Akkaunt yaratildi!");
      setStep(2);
    } catch (e: any) {
      toast.error(e.message || "Xatolik yuz berdi");
    } finally { setSubmitting(false); }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Avval akkauntni yarating"); setStep(1); return; }
    if (!company.name || !company.phone) return toast.error("Kompaniya nomi va telefon raqami shart");
    const slug = company.slug || slugify(company.name);
    if (!isValidSlug(slug)) return toast.error("Sayt manzili 3-12 ta harf yoki raqamdan iborat bo'lsin");
    setSubmitting(true);
    try {
      const { data: created, error } = await (supabase as any)
        .from("tour_companies")
        .insert({ ...company, slug, created_by: user.id })
        .select().single();
      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          toast.error("Bu sayt manzili band. Boshqasini tanlang."); return;
        }
        if (error.message.includes("tour_companies_slug_format")) {
          toast.error("Sayt manzili 3-12 ta harf yoki raqamdan iborat bo'lsin"); return;
        }
        throw error;
      }
      const { error: mErr } = await (supabase as any)
        .from("tour_company_members")
        .insert({ company_id: created.id, user_id: user.id, role: "owner" });
      if (mErr) throw mErr;
      toast.success("Kompaniya yaratildi!");
      navigate("/company");
    } catch (e: any) {
      toast.error(e.message || "Xatolik yuz berdi");
    } finally { setSubmitting(false); }
  };

  const slugValid = company.slug ? isValidSlug(company.slug) : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Bosh sahifa
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center mb-3">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Kompaniyangizni oching</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            5 daqiqada professional sayt va CRM panel.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 2 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card className="rounded-2xl border-primary/10 shadow-xl">
          {step === 1 ? (
            <>
              <CardHeader>
                <CardTitle>Akkaunt yaratish</CardTitle>
                <CardDescription>Bu sizning egalik akkauntingiz.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>To'liq ism *</Label>
                    <Input value={account.fullName} onChange={(e) => setAccount({ ...account, fullName: e.target.value })} placeholder="Ism Familiya" required className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} placeholder="siz@example.com" required className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Parol * <span className="text-muted-foreground font-normal">(min 6 belgi)</span></Label>
                    <div className="relative">
                      <Input type={showPwd ? "text" : "password"} value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} placeholder="••••••••" required minLength={6} className="h-11 rounded-xl pr-10" />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full h-12 rounded-xl font-semibold" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Davom etish <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Akkauntingiz bormi? <Link to="/auth" className="text-primary hover:underline font-medium">Kirish</Link>
                  </p>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Kompaniya ma'lumotlari</CardTitle>
                <CardDescription>Keyinchalik o'zgartirish mumkin.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCompanySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kompaniya nomi *</Label>
                    <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value, slug: company.slug || slugify(e.target.value) })} placeholder="Silk Road Tours" required className="h-11 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>Sayt manzili <span className="text-muted-foreground font-normal">(3-12 belgi)</span></Label>
                    <div className={`flex items-center gap-1 rounded-xl border px-3 h-11 bg-background focus-within:ring-2 focus-within:ring-ring ${!slugValid ? "border-destructive" : "border-input"}`}>
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">unitour.me/</span>
                      <input
                        value={company.slug}
                        onChange={(e) => setCompany({ ...company, slug: slugify(e.target.value) })}
                        maxLength={12}
                        className="flex-1 bg-transparent outline-none text-sm font-semibold text-primary"
                        placeholder="silk"
                      />
                      {company.slug && <span className="text-xs text-muted-foreground">{company.slug.length}/12</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {!slugValid ? "❌ Faqat kichik harf va raqam, 3-12 belgi" : `✓ Saytingiz: unitour.me/${company.slug || "silk"}`}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} placeholder="info@kompaniya.uz" className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon *</Label>
                      <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} placeholder="+998 90 123 45 67" required className="h-11 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Shahar</Label>
                    <Input value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Qisqa tavsif</Label>
                    <Textarea rows={3} value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })} placeholder="Bir necha jumlada kompaniyangiz haqida" className="rounded-xl" />
                  </div>
                  <Button type="submit" size="lg" className="w-full h-12 rounded-xl font-semibold" disabled={submitting || !slugValid}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Kompaniyani yaratish <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Davom etish orqali <Link to="/terms" className="text-primary hover:underline">Shartlar</Link> va{" "}
          <Link to="/privacy" className="text-primary hover:underline">Maxfiylik</Link>ga rozi bo'lasiz.
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterCompanyPage;
