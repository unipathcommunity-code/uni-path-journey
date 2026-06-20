// ---------------------------------------------------------------------------
// SINGLE SOURCE OF TRUTH for tariff DISPLAY (prices + marketing copy).
// Entitlements/gating live in `@/hooks/usePlanLimits` (TIER_FEATURES).
// `id`/`tier` here MUST stay in sync with planToTier() there.
// ---------------------------------------------------------------------------

/** Internal tier key — matches PlanTier in usePlanLimits. */
export type PlanTier = 'starter' | 'growth' | 'enterprise';
/** Display currencies (user-switchable toggle). */
export type Currency = 'UZS' | 'USD';
/** Billing cadence. */
export type Billing = 'monthly' | 'annual';

export interface PricingPlan {
  id: string;
  /** Links this display plan to its entitlement tier in usePlanLimits. */
  tier: PlanTier;
  name: string;
  /** USD prices (kept for backward compat + intl audience). */
  priceMonthly: number;
  priceAnnual: number;
  /** UZS prices (local market). priceAnnual* = per-month price billed annually. */
  priceMonthlyUzs: number;
  priceAnnualUzs: number;
  descUz: string;
  descEn: string;
  descRu: string;
  featuresUz: string[];
  featuresEn: string[];
  featuresRu: string[];
  style: string;
  color?: string;
  borderColor?: string;
  popular?: boolean;
}

/** Monthly price for a plan in the chosen currency. */
export function planMonthly(plan: PricingPlan, currency: Currency): number {
  return currency === 'UZS' ? plan.priceMonthlyUzs : plan.priceMonthly;
}

/** Per-month price when billed annually, in the chosen currency. */
export function planAnnual(plan: PricingPlan, currency: Currency): number {
  return currency === 'UZS' ? plan.priceAnnualUzs : plan.priceAnnual;
}

/** Price for a plan + currency + billing cadence (per-month figure). */
export function planPrice(plan: PricingPlan, currency: Currency, billing: Billing): number {
  return billing === 'annual' ? planAnnual(plan, currency) : planMonthly(plan, currency);
}

/** Human-readable formatted price, e.g. "349 000 so'm" or "$29". */
export function formatPrice(amount: number, currency: Currency): string {
  if (currency === 'USD') return `$${amount}`;
  return `${new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(amount)} so'm`;
}

/** Look up a plan by its id ('Starter' | 'Pro' | 'Enterprise'). */
export function getPlan(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.id === id);
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'Starter',
    tier: 'starter',
    name: 'Starter',
    priceMonthly: 29,
    priceAnnual: 24,
    priceMonthlyUzs: 349000,
    priceAnnualUzs: 290000,
    descUz: 'Yangi boshlayotgan kichik biznes va xizmat ko\'rsatish kompaniyalari uchun',
    descEn: 'For small businesses and service companies just getting started',
    descRu: 'Для малого бизнеса и сервисных компаний, которые только начинают',
    featuresUz: [
      'Bitta filial boshqaruvi',
      '3 tagacha xodimlar (owner, manager, specialist)',
      'CRM Pipeline — leaddan yakungacha nazorat',
      'Hujjat va fayl saqlash (5 GB)',
      'E\'lonlar va mijozlar boshqaruvi',
    ],
    featuresEn: [
      'Single branch management',
      'Up to 3 staff (owner, manager, specialist)',
      'CRM Pipeline — track leads through all stages',
      'File & document storage (5 GB)',
      'Announcements & client management',
    ],
    featuresRu: [
      'Управление одним филиалом',
      'До 3 сотрудников (владелец, менеджер, специалист)',
      'CRM Pipeline — контроль лидов на всех этапах',
      'Хранение файлов и документов (5 GB)',
      'Объявления и управление клиентами',
    ],
    style: 'bg-[#122131]/40 border-white/5 hover:bg-[#122131]/60',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'group-hover:border-cyan-500/30',
  },
  {
    id: 'Pro',
    tier: 'growth',
    name: 'Growth (Pro)',
    priceMonthly: 79,
    priceAnnual: 64,
    priceMonthlyUzs: 990000,
    priceAnnualUzs: 790000,
    popular: true,
    descUz: 'Tez o\'sayotgan bizneslar — fitnes, ta\'lim, restoran, klinika va boshqalar uchun',
    descEn: 'For fast-growing businesses — gym, education, restaurant, clinic, and more',
    descRu: 'Для быстрорастущего бизнеса — фитнес, образование, ресторан, клиника и другие',
    featuresUz: [
      '5 tagacha filial, 25 tagacha xodim',
      'Buxgalteriya moduli — daromad/xarajat, P&L hisobot',
      'Barcha modullar (Moliya, Kadrlar, Ombor)',
      'AI Kamera operatsion nazorati',
      'Telegram Bot integratsiyasi va Theming',
      '50 GB Bulutli xotira va API kirish',
    ],
    featuresEn: [
      'Up to 5 branches, 25 staff members',
      'Accounting module — income/expense & P&L reports',
      'All modules (Finance, HR, Inventory)',
      'AI Camera operational control',
      'Telegram Bot integration & Customizable Themes',
      '50 GB Cloud Storage & custom API',
    ],
    featuresRu: [
      'До 5 филиалов, до 25 сотрудников',
      'Модуль бухгалтерии — доходы/расходы и P&L отчёты',
      'Все модули (Финансы, HR, Склад)',
      'AI-камера операционного контроля',
      'Интеграция Telegram Bot и кастомизируемые темы',
      '50 GB облачное хранилище и пользовательский API',
    ],
    style: 'bg-gradient-to-b from-[#d2bbff]/10 to-[#4cd7f6]/5 border-[#d2bbff]/30 shadow-[0_0_50px_rgba(210,187,255,0.15)] hover:shadow-[0_0_70px_rgba(210,187,255,0.25)] transform md:-translate-y-4',
    color: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-primary/50 group-hover:border-primary',
  },
  {
    id: 'Enterprise',
    tier: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 199,
    priceAnnual: 159,
    priceMonthlyUzs: 2490000,
    priceAnnualUzs: 1990000,
    descUz: 'Katta tarmoqli brendlar va korporatsiyalar uchun',
    descEn: 'For established networks and large brands',
    descRu: 'Для крупных сетей, брендов и корпораций',
    featuresUz: [
      'Cheksiz filiallar va xodimlar',
      'To\'liq CRM + Buxgalteriya + Barcha modullar',
      'Shaxsiy Domen ulanishi (Custom Domain)',
      'AI Xavfsizlik & Smart Alerts',
      'Cheksiz bulutli xotira va SLA kafolati',
      '100% Ma\'lumotlar izolyatsiyasi + 24/7 VIP yordam',
    ],
    featuresEn: [
      'Unlimited branches & staff members',
      'Full CRM + Accounting + All modules',
      'Custom Domain Connection (unipath.me or custom)',
      'AI Security & Smart Alerts',
      'Unlimited Cloud Storage & SLA Guarantee',
      '100% Data isolation + 24/7 VIP dedicated support',
    ],
    featuresRu: [
      'Неограниченное количество филиалов и сотрудников',
      'Полный CRM + Бухгалтерия + Все модули',
      'Подключение пользовательского домена',
      'AI-безопасность и умные оповещения',
      'Безлимитное облачное хранилище и SLA гарантия',
      '100% изоляция данных + 24/7 VIP поддержка',
    ],
    style: 'bg-[#122131]/40 border-white/5 hover:bg-[#122131]/60',
    color: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'group-hover:border-pink-500/30',
  },
];
