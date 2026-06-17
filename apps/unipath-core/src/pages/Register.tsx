import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Mail, Lock, GraduationCap, ChevronLeft } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { language, selectedCountry } = useApp();
  const t = useTranslation(language);
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate registration
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: 'Welcome to UniPath!',
      description: 'Your account has been created successfully.',
    });
    
    navigate('/dashboard');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 md:p-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span>{t.back}</span>
          </Link>
          <LanguageSwitcher />
        </header>

        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-md animate-slide-up">
            <div className="text-center mb-8">
              <Logo size="lg" showText={false} />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-6 mb-2">
                {t.createAccount}
              </h1>
              <p className="text-muted-foreground">
                {t.createAccountDesc}
              </p>
            </div>

            {/* Selected Country Badge */}
            {selectedCountry && (
              <div className="flex items-center justify-center gap-2 p-3 bg-secondary rounded-xl mb-6">
                <span className="text-2xl">{selectedCountry.flag}</span>
                <span className="font-medium text-secondary-foreground">
                  {language === 'uz'
                    ? selectedCountry.name_uz || selectedCountry.name
                    : language === 'ru'
                    ? selectedCountry.name_ru || selectedCountry.name
                    : selectedCountry.name}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t.fullName}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10 h-12"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-12"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 h-12"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-lg shadow-glow"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  t.signUp
                )}
              </Button>

              <p className="text-center text-muted-foreground text-sm">
                {t.alreadyHaveAccount}{' '}
                <Link to="/auth" className="text-primary hover:underline font-medium">
                  {t.signIn}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground items-center justify-center p-12">
        <div className="max-w-md text-center">
          <GraduationCap className="w-20 h-20 mx-auto mb-8 animate-float" />
          <h2 className="text-3xl font-bold mb-4">Start Your Journey</h2>
          <p className="text-primary-foreground/80 text-lg">
            Join thousands of students who have successfully applied to their dream
            universities through UniPath. We make the process simple, transparent, and
            stress-free.
          </p>
          
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">12</div>
              <div className="text-sm text-primary-foreground/70">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold">1500+</div>
              <div className="text-sm text-primary-foreground/70">Universities</div>
            </div>
            <div>
              <div className="text-3xl font-bold">98%</div>
              <div className="text-sm text-primary-foreground/70">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
