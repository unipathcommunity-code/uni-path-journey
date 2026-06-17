import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, ChevronRight, TrendingUp } from 'lucide-react';

interface Props {
  language: string;
}

const LABELS = {
  en: {
    title: 'AI Readiness Score',
    subtitle: 'Based on your profile completeness',
    tip: 'How to improve',
    action: 'Boost your score',
    tips: {
      noPhone: 'Add phone number',
      noTelegram: 'Add Telegram username',
      noName: 'Add full name',
      noDob: 'Add date of birth',
      noDocs: 'Upload documents',
      noApp: 'Start an application',
      noVisa: 'Check visa requirements',
    },
    score: (n: number) => `${n}%`,
    levels: { low: 'Getting Started', mid: 'Good Progress', high: 'Almost Ready', max: 'Application Ready!' },
  },
  uz: {
    title: 'AI Tayyorlik Bahosi',
    subtitle: 'Profil to\'liqligiga asoslanib',
    tip: 'Qanday yaxshilash mumkin',
    action: 'Bahoni oshiring',
    tips: {
      noPhone: 'Telefon raqam qo\'shing',
      noTelegram: 'Telegram nomini qo\'shing',
      noName: 'To\'liq ismingizni kiriting',
      noDob: 'Tug\'ilgan kun kiriting',
      noDocs: 'Hujjatlarni yuklang',
      noApp: 'Ariza boshlang',
      noVisa: 'Viza talablarini tekshiring',
    },
    score: (n: number) => `${n}%`,
    levels: { low: 'Boshlash', mid: 'Yaxshi bormoqda', high: 'Deyarli tayyor', max: 'Ariza topshirishga tayyor!' },
  },
  ru: {
    title: 'AI-оценка готовности',
    subtitle: 'На основе заполненности профиля',
    tip: 'Как улучшить',
    action: 'Повысить оценку',
    tips: {
      noPhone: 'Добавить номер телефона',
      noTelegram: 'Добавить Telegram',
      noName: 'Добавить полное имя',
      noDob: 'Добавить дату рождения',
      noDocs: 'Загрузить документы',
      noApp: 'Начать заявку',
      noVisa: 'Проверить визовые требования',
    },
    score: (n: number) => `${n}%`,
    levels: { low: 'Начало пути', mid: 'Хороший прогресс', high: 'Почти готов', max: 'Готов к подаче!' },
  },
};

const scoreColor = (score: number) => {
  if (score >= 85) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-[0_0_16px_rgba(34,197,94,0.25)]' };
  if (score >= 60) return { bar: 'bg-primary', text: 'text-primary', glow: 'shadow-[0_0_16px_rgba(var(--primary),0.2)]' };
  if (score >= 35) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', glow: '' };
  return { bar: 'bg-destructive', text: 'text-destructive', glow: '' };
};

const levelLabel = (score: number, l: typeof LABELS.en) => {
  if (score >= 90) return l.levels.max;
  if (score >= 65) return l.levels.high;
  if (score >= 40) return l.levels.mid;
  return l.levels.low;
};

export function AIReadinessScore({ language }: Props) {
  const { user } = useAuth();
  const l = LABELS[language as keyof typeof LABELS] || LABELS.en;
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function calculate() {
      let total = 0;
      const tips: string[] = [];

      // Profile fields (50 pts total)
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, telegram_username, full_name, date_of_birth')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (profile?.full_name?.trim()) total += 10; else tips.push(l.tips.noName);
      if (profile?.phone?.trim()) total += 10; else tips.push(l.tips.noPhone);
      if (profile?.telegram_username?.trim()) total += 10; else tips.push(l.tips.noTelegram);
      if (profile?.date_of_birth) total += 10; else tips.push(l.tips.noDob);

      // Documents (20 pts)
      const { count: docCount } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if ((docCount || 0) >= 3) total += 20;
      else if ((docCount || 0) >= 1) total += 10;
      else tips.push(l.tips.noDocs);

      // Applications (20 pts)
      const { count: appCount } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if ((appCount || 0) >= 1) total += 20;
      else tips.push(l.tips.noApp);

      // UniCoin/engagement bonus (10 pts) — rough proxy: any login streak
      total += 10; // baseline engagement credit

      setScore(total);
      setImprovements(tips.slice(0, 3));
      setLoading(false);

      // Animate counter
      let current = 0;
      const step = total / 30;
      const interval = setInterval(() => {
        current = Math.min(current + step, total);
        setDisplayScore(Math.round(current));
        if (current >= total) clearInterval(interval);
      }, 30);
    }

    calculate();
  }, [user, language]);

  if (loading) return null;

  const colors = scoreColor(score);
  const level = levelLabel(score, l);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`bg-card rounded-2xl border border-border p-4 md:p-5 ${colors.glow}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs md:text-sm font-semibold text-foreground">{l.title}</p>
            <p className="text-[10px] text-muted-foreground">{l.subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl md:text-3xl font-bold tabular-nums ${colors.text}`}>
            {l.score(displayScore)}
          </p>
          <p className={`text-[9px] font-semibold uppercase tracking-wide ${colors.text}`}>{level}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={`h-full rounded-full ${colors.bar}`}
        />
      </div>

      {/* Improvement tips */}
      {improvements.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{l.tip}</p>
          {improvements.map((tip, i) => (
            <div key={i} className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="text-[11px] md:text-xs text-muted-foreground">{tip}</span>
            </div>
          ))}
          <Link
            to="/student/profile"
            className={`mt-2 flex items-center gap-1 text-[11px] md:text-xs font-semibold ${colors.text} hover:underline`}
          >
            {l.action} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
