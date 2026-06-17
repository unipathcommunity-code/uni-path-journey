import { motion } from 'framer-motion';
import { useCredits } from '@/contexts/CreditContext';
import { useApp } from '@/contexts/AppContext';
import { Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import unicoinLogo from '@/assets/unicoin-logo.png';

export function CreditBalanceWidget() {
  const { balance, setRefillModalOpen } = useCredits();
  const { language } = useApp();

  const label = 'UniCoin';
  const addLabel = language === 'uz' ? "Qo'shish" : language === 'ru' ? 'Пополнить' : 'Top Up';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 md:p-5 text-primary-foreground relative overflow-hidden h-full"
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-full" />
      <div className="absolute -right-8 -bottom-8 w-28 h-28 md:w-32 md:h-32 bg-white/5 rounded-full" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2 md:mb-3">
          <img src={unicoinLogo} alt="UniCoin" className="w-5 h-5 md:w-6 md:h-6 rounded-full" />
          <span className="text-xs md:text-sm font-medium opacity-90">{label}</span>
        </div>
        <motion.p
          key={balance}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-3xl md:text-4xl font-bold mb-0.5 md:mb-1"
        >
          {balance}
        </motion.p>
        <p className="text-[10px] md:text-xs opacity-70 mb-3 md:mb-4 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {language === 'uz' ? 'Mavjud UniCoin' : language === 'ru' ? 'Доступные UniCoin' : 'Available UniCoin'}
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5 bg-white/20 hover:bg-white/30 text-primary-foreground border-0 rounded-xl text-xs h-8"
          onClick={() => setRefillModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          {addLabel}
        </Button>
      </div>
    </motion.div>
  );
}
