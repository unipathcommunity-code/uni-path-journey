import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';
import { useApp } from '@/contexts/AppContext';
import { Logo } from '@/components/Logo';
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Terminal,
  Activity
} from 'lucide-react';

export default function SuperAdminAuth() {
  const navigate = useNavigate();
  const { signIn, signOut, user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading, isSuperAdmin } = useUserRole();
  const { language } = useApp();
  const t = useTranslation(language);
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = authLoading || roleLoading;

  // SEO
  useEffect(() => {
    document.title = "UniPath — Global System Access";
  }, []);

  // Check role and redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      if (isSuperAdmin) {
        navigate('/super-admin');
      } else {
        // If logged in user is not a super admin, sign them out and show error
        toast({
          title: "Access Denied",
          description: "This portal is strictly for global system administrators. Your account does not have sufficient privileges.",
          variant: "destructive",
        });
        signOut();
      }
    }
  }, [user, isLoading, isSuperAdmin, navigate, toast, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Xatolik",
        description: "Iltimos, email va parolni kiriting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Authentication Failed",
        description: error.message === 'Invalid login credentials' ? "Invalid credentials provided." : error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-cyan-500 animate-pulse" />
          <span className="text-sm font-mono tracking-widest text-cyan-500/80 uppercase">Authenticating...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-100 flex flex-col relative overflow-hidden font-sans">
      
      {/* Infrastructure Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Cyan/Blue Accents */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="z-10 w-full border-b border-cyan-900/30 bg-[#0a0f1c]/80 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-500" />
            <span className="font-bold text-lg tracking-tight text-white">UP<span className="text-cyan-500">_INFRA</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white"
            >
              Bosh sahifaga qaytish
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16 z-10">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/50 text-cyan-400 rounded text-xs font-mono tracking-widest uppercase border border-cyan-800/50">
              <ShieldAlert className="w-3.5 h-3.5" />
              Restricted Area
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              System Admin <span className="text-cyan-500">Access</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Global infrastructure management and control center.
            </p>
          </div>

          <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-cyan-900/30 rounded-xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.05)] space-y-6 relative overflow-hidden">
            {/* Top scanning line effect */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="sa-email" className="text-slate-300 text-xs font-mono tracking-wider uppercase">
                  Root Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-700" />
                  <Input
                    id="sa-email"
                    type="email"
                    placeholder="root@unipath.me"
                    className="pl-10 bg-black/40 border-cyan-900/50 text-white placeholder-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 font-mono text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sa-password" className="text-slate-300 text-xs font-mono tracking-wider uppercase">
                  Security Key
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-700" />
                  <Input
                    id="sa-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-black/40 border-cyan-900/50 text-white placeholder-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 font-mono text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-700 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all duration-200 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-cyan-400/50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Authenticating...' : 'Initialize Session'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
          
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-cyan-900/30 py-6 text-center text-xs font-mono text-slate-500">
        &copy; {new Date().getFullYear()} UniPath Core Infrastructure. All actions are logged.
      </footer>
    </div>
  );
}

