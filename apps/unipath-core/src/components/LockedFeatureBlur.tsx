import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, CreditCard, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCredits, UNLOCK_COST } from '@/contexts/CreditContext';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessMode } from '@/hooks/useBusinessMode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LockedFeatureBlurProps {
  title: string;
  description: string;
  featureKey: string;
  children: React.ReactNode;
  onUnlock?: () => void;
}

export function LockedFeatureBlur({ title, description, featureKey, children, onUnlock }: LockedFeatureBlurProps) {
  const { balance, spendCredits, setRefillModalOpen } = useCredits();
  const { language } = useApp();
  const { user } = useAuth();
  const { isPaid } = useBusinessMode();
  const [unlocked, setUnlocked] = useState(false);
  const [checkingOverride, setCheckingOverride] = useState(true);

  // Check if feature was already unlocked (persisted in student_feature_overrides)
  useEffect(() => {
    if (!user) { setCheckingOverride(false); return; }
    (async () => {
      const { data } = await supabase
        .from('student_feature_overrides')
        .select('is_unlocked')
        .eq('user_id', user.id)
        .eq('feature_key', featureKey)
        .eq('is_unlocked', true)
        .maybeSingle();
      if (data) setUnlocked(true);
      setCheckingOverride(false);
    })();
  }, [user, featureKey]);

  const handleCreditUnlock = async () => {
    if (!user) return;
    const success = await spendCredits(UNLOCK_COST, `Unlocked ${featureKey} feature`, undefined);
    if (success) {
      // Persist the unlock in student_feature_overrides
      await supabase.from('student_feature_overrides').upsert(
        { user_id: user.id, feature_key: featureKey, is_unlocked: true },
        { onConflict: 'user_id,feature_key' }
      );
      toast.success(language === 'uz' ? 'Funksiya ochildi!' : language === 'ru' ? 'Функция разблокирована!' : 'Feature unlocked!');
      setUnlocked(true);
      onUnlock?.();
    }
  };

  if (checkingOverride) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  const labels = {
    en: {
      locked: 'This feature is locked',
      auto: 'Unlocks automatically when your application is accepted',
      or: 'OR',
      unlock: `Unlock now for ${UNLOCK_COST} UniCoin`,
      noCredits: 'Get UniCoin',
      paidOnly: 'This feature will open automatically based on your application progress.',
    },
    uz: {
      locked: 'Bu funksiya qulflangan',
      auto: "Arizangiz qabul qilinganida avtomatik ochiladi",
      or: 'YOKI',
      unlock: `${UNLOCK_COST} UniCoin evaziga ochish`,
      noCredits: 'UniCoin olish',
      paidOnly: 'Bu bo‘lim ariza jarayoningizga qarab avtomatik ochiladi.',
    },
    ru: {
      locked: 'Эта функция заблокирована',
      auto: 'Разблокируется автоматически при принятии заявки',
      or: 'ИЛИ',
      unlock: `Разблокировать за ${UNLOCK_COST} UniCoin`,
      noCredits: 'Получить UniCoin',
      paidOnly: 'Этот раздел откроется автоматически по прогрессу вашей заявки.',
    },
  };
  const l = labels[language as keyof typeof labels] || labels.en;

  return (
    <div className="relative min-h-[50vh]">
      {/* Blurred content behind */}
      <div className="blur-md pointer-events-none select-none opacity-40 max-h-[40vh] overflow-hidden">
        {children}
      </div>

      {/* Lock overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-start justify-center z-10 pt-8"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-3xl p-8 max-w-md mx-4 shadow-2xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-5"
          >
            <Lock className="w-10 h-10 text-muted-foreground" />
          </motion.div>

          <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
          <p className="text-muted-foreground mb-2">{description}</p>
          <p className="text-sm text-muted-foreground mb-6">{isPaid ? l.paidOnly : l.auto}</p>

          {!isPaid && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-semibold text-muted-foreground">{l.or}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {balance >= UNLOCK_COST ? (
                <Button onClick={handleCreditUnlock} className="w-full gap-2">
                  <Coins className="w-4 h-4" />
                  {l.unlock}
                </Button>
              ) : (
                <Button onClick={() => setRefillModalOpen(true)} variant="outline" className="w-full gap-2">
                  <CreditCard className="w-4 h-4" />
                  {l.noCredits}
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
