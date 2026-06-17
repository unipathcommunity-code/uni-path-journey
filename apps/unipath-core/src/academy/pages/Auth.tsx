import { motion } from "framer-motion";
import { Shield, GraduationCap, Mail, Lock, User, ArrowRight, Loader2, Building2, Info } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import ThemeLangSwitcher from "@/components/ThemeLangSwitcher";

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success(t("auth.reset_sent"));
        setMode("login");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success(t("auth.account_created"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Smart redirect by role — fetch fresh roles
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
          const roles = (rolesData || []).map((r) => r.role);

          // The NOVA portal (/auth) is reserved for PLATFORM staff only.
          // Tenant users (teacher/student/parent/accountant/owner of a center)
          // must come through their own /c/<slug>/login.
          const isPlatformStaff = roles.includes("superadmin");
          if (!isPlatformStaff) {
            await supabase.auth.signOut();
            toast.error(
              "Bu hisob NOVA platformasiga tegishli emas. Iltimos, o'z o'quv markazingiz sayti orqali kiring."
            );
            return;
          }

          toast.success(t("auth.welcome"));
          navigate("/superadmin");
        } else {
          navigate("/auth");
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background nova-grid-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <ThemeLangSwitcher />
      </div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold font-heading text-gradient-primary tracking-tight mb-2">NOVA</h1>
        <p className="text-muted-foreground text-sm">
          {mode === "login" ? t("auth.welcome_back") : mode === "signup" ? t("auth.create_account") : t("auth.reset_password")}
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-strong p-8 w-full max-w-sm z-10 space-y-5">
        {mode === "signup" && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 flex gap-2 text-[11px] leading-relaxed">
            <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-foreground/90">
              <strong className="text-warning">Faqat NOVA platforma xodimlari uchun.</strong>{" "}
               O'quv markaz egalari, o'qituvchilar, o'quvchilar va ota-onalar — o'z markazingiz sayti orqali kiring (
              <Building2 className="w-3 h-3 inline -mt-0.5" /> inkluone.info/c/sizning-markaz).
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">{t("auth.full_name")}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Behruz Hasanov" required
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-medium">{t("auth.email")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nova.edu" required
                className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">{t("auth.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>
          )}

          {mode === "login" && (
            <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
              {t("auth.forgot_password")}
            </button>
          )}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                {mode === "login" ? t("auth.sign_in") : mode === "signup" ? t("auth.sign_up") : t("auth.send_reset")}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "forgot" ? (
            <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
              {t("auth.back_to_login")}
            </button>
          ) : (
            <>
              {mode === "login" ? t("auth.no_account") : t("auth.have_account")}{" "}
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary hover:underline font-medium">
                {mode === "login" ? t("auth.sign_up") : t("auth.sign_in")}
              </button>
            </>
          )}
        </p>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-xs text-muted-foreground mt-8 z-10 flex items-center gap-2">
        <Shield className="w-3 h-3" /> {t("auth.founded_by")}
      </motion.p>
    </div>
  );
};

export default Auth;
