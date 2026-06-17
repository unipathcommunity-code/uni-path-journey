import { motion } from "framer-motion";
import {
  Shield, Mail, Lock, User, ArrowRight, Loader2,
  Plane, GraduationCap, Building2, Utensils, Bed, Dumbbell
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import ThemeLangSwitcher from "@/components/ThemeLangSwitcher";

type AuthMode = "login" | "signup" | "forgot";

/** Returns icon + label for a vertical */
function verticalMeta(vertical: string | null) {
  switch (vertical) {
    case "tour":        return { Icon: Plane,          label: "Turistik Kompaniya", color: "text-sky-400" };
    case "academy":     return { Icon: GraduationCap,  label: "O'quv Markaz",       color: "text-emerald-400" };
    case "hotel":       return { Icon: Bed,             label: "Mehmonxona",          color: "text-indigo-400" };
    case "restaurant":  return { Icon: Utensils,        label: "Restoran",            color: "text-orange-400" };
    case "gym":         return { Icon: Dumbbell,        label: "Sport Zal",           color: "text-rose-400" };
    default:            return { Icon: Building2,       label: "Biznes",              color: "text-primary" };
  }
}

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const { activeTenant } = useApp();

  // Branding — tenant subdomain OR generic UniPath
  const tenantName  = activeTenant?.name || "UniPath";
  const vertical    = activeTenant?.business_type || null;
  const { Icon, label, color } = verticalMeta(vertical);
  const logoUrl     = activeTenant?.config?.branding?.logo_url;

  const { user, signOut } = useAuth(); // Import useAuth from contexts/AuthContext or hooks/useAuth
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "wrong_domain") {
        if (user) {
          await signOut();
        }
        toast.error("Siz o'quv markazingiz yoki biznesingiz domeni orqali kirishingiz kerak!");
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      if (user && !loading) {
        navigate("/dashboard");
      }
    };
    checkAuthStatus();
  }, [user, loading, navigate, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Parolni tiklash havolasi yuborildi!");
        setMode("login");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: fullName,
              tenant_id: activeTenant?.id || null,
              role: "student"
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Hisob yaratildi! Email orqali tasdiqlang.");
        return;
      }

      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast.success("Xush kelibsiz!");
      // DashboardRedirect will handle role-based routing
      navigate("/dashboard");

    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const modeLabel = {
    login:  "Hisobingizga kiring",
    signup: "Yangi hisob yaratish",
    forgot: "Parolni tiklash",
  }[mode];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[90px] pointer-events-none" />

      {/* Top-right switcher */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeLangSwitcher />
      </div>

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 z-10"
      >
        <div className="flex items-center justify-center mb-3">
          {logoUrl ? (
            <img src={logoUrl} alt={tenantName} className="h-14 w-14 rounded-2xl object-cover border border-border shadow-lg" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
              <Icon className={`w-7 h-7 ${color}`} />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{tenantName}</h1>
        {activeTenant && (
          <span className="inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {label}
          </span>
        )}
        <p className="text-muted-foreground text-sm mt-2">{modeLabel}</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="w-full max-w-sm z-10 bg-card border border-border rounded-2xl p-7 shadow-xl space-y-5"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ism Familiya</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text" value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Behruz Hasanov" required
                  className="w-full bg-muted/40 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Elektron pochta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="siz@email.com" required
                className="w-full bg-muted/40 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Maxfiy so'z</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full bg-muted/40 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="text-right">
              <button type="button" onClick={() => setMode("forgot")}
                className="text-xs text-primary hover:underline">
                Parolni unutdingizmi?
              </button>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-[0_0_20px_rgba(0,0,0,0.1)]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Kirish" : mode === "signup" ? "Ro'yxatdan O'tish" : "Havolani Yuborish"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Mode switcher */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === "forgot" ? (
            <button type="button" onClick={() => setMode("login")}
              className="text-primary hover:underline font-medium">
              ← Kirishga qaytish
            </button>
          ) : (
            <>
              {mode === "login" ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"}{" "}
              <button type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary hover:underline font-medium">
                {mode === "login" ? "Ro'yxatdan O'tish" : "Kirish"}
              </button>
            </>
          )}
        </p>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-xs text-muted-foreground mt-8 z-10 flex items-center gap-2"
      >
        <Shield className="w-3 h-3" />
        {activeTenant ? `${tenantName} · UniPath SaaS Platform tomonidan` : "Hasanov Behruz Feruzovich asos solgan"}
      </motion.p>
    </div>
  );
};

export default Auth;
