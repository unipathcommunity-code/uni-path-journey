import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  PRICING_PLANS,
  formatPrice,
  planPrice,
  planMonthly,
  type Currency,
  type Billing,
} from '@/core/constants/pricing';

/**
 * Public, transparent pricing page. Single source of truth = pricing.ts.
 * Customer-facing — shows real prices with UZS/USD + monthly/annual toggles.
 */
export default function PublicPricing() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [billing, setBilling] = useState<Billing>('monthly');

  const isUz = language === 'uz';
  const isRu = language === 'ru';

  const t = {
    badge: isUz ? 'Shaffof narxlar' : isRu ? 'Прозрачные цены' : 'Transparent pricing',
    title: isUz ? 'Biznesingizga mos tarifni tanlang'
      : isRu ? 'Выберите тариф для вашего бизнеса'
      : 'Choose the plan that fits your business',
    subtitle: isUz ? "Yashirin to'lovlar yo'q. Istalgan vaqtda yangilang yoki bekor qiling."
      : isRu ? 'Без скрытых платежей. Меняйте или отменяйте в любой момент.'
      : 'No hidden fees. Upgrade or cancel anytime.',
    monthly: isUz ? 'Oylik' : isRu ? 'Ежемесячно' : 'Monthly',
    annual: isUz ? 'Yillik' : isRu ? 'Ежегодно' : 'Annual',
    perMonth: isUz ? '/oy' : isRu ? '/мес' : '/mo',
    annualNote: isUz ? 'yillik to\'lovda' : isRu ? 'при оплате за год' : 'billed annually',
    popular: isUz ? 'Eng mashhur' : isRu ? 'Популярный' : 'Most popular',
    start: isUz ? 'Boshlash' : isRu ? 'Начать' : 'Get started',
    contact: isUz ? "Bog'lanish" : isRu ? 'Связаться' : 'Contact sales',
    save: isUz ? '2 oy bepul' : isRu ? '2 месяца бесплатно' : '2 months free',
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            {t.badge}
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">{t.subtitle}</p>

          {/* Toggles */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* Billing toggle */}
            <div className="inline-flex p-1 rounded-full border border-border/60 bg-card">
              {(['monthly', 'annual'] as Billing[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                    billing === b ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {b === 'monthly' ? t.monthly : t.annual}
                  {b === 'annual' && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                      {t.save}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {/* Currency toggle */}
            <div className="inline-flex p-1 rounded-full border border-border/60 bg-card">
              {(['UZS', 'USD'] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    currency === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c === 'UZS' ? "so'm" : 'USD'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan, i) => {
            const price = planPrice(plan, currency, billing);
            const features = isUz ? plan.featuresUz : isRu ? plan.featuresRu : plan.featuresEn;
            const desc = isUz ? plan.descUz : isRu ? plan.descRu : plan.descEn;
            const isEnterprise = plan.id === 'Enterprise';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className={`relative rounded-2xl border p-7 flex flex-col bg-card ${
                  plan.popular ? 'border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/10' : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow">
                    {t.popular}
                  </div>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground min-h-[40px]">{desc}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">{formatPrice(price, currency)}</span>
                  <span className="text-sm text-muted-foreground">{t.perMonth}</span>
                </div>
                {billing === 'annual' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatPrice(planMonthly(plan, currency), currency)} {t.perMonth} · {t.annualNote}
                  </div>
                )}

                <Button
                  onClick={() => navigate(isEnterprise ? '/tizimlashtirish' : '/auth?mode=signup')}
                  variant={plan.popular ? 'default' : 'secondary'}
                  className="mt-6 w-full"
                >
                  {isEnterprise ? t.contact : t.start}
                  <ArrowRight className="size-4 ml-1" />
                </Button>

                <ul className="mt-6 space-y-2.5 text-sm">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="size-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-10 text-sm text-muted-foreground">
          <Link to="/" className="text-primary hover:underline">
            ← {isUz ? 'Bosh sahifa' : isRu ? 'На главную' : 'Back home'}
          </Link>
        </div>
      </section>
    </div>
  );
}
