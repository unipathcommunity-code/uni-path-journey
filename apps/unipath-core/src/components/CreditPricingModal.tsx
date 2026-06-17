import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCredits } from '@/contexts/CreditContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useBusinessMode } from '@/hooks/useBusinessMode';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, ArrowLeft, Clock, ExternalLink, History, Loader2, Zap, Star, Crown, Diamond, X } from 'lucide-react';
import unicoinLogo from '@/assets/unicoin-logo.png';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

const CLICK_PAYMENT_URL = 'https://my.click.uz/clickp2p/7EC6EC95A2828A5556C3DD524D21F6DB64404AB7523D94B81F115C46DEE7B370';

interface Tariff {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  price_uzs: number;
  coin_amount: number;
  bonus_coins: number;
  badge: string | null;
  display_order: number;
}

interface PaymentTransaction {
  id: string;
  unicoin_amount: number;
  uzs_amount: number;
  status: string;
  created_at: string;
}

const labels = {
  uz: {
    title: 'UniCoin sotib oling',
    balance: (n: number) => `Balansingiz: ${n} UniCoin`,
    pay: "Click orqali to'lash",
    history: "To'lov tarixi",
    pending: 'Kutilmoqda',
    confirmed: 'Tasdiqlandi',
    created: 'Yaratildi',
    noHistory: "Hali to'lovlar yo'q",
    redirecting: "Click sahifasiga o'tkazilmoqda...",
    coins: 'UniCoin',
    bonus: 'bonus',
    back: 'Orqaga',
    total: 'jami',
    som: "so'm",
  },
  ru: {
    title: 'Купить UniCoin',
    balance: (n: number) => `Ваш баланс: ${n} UniCoin`,
    pay: 'Оплатить через Click',
    history: 'История платежей',
    pending: 'Ожидание',
    confirmed: 'Подтверждено',
    created: 'Создано',
    noHistory: 'Платежей пока нет',
    redirecting: 'Перенаправление на Click...',
    coins: 'UniCoin',
    bonus: 'бонус',
    back: 'Назад',
    total: 'итого',
    som: 'сум',
  },
  en: {
    title: 'Buy UniCoin',
    balance: (n: number) => `Your balance: ${n} UniCoin`,
    pay: 'Pay with Click',
    history: 'Payment History',
    pending: 'Pending',
    confirmed: 'Confirmed',
    created: 'Created',
    noHistory: 'No payments yet',
    redirecting: 'Redirecting to Click...',
    coins: 'UniCoin',
    bonus: 'bonus',
    back: 'Back',
    total: 'total',
    som: 'UZS',
  },
};

const tariffIcons = [Zap, Star, Crown, Diamond];

export function CreditPricingModal() {
  const { refillModalOpen, setRefillModalOpen, balance } = useCredits();
  const { user } = useAuth();
  const { language } = useApp();
  const { isPaid } = useBusinessMode();
  const baseL = labels[language as keyof typeof labels] || labels.en;
  const coinWord = isPaid
    ? (language === 'uz' ? 'Tarif' : language === 'ru' ? 'Тариф' : 'Plan')
    : 'UniCoin';
  const l = {
    ...baseL,
    title: isPaid
      ? (language === 'uz' ? 'Tarif tanlang' : language === 'ru' ? 'Выберите тариф' : 'Choose a Plan')
      : baseL.title,
    balance: (n: number) =>
      isPaid
        ? (language === 'uz' ? 'Faol tarif' : language === 'ru' ? 'Активный тариф' : 'Active plan')
        : baseL.balance(n),
    coins: coinWord,
  };

  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loadingTariffs, setLoadingTariffs] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    if (refillModalOpen) {
      setLoadingTariffs(true);
      setShowHistory(false);
      supabase
        .from('tariffs')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
        .then(({ data }) => {
          setTariffs((data as Tariff[]) || []);
          setLoadingTariffs(false);
        });
    }
  }, [refillModalOpen]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoadingTx(true);
    const { data } = await supabase
      .from('payment_transactions')
      .select('id, unicoin_amount, uzs_amount, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setTransactions((data as PaymentTransaction[]) || []);
    setLoadingTx(false);
  }, [user]);

  useEffect(() => {
    if (showHistory) fetchTransactions();
  }, [showHistory, fetchTransactions]);

  const handlePurchase = async (tariff: Tariff) => {
    if (!user) return;
    setProcessing(tariff.id);

    const totalCoins = tariff.coin_amount + tariff.bonus_coins;

    const { error } = await supabase.from('payment_transactions').insert({
      user_id: user.id,
      unicoin_amount: totalCoins,
      uzs_amount: tariff.price_uzs,
      rate_per_coin: Math.round(tariff.price_uzs / tariff.coin_amount),
      status: 'pending',
      payment_method: 'click',
      tariff_id: tariff.id,
    });

    if (error) {
      toast.error('Xatolik yuz berdi');
      setProcessing(null);
      return;
    }

    toast.success(l.redirecting);

    setTimeout(() => {
      window.open(CLICK_PAYMENT_URL, '_blank');
      setProcessing(null);
    }, 600);
  };

  const getTariffName = (t: Tariff) => {
    if (language === 'uz' && t.name_uz) return t.name_uz;
    if (language === 'ru' && t.name_ru) return t.name_ru;
    return t.name;
  };

  const statusBadge = (status: string) => {
    if (status === 'confirmed') return { label: l.confirmed, variant: 'default' as const, icon: CheckCircle2 };
    if (status === 'pending') return { label: l.pending, variant: 'secondary' as const, icon: Clock };
    return { label: l.created, variant: 'outline' as const, icon: Clock };
  };

  return (
    <Dialog open={refillModalOpen} onOpenChange={setRefillModalOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-background max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            {showHistory ? (
              <button
                className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                onClick={() => setShowHistory(false)}
              >
                <ArrowLeft className="w-4 h-4" />
                {l.back}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {!isPaid && <img src={unicoinLogo} alt="UniCoin" className="w-7 h-7 rounded-full" />}
                <h2 className="text-lg font-bold text-foreground">{l.title}</h2>
              </div>
            )}
            <button
              onClick={() => setRefillModalOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          {!isPaid && (
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <img src={unicoinLogo} alt="" className="w-4 h-4 rounded-full" />
              {l.balance(balance)}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!showHistory ? (
            <div className="p-4 space-y-3">
              {loadingTariffs ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                tariffs.map((tariff, i) => {
                  const Icon = tariffIcons[i % tariffIcons.length];
                  const totalCoins = tariff.coin_amount + tariff.bonus_coins;
                  const isPopular = !!tariff.badge;

                  return (
                    <motion.div
                      key={tariff.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`relative rounded-2xl border-2 p-5 transition-all ${
                        isPopular
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border bg-card'
                      }`}
                    >
                      {tariff.badge && (
                        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 text-[10px] font-bold whitespace-nowrap">
                          {tariff.badge}
                        </Badge>
                      )}

                      <div className="flex flex-col items-center text-center">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                          isPopular ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>

                        {/* Name */}
                        <h3 className="font-bold text-foreground text-base">{getTariffName(tariff)}</h3>

                        {/* Price - big and prominent */}
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-foreground tracking-tight">
                            {Number(tariff.price_uzs).toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground font-medium">{l.som}</span>
                        </div>

                        {/* Coins / plan info */}
                        <div className="mt-2 flex items-center justify-center gap-1.5">
                          {!isPaid && <img src={unicoinLogo} alt="" className="w-5 h-5 rounded-full" />}
                          <span className="font-bold text-primary text-lg">{tariff.coin_amount}</span>
                          <span className="text-sm text-muted-foreground font-medium">{l.coins}</span>
                          {!isPaid && tariff.bonus_coins > 0 && (
                            <span className="text-sm text-green-600 font-bold">
                              + {tariff.bonus_coins} {l.bonus}
                            </span>
                          )}
                        </div>

                        {!isPaid && tariff.bonus_coins > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {l.total} : {totalCoins} {l.coins}
                          </p>
                        )}

                        {/* Pay button */}
                        <Button
                          size="default"
                          variant={isPopular ? 'default' : 'outline'}
                          className="w-full mt-4 gap-2 rounded-xl font-semibold h-11"
                          disabled={!!processing}
                          onClick={() => handlePurchase(tariff)}
                        >
                          {processing === tariff.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4" />
                              {l.pay}
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* History link */}
              <button
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 pt-2 pb-1"
                onClick={() => setShowHistory(true)}
              >
                <History className="w-4 h-4" />
                {l.history}
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <History className="w-4 h-4" />
                {l.history}
              </h3>

              {loadingTx ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 text-sm">{l.noHistory}</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const sb = statusBadge(tx.status);
                    const StatusIcon = sb.icon;
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3.5 bg-muted/50 rounded-xl text-sm border border-border/50">
                        <div className="flex items-center gap-2.5">
                          <img src={unicoinLogo} alt="" className="w-6 h-6 rounded-full" />
                          <div>
                            <p className="font-semibold text-foreground">{tx.unicoin_amount} UniCoin</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{Number(tx.uzs_amount).toLocaleString()} UZS</p>
                          <Badge variant={sb.variant} className="text-[10px] px-1.5 py-0">
                            <StatusIcon className="w-3 h-3 mr-0.5" />
                            {sb.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
