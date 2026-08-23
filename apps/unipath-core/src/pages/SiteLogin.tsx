import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, ArrowRight, Eye, EyeOff, Lock, Mail as MailIcon,
  User as UserIcon, GraduationCap, ArrowLeft, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { siteHomePath, siteLoginPath } from "@/lib/siteRoutes";

type Mode = "login" | "signup" | "forgot";

interface Branding {
  org_id: string;
  org_name: string;
  org_logo_url: string | null;
  primary_color: string;
  accent_color: string;
  site_title: string;
  site_tagline: string | null;
}

/**
 * SiteLogin — branded sign-in for ONE education-center.
 *
 * Why this page exists:
 *   The main UniPath portal (/auth) is reserved for platform roles
 *   (superadmin / owner / admin). Teachers, students, parents and
 *   accountants enter through their own center's site, which is fully
 *   branded with that agency's logo, name and color palette — no UniPath
 *   chrome, no Lovable badges, no cross-tenant noise.
 *
 * Behavior:
 *   - Reads center branding from `site_branding_by_slug` (security definer
 *     RPC limited to PUBLISHED sites). Falls back gracefully if missing.
 *   - Login / signup / forgot-password are all on this single screen
 *     (toggle between modes — no extra navigation, no popups).
 *   - On success the user is dropped straight into the role-appropriate
 *     cabinet. Brand-new signups land in the student cabinet by default;
 *     the owner can later promote them to teacher / parent / accountant
 *     from the admin panel.
 */
const SiteLogin = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [brand, setBrand] = useState<Branding | null>(null);
  const [brandLoading, setBrandLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  /* ---------- Load branding ---------- */
  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase.rpc("site_branding_by_slug", { _slug: slug });
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setNotFound(true);
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        setBrand(row as any);
        // SEO + tab title
        document.title = `${row.site_title || row.org_name} — Kirish`;
      }
      setBrandLoading(false);
    })();
  }, [slug]);

  /* ---------- Apply tenant brand colors as CSS vars (scoped to this view) ---------- */
  useEffect(() => {
    if (!brand) return;
    const root = document.documentElement;
    const prevP = root.style.getPropertyValue("--primary");
    const prevA = root.style.getPropertyValue("--accent");
    if (brand.primary_color) root.style.setProperty("--primary", brand.primary_color);
    if (brand.accent_color) root.style.setProperty("--accent", brand.accent_color);
    return () => {
      // Restore so the rest of the app (other tenants / UniPath portal) is unaffected
      if (prevP) root.style.setProperty("--primary", prevP);
      else root.style.removeProperty("--primary");
      if (prevA) root.style.setProperty("--accent", prevA);
      else root.style.removeProperty("--accent");
    };
  }, [brand]);

  const subtitle = useMemo(() => {
    if (mode === "login") return "O'z hisobingizga kiring";
    if (mode === "signup") return "Yangi hisob yaratish";
    return "Parolni tiklash uchun emailingizni kiriting";
  }, [mode]);

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Tiklash havolasi emailga yuborildi");
        setMode("login");
        return;
      }

      if (mode === "signup") {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}${siteLoginPath(slug!)}`,
          },
        });
        if (error) throw error;

        // If the project allows immediate session (e.g. auto-confirm), claim the
        // org right away. Otherwise the same claim runs at first login below.
        const newUid = signUpData.user?.id;
        if (newUid) {
          await supabase.rpc("claim_signup_for_org", {
            _user_id: newUid,
            _org_id: brand.org_id,
          });
        }

        toast.success(`Hisob yaratildi! ${brand.org_name} markaziga biriktirildingiz.`);
        setMode("login");
        return;
      }

      // login
      const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const uid = signIn.user?.id;
      if (!uid) {
        toast.error("Kutilmagan xatolik. Qayta urining.");
        return;
      }

      // Tenant gate: this branded login is ONLY for users that belong to
      // THIS center. If a user from another org tries to slip in via this
      // URL, sign them right back out.
      const { data: userOrg } = await supabase.rpc("user_org_id", { _user_id: uid });
      const DEFAULT_ORG = "00000000-0000-0000-0000-000000000001";

      // Brand-new user still in default org → claim into this tenant.
      if (!userOrg || userOrg === DEFAULT_ORG) {
        await supabase.rpc("claim_signup_for_org", {
          _user_id: uid,
          _org_id: brand.org_id,
        });
      } else if (userOrg !== brand.org_id) {
        // Belongs to a DIFFERENT center — block.
        try {
          await Promise.race([
            supabase.auth.signOut(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000))
          ]);
        } catch (e) {
          console.warn("Sign out timed out:", e);
          if (typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                localStorage.removeItem(key);
              }
            }
          }
        }
        toast.error(
          `Bu hisob ${brand.org_name} markaziga tegishli emas. Iltimos, o'z markazingiz sayti orqali kiring.`
        );
        return;
      }


      // Resolve roles, then redirect into the right cabinet.
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const roles = (rolesData || []).map((r: any) => r.role);

      toast.success(`Xush kelibsiz, ${brand.org_name}!`);

      // Owners/admins go to their dashboards even when they happen to enter
      // through the public site (handy on shared devices).
      if (roles.includes("superadmin")) navigate("/super-admin");
      else if (roles.includes("owner") || roles.includes("admin")) navigate("/admin");
      else if (roles.includes("accountant")) navigate("/accountant");
      else navigate("/student/dashboard"); // default: student cabinet
    } catch (err: any) {
      toast.error(err?.message || "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Loading / not-found states ---------- */
  if (brandLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-heading font-bold mb-2">Sahifa topilmadi</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Bu o'quv markaz mavjud emas yoki sayt nashr qilinmagan.
          </p>
          <Link to="/" className="text-primary text-sm font-semibold hover:underline">
            Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    );
  }

  const initials = brand.org_name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Soft brand glow background */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.10) 0%, transparent 60%), radial-gradient(40% 35% at 80% 100%, hsl(var(--accent) / 0.08) 0%, transparent 60%)",
        }}
      />

      {/* Slim top bar — back to public site */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          to={siteHomePath(slug!)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Sayt
        </Link>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest text-muted-foreground">
          <ShieldCheck className="w-3 h-3" /> SHIFRLANGAN ULANISH
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="glass-strong rounded-3xl w-full max-w-sm p-7 sm:p-8 shadow-2xl"
          style={{ boxShadow: "0 20px 60px -20px hsl(var(--primary) / 0.35)" }}
        >
          {/* Brand header */}
          <div className="flex flex-col items-center mb-6">
            {brand.org_logo_url ? (
              <img
                src={brand.org_logo_url}
                alt={`${brand.org_name} logosi`}
                loading="lazy"
                className="w-20 h-20 rounded-2xl object-contain bg-white/80 p-2 shadow-md"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-primary-foreground shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                }}
              >
                {initials || <GraduationCap className="w-8 h-8" />}
              </div>
            )}
            <h1 className="mt-4 text-xl sm:text-2xl font-heading font-bold text-center">
              {brand.org_name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 text-center">{subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field
                icon={UserIcon}
                type="text"
                placeholder="To'liq ism"
                required
                value={fullName}
                onChange={setFullName}
                autoComplete="name"
              />
            )}

            <Field
              icon={MailIcon}
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />

            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Parol"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-muted/40 rounded-xl py-3 pl-10 pr-10 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Parolni yashirish" : "Parolni ko'rsatish"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-primary hover:underline self-start"
              >
                Parolni unutdingizmi?
              </button>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-1 py-3 rounded-xl font-semibold text-sm text-primary-foreground inline-flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                boxShadow: "0 10px 30px -10px hsl(var(--primary) / 0.5)",
              }}
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" && "Kirish"}
                  {mode === "signup" && "Ro'yxatdan o'tish"}
                  {mode === "forgot" && "Tiklash havolasini yuborish"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode toggle */}
          <div className="text-center text-xs text-muted-foreground mt-5">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-primary hover:underline font-semibold"
              >
                ← Kirish sahifasiga qaytish
              </button>
            ) : (
              <>
                {mode === "login" ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-primary hover:underline font-semibold"
                >
                  {mode === "login" ? "Ro'yxatdan o'ting" : "Kiring"}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </main>

      {/* Tenant-clean footer — no platform name, no badges */}
      <footer className="text-center text-[10px] text-muted-foreground py-5">
        © {new Date().getFullYear()} {brand.org_name}
      </footer>
    </div>
  );
};

/* --------- Reusable input ---------- */
const Field = ({
  icon: Icon,
  type,
  placeholder,
  required,
  value,
  onChange,
  autoComplete,
}: {
  icon: any;
  type: string;
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <input
      type={type}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      className="w-full bg-muted/40 rounded-xl py-3 pl-10 pr-3 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
    />
  </div>
);

export default SiteLogin;
