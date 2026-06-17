import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, GraduationCap, MapPin, TrendingUp, ChevronRight, Lightbulb, BookOpen } from 'lucide-react';

interface RejectionSupportCardProps {
  rejectedUniversityCountry: string;
  language: string;
}

interface RecommendedUni {
  id: string;
  name: string;
  country: string;
  city: string | null;
  tuition_min: number | null;
  tuition_max: number | null;
  scholarship_available: boolean;
  programs: string[] | null;
  ranking: number | null;
}

const labels = {
  uz: {
    title: 'Sizga mos universitetlar topildi!',
    subtitle: 'Biz sizning profilingizni tahlil qildik va qabul qilinish imkoniyati yuqori bo\'lgan universitetlarni tanladik.',
    scholarship: 'Grant mavjud',
    apply: 'Ariza topshirish',
    viewAll: 'Hammasini ko\'rish',
    chance: 'Yuqori imkoniyat',
    noRecs: 'Boshqa universitetlarni ko\'ring',
  },
  ru: {
    title: 'Мы нашли подходящие университеты!',
    subtitle: 'Мы проанализировали ваш профиль и подобрали университеты с высокими шансами на зачисление.',
    scholarship: 'Стипендия',
    apply: 'Подать заявку',
    viewAll: 'Все университеты',
    chance: 'Высокий шанс',
    noRecs: 'Посмотреть другие университеты',
  },
  en: {
    title: 'We found universities for you!',
    subtitle: 'We analyzed your profile and found universities where you have a high chance of acceptance.',
    scholarship: 'Scholarship',
    apply: 'Apply Now',
    viewAll: 'View All',
    chance: 'High chance',
    noRecs: 'Browse other universities',
  },
};

const getCountryFlag = (country: string) => {
  const flags: Record<string, string> = {
    'South Korea': '🇰🇷', 'China': '🇨🇳', 'Japan': '🇯🇵', 'USA': '🇺🇸',
    'Germany': '🇩🇪', 'Poland': '🇵🇱', 'Turkey': '🇹🇷', 'Czech Republic': '🇨🇿',
    'Malaysia': '🇲🇾', 'UAE': '🇦🇪', 'Georgia': '🇬🇪', 'Hungary': '🇭🇺',
    'Russia': '🇷🇺', 'UK': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  };
  return flags[country] || '🌍';
};

export function RejectionSupportCard({ rejectedUniversityCountry, language }: RejectionSupportCardProps) {
  const [recommendations, setRecommendations] = useState<RecommendedUni[]>([]);
  const [loading, setLoading] = useState(true);
  const l = labels[language as keyof typeof labels] || labels.en;

  useEffect(() => {
    async function fetchRecommendations() {
      const { data } = await supabase
        .from('universities')
        .select('id, name, country, city, tuition_min, tuition_max, scholarship_available, programs, ranking')
        .eq('is_active', true)
        .eq('country', rejectedUniversityCountry)
        .order('ranking', { ascending: true, nullsFirst: false })
        .limit(3);

      setRecommendations(data || []);
      setLoading(false);
    }
    fetchRecommendations();
  }, [rejectedUniversityCountry]);

  if (loading || recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 border-b border-border">
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
          >
            <Lightbulb className="w-5 h-5 text-primary" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">{l.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{l.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Recommended Universities */}
      <div className="divide-y divide-border">
        <AnimatePresence>
          {recommendations.map((uni, i) => (
            <motion.div
              key={uni.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl shrink-0">
                  {getCountryFlag(uni.country)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm truncate">{uni.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {uni.city ? `${uni.city}, ${uni.country}` : uni.country}
                    </span>
                    {uni.ranking && (
                      <span className="flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        #{uni.ranking}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {uni.scholarship_available && (
                    <Badge className="bg-success/10 text-success border-0 text-[10px]">
                      {l.scholarship}
                    </Badge>
                  )}
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                    {l.chance}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Link to="/search">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <BookOpen className="w-4 h-4" />
            {l.viewAll}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
