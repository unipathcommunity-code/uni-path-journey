import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Sparkles, HelpCircle, ChevronDown, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
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

export default function PublicPricing() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [billing, setBilling] = useState<Billing>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const isUz = language === 'uz';
  const isRu = language === 'ru';

  const t = {
    badge: isUz ? 'Premium Tariflar' : isRu ? 'Премиум Тарифы' : 'Premium Pricing',
    title: isUz ? 'Biznesingiz uchun mukammal reja'
      : isRu ? 'Идеальный тариф для вашего бизнеса'
      : 'The perfect plan for your business',
    subtitle: isUz ? "Yashirin to'lovlar yo'q. Istalgan vaqtda tarifingizni o'zgartiring yoki bekor qiling."
      : isRu ? 'Без скрытых комиссий. Меняйте или отменяйте тариф в любое время.'
      : 'No hidden fees. Upgrade, downgrade, or cancel anytime.',
    monthly: isUz ? 'Oylik' : isRu ? 'Ежемесячно' : 'Monthly',
    annual: isUz ? 'Yillik' : isRu ? 'Ежегодно' : 'Annual',
    perMonth: isUz ? '/oy' : isRu ? '/мес' : '/mo',
    annualNote: isUz ? "yillik to'lov bilan" : isRu ? 'при оплате за год' : 'billed annually',
    popular: isUz ? 'Eng ommabop' : isRu ? 'Популярный' : 'Most popular',
    start: isUz ? 'Boshlash' : isRu ? 'Начать' : 'Get started',
    contact: isUz ? 'Biznesni ulash' : isRu ? 'Связаться с нами' : 'Contact sales',
    save: isUz ? '2 oy bepul' : isRu ? '2 месяца бесплатно' : '2 months free',
    featuresTitle: isUz ? 'Barcha rejalar o\'z ichiga oladi:' : isRu ? 'Все тарифы включают:' : 'All plans include:',
    faqTitle: isUz ? 'Ko\'p beriladigan savollar' : isRu ? 'Часто задаваемые вопросы' : 'Frequently Asked Questions',
  };

  const coreFeatures = [
    isUz ? "Avtomatlashtirilgan moliya hisobi" : isRu ? "Автоматический финансовый учет" : "Automated financial accounting",
    isUz ? "Mijozlar bazasi (CRM) va xabarnomalar" : isRu ? "База клиентов (CRM) и уведомления" : "Client database (CRM) & notifications",
    isUz ? "Xavfsiz ma'lumotlar saqlanishi" : isRu ? "Безопасное хранение данных" : "Secure data isolation",
    isUz ? "Oson xodimlar boshqaruvi" : isRu ? "Простое управление сотрудниками" : "Simple staff management",
  ];

  const faqs = [
    {
      q: isUz ? "Tarifni keyinchalik o'zgartirsam bo'ladimi?" : isRu ? "Могу ли я изменить тариф позже?" : "Can I change my plan later?",
      a: isUz 
        ? "Ha, albatta. Istalgan vaqtda shaxsiy kabinetingiz orqali tarif darajasini oshirishingiz, tushirishingiz yoki obunani butunlay bekor qilishingiz mumkin."
        : isRu 
        ? "Да, конечно. Вы можете повысить, понизить тариф или отменить подписку в любое время через личный кабинет."
        : "Yes, absolutely. You can upgrade, downgrade, or cancel your subscription at any time directly from your billing dashboard."
    },
    {
      q: isUz ? "Bepul sinov muddati bormi?" : isRu ? "Есть ли бесплатный пробный период?" : "Is there a free trial?",
      a: isUz
        ? "Ha, ro'yxatdan o'tganingizdan so'ng 14 kun davomida tizimni bepul va cheklovlarsiz sinab ko'rishingiz mumkin. Kredit karta talab qilinmaydi."
        : isRu
        ? "Да, после регистрации вы получаете 14 дней бесплатного доступа без ограничений. Кредитная карта не требуется."
        : "Yes, you get a 14-day free trial to explore all features. No credit card is required to sign up."
    },
    {
      q: isUz ? "AI Kamera nazorati nima va u qanday ishlaydi?" : isRu ? "Что такое AI-контроль камер и как это работает?" : "What is AI Camera control and how does it work?",
      a: isUz
        ? "AI Kamera xizmati sizning xavfsizlik kameralaringizni tizimimizga ulab, xodimlar va mijozlar davomatini, faolligini hamda xavfsizlikni avtomatlashtirishga yordam beradi."
        : isRu
        ? "AI-контроль подключает ваши камеры безопасности к нашей системе ИИ для автоматического отслеживания посещаемости, активности и безопасности."
        : "AI Camera operational control integrates your security cameras with our AI engine to track attendance, detect occupancy, and monitor security automatically."
    },
    {
      q: isUz ? "Shaxsiy domen ulanishi qanday amalga oshiriladi?" : isRu ? "Как работает подключение собственного домена?" : "How does custom domain connection work?",
      a: isUz
        ? "Pro va Enterprise tariflarida o'z brendingiz nomidagi domenni (masalan, dashboard.kompaniyangiz.uz) tizimimizga to'liq bog'lashingiz mumkin."
        : isRu
        ? "На тарифах Pro и Enterprise вы можете привязать свой собственный домен (например, dashboard.yourcompany.uz) к нашей системе."
        : "With Pro and Enterprise plans, you can connect your custom domain name (e.g. dashboard.yourcompany.com) to present a white-labeled dashboard to your users."
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-foreground font-sans overflow-x-hidden selection:bg-primary/30 relative">
      {/* Background Gradients & Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-80" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#030712]/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-20 px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-white to-primary bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              UniPath
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              {isUz ? 'Tizimga kirish' : isRu ? 'Войти' : 'Sign in'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary shadow-[0_0_15px_rgba(212,175,55,0.08)]">
            <Sparkles className="size-3.5 text-primary animate-pulse" />
            {t.badge}
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight leading-none bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="mt-6 text-lg text-white/50 max-w-2xl mx-auto font-medium">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Dynamic Controls / Toggles */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Billing Switcher */}
          <div className="inline-flex p-1.5 rounded-2xl border border-white/5 bg-[#0f172a]/40 backdrop-blur-xl">
            {(['monthly', 'annual'] as Billing[]).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`relative px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  billing === b
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {b === 'monthly' ? t.monthly : t.annual}
                {b === 'annual' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold uppercase tracking-wide">
                    {t.save}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Currency Switcher */}
          <div className="inline-flex p-1.5 rounded-2xl border border-white/5 bg-[#0f172a]/40 backdrop-blur-xl">
            {(['UZS', 'USD'] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currency === c
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {c === 'UZS' ? "so'm (UZS)" : 'USD ($)'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((plan, i) => {
            const price = planPrice(plan, currency, billing);
            const features = isUz ? plan.featuresUz : isRu ? plan.featuresRu : plan.featuresEn;
            const desc = isUz ? plan.descUz : isRu ? plan.descRu : plan.descEn;
            const isEnterprise = plan.id === 'Enterprise';
            const isPro = plan.id === 'Pro';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className={`relative flex flex-col justify-between p-8 rounded-[2.5rem] border transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-[#131b2e] to-[#0c101f] border-primary/50 shadow-[0_0_40px_rgba(212,175,55,0.12)]'
                    : 'bg-[#0f172a]/45 backdrop-blur-md border-white/5 hover:border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-widest shadow-lg">
                    {t.popular}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black tracking-tight text-white">{plan.name}</h3>
                    {isPro && <Zap className="size-5 text-primary" />}
                    {isEnterprise && <ShieldCheck className="size-5 text-indigo-400" />}
                  </div>

                  <p className="text-sm text-white/50 leading-relaxed min-h-[50px]">
                    {desc}
                  </p>

                  <div className="mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl md:text-5xl font-black tracking-tight text-white">
                        {formatPrice(price, currency)}
                      </span>
                      <span className="text-sm text-white/40 font-bold">{t.perMonth}</span>
                    </div>

                    {billing === 'annual' && (
                      <div className="text-[11px] text-white/40 mt-1.5 font-medium">
                        {formatPrice(planMonthly(plan, currency), currency)} {t.perMonth} · {t.annualNote}
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-8 space-y-3.5">
                    {features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-white/70 leading-normal font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <Button
                    onClick={() => navigate(isEnterprise ? '/tizimlashtirish' : '/auth?mode=signup')}
                    className={`w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                      plan.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/10'
                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <span>{isEnterprise ? t.contact : t.start}</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Global Entitlements Banner */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <div className="p-8 rounded-[2rem] border border-white/5 bg-[#0f172a]/30 backdrop-blur-xl text-center">
          <h4 className="text-lg font-bold text-white mb-6">{t.featuresTitle}</h4>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {coreFeatures.map((feat, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="size-4 text-primary" />
                </div>
                <span className="text-xs font-semibold text-white/70">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-center text-white mb-10 flex items-center justify-center gap-2">
          <HelpCircle className="size-7 text-primary" />
          {t.faqTitle}
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="border border-white/5 rounded-2xl bg-[#0f172a]/30 backdrop-blur-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-white hover:text-primary transition-colors gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`size-4 text-white/40 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-5 text-sm text-white/50 leading-relaxed font-medium">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 border-t border-white/5 text-center bg-[#02050e]/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-center gap-8 mb-8 text-sm font-semibold text-white/50">
            <Link to="/" className="hover:text-primary transition-colors">
              {isUz ? 'Bosh sahifa' : isRu ? 'Главная' : 'Home'}
            </Link>
            <Link to="/about" className="hover:text-primary transition-colors">
              {isUz ? 'Kompaniya' : isRu ? 'О нас' : 'About'}
            </Link>
            <Link to="/auth" className="hover:text-primary transition-colors">
              {isUz ? 'Kirish' : isRu ? 'Войти' : 'Sign in'}
            </Link>
          </div>
          <p className="text-xs text-white/30">
            © 2026 UniPath SaaS Platform. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </footer>
    </div>
  );
}
