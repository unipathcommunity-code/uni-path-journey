import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/unitour-logo-new.png";
import { motion } from "framer-motion";

/**
 * Login-only page. New accounts are created via /register-company (which is the
 * only signup flow on the SaaS). Public users cannot create simple accounts.
 */
const AuthPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, userRole, loading, signInWithEmail } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    if (!loading && user) {
      redirectBasedOnRole();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, loading]);

  const redirectBasedOnRole = async () => {
    if (!user) return;
    if (userRole === "super_admin" || userRole === "admin") {
      navigate("/admin");
    } else if (userRole === "moderator") {
      navigate("/operator");
    } else {
      // Check membership in any tour company
      const { data: membership } = await (supabase as any)
        .from("tour_company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      if (membership) navigate("/company");
      else navigate("/register-company");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signInWithEmail(formData.email, formData.password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email yoki parol noto'g'ri");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Email tasdiqlanmagan. Pochtangizni tekshiring.");
        } else {
          toast.error("Kirishda xatolik yuz berdi");
        }
      } else {
        toast.success("Xush kelibsiz!");
      }
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2 text-muted-foreground hover:text-primary rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Bosh sahifa
        </Button>

        <Link to="/" className="flex justify-center mb-8">
          <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg shadow-primary/10 border border-primary/10">
            <img src={logo} alt="UniTour" className="h-12 w-auto object-contain" />
          </div>
        </Link>

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-primary/10 shadow-2xl shadow-primary/10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Kompaniyaga kirish</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tour kompaniyangiz panelidan foydalaning
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-medium text-sm">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="siz@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-11 rounded-xl"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="font-medium text-sm">Parol</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 h-11 rounded-xl"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold mt-2 rounded-xl shadow-lg shadow-primary/25"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Kirish
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Hali kompaniyangiz yo'qmi?
            </p>
            <Link to="/register-company">
              <Button variant="outline" className="w-full rounded-xl h-11 font-semibold">
                Kompaniya yaratish
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Faqat tour kompaniya egalari va platforma adminlari kira oladi.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
