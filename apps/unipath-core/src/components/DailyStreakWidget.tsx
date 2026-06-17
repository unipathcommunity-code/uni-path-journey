import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditContext';
import { Flame, Check } from 'lucide-react';
import unicoinLogo from '@/assets/unicoin-logo.png';
import { toast } from 'sonner';

const labels = {
  en: {
    title: 'Daily Streak',
    day: 'Day',
    claimed: 'Claimed today!',
    claim: 'Claim reward',
    streak: (n: number) => `${n} day streak 🔥`,
    earned: (n: number) => `+${n} UniCoin earned!`,
    maxStreak: (n: number) => `Best: ${n} days`,
  },
  uz: {
    title: 'Kunlik streak',
    day: 'Kun',
    claimed: "Bugun olindi!",
    claim: 'Mukofotni olish',
    streak: (n: number) => `${n} kunlik streak 🔥`,
    earned: (n: number) => `+${n} UniCoin olindi!`,
    maxStreak: (n: number) => `Eng yaxshi: ${n} kun`,
  },
  ru: {
    title: 'Ежедневный стрик',
    day: 'День',
    claimed: 'Получено сегодня!',
    claim: 'Получить награду',
    streak: (n: number) => `${n} дней подряд 🔥`,
    earned: (n: number) => `+${n} UniCoin получено!`,
    maxStreak: (n: number) => `Лучший: ${n} дн.`,
  },
};

interface Props {
  language: string;
}

export function DailyStreakWidget({ language }: Props) {
  const { user } = useAuth();
  const { refreshBalance } = useCredits();
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [claimedToday, setClaimedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const l = labels[language as keyof typeof labels] || labels.en;
  const today = new Date().toISOString().split('T')[0];

  const checkStreak = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('daily_login_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      const lastLogin = data.last_login_date;
      const lastReward = data.last_reward_date;
      
      // Check if already claimed today
      if (lastReward === today) {
        setStreak(data.current_streak);
        setMaxStreak(data.max_streak);
        setClaimedToday(true);
        setLoading(false);
        return;
      }

      // Calculate streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastLogin === today) {
        // Already logged in today but hasn't claimed
        setStreak(data.current_streak);
      } else if (lastLogin === yesterdayStr) {
        // Consecutive day
        setStreak(data.current_streak + 1);
      } else {
        // Streak broken, reset to 1
        setStreak(1);
      }
      setMaxStreak(data.max_streak);
    } else {
      // First time - streak is 1
      setStreak(1);
    }
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  const claimReward = async () => {
    if (!user || claimedToday || claiming) return;
    setClaiming(true);

    try {
      // Reward = current streak day (capped at 7)
      const reward = Math.min(streak, 7);
      const newMax = Math.max(maxStreak, streak);

      // Upsert streak record
      const { error: streakError } = await supabase
        .from('daily_login_streaks')
        .upsert({
          user_id: user.id,
          current_streak: streak,
          max_streak: newMax,
          last_login_date: today,
          last_reward_date: today,
          total_coins_earned: (await supabase
            .from('daily_login_streaks')
            .select('total_coins_earned')
            .eq('user_id', user.id)
            .maybeSingle()
          ).data?.total_coins_earned || 0 + reward,
        }, { onConflict: 'user_id' });

      if (streakError) throw streakError;

      // Add credits
      const { data: creditData } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creditData) {
        await supabase
          .from('user_credits')
          .update({ balance: creditData.balance + reward })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_credits')
          .insert({ user_id: user.id, balance: reward });
      }

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: reward,
        transaction_type: 'streak_reward',
        description: `Daily streak reward (Day ${streak})`,
      });

      setClaimedToday(true);
      setMaxStreak(newMax);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
      await refreshBalance();
      toast.success(l.earned(reward));
    } catch (err) {
      console.error('Failed to claim streak reward:', err);
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !user) return null;

  // Show 7 day circles
  const days = Array.from({ length: 7 }, (_, i) => i + 1);
  const reward = Math.min(streak, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 p-4"
    >
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.5 }}
                className="text-4xl mb-2"
              >
                🎉
              </motion.div>
              <p className="font-bold text-foreground">{l.earned(reward)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-semibold text-sm text-foreground">{l.title}</span>
        </div>
        <span className="text-xs text-muted-foreground">{l.maxStreak(maxStreak)}</span>
      </div>

      {/* Day circles */}
      <div className="flex items-center justify-between gap-1 mb-3">
        {days.map(day => {
          const isCompleted = claimedToday ? day <= streak : day < streak;
          const isCurrent = claimedToday ? false : day === streak;
          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${isCompleted
                    ? 'bg-orange-500 text-white shadow-sm'
                    : isCurrent
                      ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200 ring-2 ring-orange-400 animate-pulse'
                      : 'bg-muted text-muted-foreground'
                  }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : day}
              </div>
              <span className="text-[10px] text-muted-foreground">+{Math.min(day, 7)}</span>
            </div>
          );
        })}
      </div>

      {/* Claim button or status */}
      {claimedToday ? (
        <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{l.claimed}</span>
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={claimReward}
          disabled={claiming}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          <img src={unicoinLogo} alt="UniCoin" className="w-5 h-5 rounded-full" />
          {l.claim} (+{reward} UniCoin)
        </motion.button>
      )}
    </motion.div>
  );
}
