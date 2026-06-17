import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

const labels = {
  en: {
    complete: 'Profile Complete!',
    incomplete: 'Complete your profile to unlock applications',
    cta: 'Complete Profile',
    missing: 'Missing:',
  },
  uz: {
    complete: 'Profil to\'liq!',
    incomplete: 'Ariza topshirish uchun profilingizni to\'ldiring',
    cta: 'Profilni to\'ldirish',
    missing: 'Kerak:',
  },
  ru: {
    complete: 'Профиль заполнен!',
    incomplete: 'Заполните профиль, чтобы подать заявку',
    cta: 'Заполнить профиль',
    missing: 'Необходимо:',
  },
};

export function ProfileCompletionBar() {
  const { percentage, isComplete, missingFields, loading } = useProfileCompletion();
  const { language } = useApp();
  const l = labels[language as keyof typeof labels] || labels.en;
  const [adminEnabled, setAdminEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', 'show_profile_completion_bar')
        .maybeSingle();
      setAdminEnabled(data ? (data.config_value as any)?.enabled !== false : true);
    })();
  }, []);

  if (loading || adminEnabled === null) return null;
  if (!adminEnabled) return null;
  if (isComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 md:p-5 mb-6 shadow-sm"
    >
      {/* Top row: icon + text + CTA */}
      <div className="flex items-start sm:items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm leading-snug">{l.incomplete}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {l.missing} {missingFields.slice(0, 3).join(', ')}
            {missingFields.length > 3 && ` +${missingFields.length - 3}`}
          </p>
        </div>
        {/* CTA — always visible, stacks on very small screens */}
        <Link to="/student/profile" className="flex-shrink-0">
          <Button size="sm" className="gap-1.5 rounded-xl text-xs h-9 px-4 shadow-sm">
            {l.cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <Progress value={percentage} className="h-2.5 rounded-full" />
        <span className="absolute right-0 -top-0.5 text-[11px] font-semibold text-primary">
          {percentage}%
        </span>
      </div>
    </motion.div>
  );
}
