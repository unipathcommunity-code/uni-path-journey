export interface PricingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
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

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'Starter',
    name: 'Starter',
    priceMonthly: 29,
    priceAnnual: 24,
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
    name: 'Growth (Pro)',
    priceMonthly: 79,
    priceAnnual: 64,
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
    name: 'Enterprise',
    priceMonthly: 199,
    priceAnnual: 159,
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
