import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { CountryCard } from '@/components/CountryCard';
import { CountryDetailModal } from '@/components/CountryDetailModal';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe, ChevronLeft, Loader2, Info } from 'lucide-react';

interface DbCountry {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  flag: string | null;
  image_url: string | null;
  is_active: boolean | null;
  avg_tuition: string | null;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, selectedCountry, setSelectedCountry, setIsOnboarded } = useApp();
  const t = useTranslation(language);
  const [countries, setCountries] = useState<DbCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailCountryId, setDetailCountryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!error && data) {
        setCountries(data as DbCountry[]);
      }
      setLoading(false);
    };
    
    fetchCountries();
  }, []);

  const handleContinue = () => {
    if (!selectedCountry) return;
    setIsOnboarded(true);
    navigate(user ? '/dashboard' : '/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Logo />
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(142_71%_45%/0.08),transparent_50%)]" />
        
        <div className="container px-4 relative">
          <div className="text-center max-w-3xl mx-auto mb-12 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              <span>Your gateway to global education</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
              {t.welcome}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground">
              {t.tagline}
            </p>
          </div>

          {/* Country Selection */}
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                {t.selectCountry}
              </h2>
              <p className="text-muted-foreground">
                {t.selectCountryDesc}
              </p>
            </div>

            {/* Countries Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {countries.map((country, index) => (
                  <div
                    key={country.id}
                    className="animate-slide-up relative group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CountryCard
                      country={country}
                      isSelected={selectedCountry?.id === country.id}
                      onClick={() => setSelectedCountry(country)}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setDetailCountryId(country.id); }}
                      className="absolute top-2 left-2 w-7 h-7 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-border hover:bg-primary hover:text-primary-foreground"
                      title="Details"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Continue Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!selectedCountry}
                className="min-w-[200px] gap-2 text-lg h-14 rounded-xl shadow-glow disabled:shadow-none transition-all duration-300"
              >
                {t.continue}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CountryDetailModal
        countryId={detailCountryId}
        open={!!detailCountryId}
        onOpenChange={(open) => { if (!open) setDetailCountryId(null); }}
      />

      {/* Features Preview */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '📚',
                title: 'University Search',
                desc: 'Find your perfect university with advanced filters',
              },
              {
                icon: '📝',
                title: 'Easy Applications',
                desc: 'Apply to multiple universities seamlessly',
              },
              {
                icon: '✈️',
                title: 'Full Support',
                desc: 'Visa, housing, and pre-departure assistance',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="text-center p-6 rounded-2xl bg-card border border-border/50 card-hover"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
