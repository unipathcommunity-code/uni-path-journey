import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useCredits } from '@/contexts/CreditContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import unicoinLogo from '@/assets/unicoin-logo.png';

const SEGMENTS = [
  { label: '2 UniCoin', type: 'credits', value: 2, color: 'hsl(var(--primary))' },
  { label: 'Keyingi safar', type: 'nothing', value: 0, color: 'hsl(var(--muted))' },
  { label: '1 UniCoin', type: 'credits', value: 1, color: 'hsl(var(--accent))' },
  { label: 'Omadsiz', type: 'nothing', value: 0, color: 'hsl(var(--muted))' },
  { label: '3 UniCoin', type: 'credits', value: 3, color: 'hsl(var(--primary))' },
  { label: 'Keyingi safar', type: 'nothing', value: 0, color: 'hsl(var(--muted))' },
  { label: '1 UniCoin', type: 'credits', value: 1, color: 'hsl(var(--accent))' },
  { label: 'Omadsiz', type: 'nothing', value: 0, color: 'hsl(var(--muted))' },
];

const labels = {
  en: { title: 'Lucky Wheel', spin: 'Spin!', won: 'You won', credits: 'UniCoin', nothing: 'Better luck next time!', cooldown: 'Next spin available in', days: 'days', close: 'Close' },
  uz: { title: 'Omad G\'ildiragi', spin: 'Aylantir!', won: 'Siz yutdingiz', credits: 'UniCoin', nothing: 'Keyingi safar omad kulamiz!', cooldown: 'Keyingi aylantirish', days: 'kundan keyin', close: 'Yopish' },
  ru: { title: 'Колесо Удачи', spin: 'Крутить!', won: 'Вы выиграли', credits: 'UniCoin', nothing: 'В следующий раз повезёт!', cooldown: 'Следующий спин через', days: 'дней', close: 'Закрыть' },
};

export function SpinWheel() {
  const { user } = useAuth();
  const { language } = useApp();
  const { refreshBalance } = useCredits();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ type: string; value: number } | null>(null);
  const [canSpin, setCanSpin] = useState(false);
  const [cooldownDays, setCooldownDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [globalSpinCount, setGlobalSpinCount] = useState(0);

  const l = labels[language as keyof typeof labels] || labels.en;

  const checkEligibility = useCallback(async () => {
    if (!user) return;
    // Check last spin date (once per week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: lastSpin } = await supabase
      .from('spin_wheel_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSpin) {
      const lastDate = new Date(lastSpin.created_at);
      if (lastDate > oneWeekAgo) {
        const nextSpin = new Date(lastDate);
        nextSpin.setDate(nextSpin.getDate() + 7);
        const daysLeft = Math.ceil((nextSpin.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        setCooldownDays(daysLeft);
        setCanSpin(false);
      } else {
        setCanSpin(true);
      }
    } else {
      setCanSpin(true);
    }

    // Get global spin count to determine if this is the "lucky" spin
    const { count } = await supabase
      .from('spin_wheel_logs')
      .select('*', { count: 'exact', head: true });
    setGlobalSpinCount(count || 0);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    checkEligibility().then(() => {
      // Auto-open wheel when cooldown has expired (returning user)
    });
  }, [checkEligibility]);

  // Auto-open when eligible and user has spun before (cooldown expired)
  useEffect(() => {
    if (!loading && canSpin && globalSpinCount > 0) {
      setOpen(true);
    }
  }, [loading, canSpin, globalSpinCount]);

  const handleSpin = async () => {
    if (!user || spinning || !canSpin) return;
    setSpinning(true);
    setResult(null);

    try {
      // Call secure edge function for spin logic
      const { data, error } = await supabase.functions.invoke('spin-wheel', {
        method: 'POST',
      });

      if (error || !data) {
        toast.error('Something went wrong. Please try again.');
        setSpinning(false);
        return;
      }

      const { winIndex, prizeType, prizeValue } = data;

      const segmentAngle = 360 / SEGMENTS.length;
      const targetAngle = 360 - (winIndex * segmentAngle + segmentAngle / 2);
      const spins = 5 + Math.floor(Math.random() * 3);
      const finalRotation = rotation + spins * 360 + targetAngle;

      setRotation(finalRotation);

      // Wait for animation
      setTimeout(async () => {
        setResult({ type: prizeType, value: prizeValue });
        setSpinning(false);
        setCanSpin(false);
        setCooldownDays(7);

        if (prizeType === 'credits' && prizeValue > 0) {
          await refreshBalance();
          toast.success(`🎉 ${l.won} ${prizeValue} ${l.credits}!`);
        } else {
          toast.info(l.nothing);
        }
      }, 4000);
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      setSpinning(false);
    }
  };

  if (loading) return null;

  const segmentAngle = 360 / SEGMENTS.length;

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-40 w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform lg:bottom-6 lg:left-6 lg:w-14 lg:h-14"
        animate={canSpin ? { scale: [1, 1.15, 1] } : {}}
        transition={{ repeat: canSpin ? Infinity : 0, duration: 2 }}
      >
        <img src={unicoinLogo} alt="UniCoin" className="w-7 h-7 rounded-full" />
        {canSpin && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
            onClick={() => !spinning && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">🎰 {l.title}</h2>
                <button onClick={() => !spinning && setOpen(false)} className="p-1 hover:bg-muted rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Wheel */}
              <div className="relative w-64 h-64 mx-auto mb-6">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />

                <motion.svg
                  viewBox="0 0 200 200"
                  className="w-full h-full"
                  animate={{ rotate: rotation }}
                  transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
                >
                  {SEGMENTS.map((seg, i) => {
                    const startAngle = i * segmentAngle - 90;
                    const endAngle = startAngle + segmentAngle;
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    const x1 = 100 + 95 * Math.cos(startRad);
                    const y1 = 100 + 95 * Math.sin(startRad);
                    const x2 = 100 + 95 * Math.cos(endRad);
                    const y2 = 100 + 95 * Math.sin(endRad);
                    const largeArc = segmentAngle > 180 ? 1 : 0;
                    const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
                    const textX = 100 + 60 * Math.cos(midAngle);
                    const textY = 100 + 60 * Math.sin(midAngle);
                    const textRotation = (startAngle + endAngle) / 2 + 90;

                    return (
                      <g key={i}>
                        <path
                          d={`M100,100 L${x1},${y1} A95,95 0 ${largeArc},1 ${x2},${y2} Z`}
                          fill={seg.type === 'credits' ? 'hsl(142, 71%, 45%)' : 'hsl(var(--muted))'}
                          stroke="hsl(var(--border))"
                          strokeWidth="1"
                        />
                        <text
                          x={textX}
                          y={textY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={seg.type === 'credits' ? 'white' : 'hsl(var(--muted-foreground))'}
                          fontSize="7"
                          fontWeight="bold"
                          transform={`rotate(${textRotation},${textX},${textY})`}
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="100" cy="100" r="15" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
                </motion.svg>
              </div>

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-center p-3 rounded-xl mb-4 ${result.type === 'credits' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                  >
                    <p className="font-bold text-lg flex items-center justify-center gap-2">
                      {result.type === 'credits' ? (
                        <>🎉 {l.won} {result.value} <img src={unicoinLogo} alt="UniCoin" className="w-5 h-5 inline rounded-full" /> {l.credits}!</>
                      ) : (
                        <>😔 {l.nothing}</>
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Button */}
              {canSpin ? (
                <Button onClick={handleSpin} disabled={spinning} className="w-full gap-2" size="lg">
                  {spinning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                  {l.spin}
                </Button>
              ) : (
                <div className="text-center text-sm text-muted-foreground p-3 bg-muted rounded-xl">
                  ⏳ {l.cooldown} {cooldownDays} {l.days}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
