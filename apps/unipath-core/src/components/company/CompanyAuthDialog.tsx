import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  companyName: string;
  primaryColor?: string;
  defaultTab?: "login" | "signup";
  accountType?: "customer" | "staff";
  onSuccess?: () => void;
}

const CompanyAuthDialog = ({
  open, onOpenChange, companyId, companyName,
  primaryColor = "#4B8BF5", defaultTab = "login", accountType = "customer", onSuccess,
}: Props) => {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });

  const ensureMembership = async (uid: string) => {
    const { data: existing } = await (supabase as any)
      .from("company_customers")
      .select("id, account_type, is_active")
      .eq("company_id", companyId)
      .eq("user_id", uid)
      .maybeSingle();

    // Staff login: must have an existing staff row created by the company owner
    if (accountType === "staff") {
      if (!existing || existing.account_type !== "staff") {
        toast.error("Sizga xodim huquqi berilmagan. Kompaniya admini bilan bog'laning.");
        return false;
      }
      if (existing.is_active === false) {
        toast.error("Xodim akkauntingiz faol emas.");
        return false;
      }
      return true;
    }

    if (existing) return true;

    await (supabase as any).from("company_customers").insert({
      company_id: companyId, user_id: uid,
      full_name: form.fullName || null,
      phone: form.phone || null,
      email: form.email || null,
      account_type: "customer",
    });
    return true;
  };

  const routeAfterAuth = async (uid: string) => {
    // Find membership row for THIS company
    const { data: row } = await (supabase as any)
      .from("company_customers")
      .select("account_type, is_active")
      .eq("company_id", companyId)
      .eq("user_id", uid)
      .maybeSingle();
    if (row && row.is_active === false) {
      toast.error("Akkauntingiz faol emas. Kompaniya bilan bog'laning.");
      return;
    }
    // Staff also need to be members of tour_company_members for the company panel.
    if (row?.account_type === "staff") {
      window.location.href = "/agent";
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await signInWithEmail(form.email, form.password);
      if (error) {
        toast.error(error.message.includes("Invalid") ? "Email yoki parol noto'g'ri" : error.message);
        return;
      }
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      const ok = await ensureMembership(u.id);
      if (!ok) { await supabase.auth.signOut(); return; }
      toast.success("Xush kelibsiz!");
      onSuccess?.();
      onOpenChange(false);
      await routeAfterAuth(u.id);
    } finally { setSubmitting(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Parol kamida 6 ta belgi");
    setSubmitting(true);
    try {
      const { error } = await signUpWithEmail(form.email, form.password, form.fullName, form.phone);
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Bu email band. Pastdan kiring.");
          setTab("login"); return;
        }
        toast.error("Ro'yxatdan o'tishda xatolik. Iltimos qaytadan urinib ko'ring."); return;
      }
      // Try sign in immediately (auto-confirm flows or already-confirmed)
      const { error: signErr } = await signInWithEmail(form.email, form.password);
      if (signErr) {
        toast.success("Akkaunt yaratildi! Email orqali tasdiqlang va keyin kiring.");
        setTab("login"); return;
      }
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) await ensureMembership(u.id);
      toast.success("Akkaunt yaratildi!");
      onSuccess?.();
      onOpenChange(false);
      if (u) await routeAfterAuth(u.id);
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {accountType === "staff" ? "Xodim sifatida kirish" : `${companyName}'ga xush kelibsiz`}
          </DialogTitle>
          <DialogDescription>
            {accountType === "staff"
              ? "Kompaniya xodimi panel hisobingizga kiring."
              : "Mijoz akkaunt — buyurtmalaringizni boshqaring va aksiya'lardan foydalaning."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-2">
          {accountType === "staff" ? (
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="login">Kirish</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Kirish</TabsTrigger>
              <TabsTrigger value="signup">Ro'yxatdan o'tish</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <Label className="text-xs">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Parol</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showPwd ? "text" : "password"} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-10 pr-10 h-11 rounded-xl" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl text-white font-semibold" style={{ background: primaryColor }}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Kirish
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <Label className="text-xs">To'liq ism</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Telefon</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Parol (min 6 belgi)</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showPwd ? "text" : "password"} required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-10 pr-10 h-11 rounded-xl" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl text-white font-semibold" style={{ background: primaryColor }}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Akkaunt yaratish
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyAuthDialog;
