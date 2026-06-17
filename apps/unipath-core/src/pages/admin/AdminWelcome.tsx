import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import {
  CheckCircle2, ArrowRight, Palette, Bell, Users,
  Settings, Smartphone, Globe, Zap, Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    titleUz: "Tabriklaymiz! 🎉",
    titleRu: "Поздравляем! 🎉",
    titleEn: "Congratulations! 🎉",
    descUz: "Biznesingiz muvaffaqiyatli ro'yxatdan o'tdi va tizim ishga tushdi. Endi bir necha qadamda platformangizni sozlaylik.",
    descRu: "Ваш бизнес успешно зарегистрирован и система запущена. Давайте настроим платформу за несколько шагов.",
    descEn: "Your business has been successfully registered and the system is live. Let's set up your platform in a few steps.",
    actionUz: "Boshlash",
    actionRu: "Начать",
    actionEn: "Get Started",
  },
  {
    icon: Palette,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    titleUz: "Brend va ko'rinish",
    titleRu: "Бренд и внешний вид",
    titleEn: "Brand & Appearance",
    descUz: "Admin Sozlamalar sahifasida logotip, rang sxemasi va biznes ma'lumotlaringizni sozlang. Mijozlaringiz sizning brendingizni ko'radi.",
    descRu: "В настройках установите логотип, цветовую схему и данные вашего бизнеса. Клиенты увидят ваш бренд.",
    descEn: "In Admin Settings, set your logo, color scheme and business details. Your clients will see your brand.",
    actionUz: "Keyingi",
    actionRu: "Далее",
    actionEn: "Next",
    linkUz: "Sozlamalarni ochish →",
    linkRu: "Открыть настройки →",
    linkEn: "Open Settings →",
    href: "/admin/settings",
  },
  {
    icon: Bell,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    titleUz: "Telegram bildirishnomalar",
    titleRu: "Telegram-уведомления",
    titleEn: "Telegram Notifications",
    descUz: "Telegram bot ulang va mijozlarning murojaatlari darhol sizning Telegram kanalingizga tushadi. Sozlamalar → Telegram Bot.",
    descRu: "Подключите Telegram-бот и заявки клиентов сразу приходят в ваш канал. Настройки → Telegram Bot.",
    descEn: "Connect a Telegram bot and client inquiries arrive instantly in your channel. Settings → Telegram Bot.",
    actionUz: "Keyingi",
    actionRu: "Далее",
    actionEn: "Next",
    linkUz: "Telegram sozlash →",
    linkRu: "Настроить Telegram →",
    linkEn: "Set up Telegram →",
    href: "/admin/settings",
  },
  {
    icon: Users,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    titleUz: "Xodimlar va rollar",
    titleRu: "Сотрудники и роли",
    titleEn: "Staff & Roles",
    descUz: "Xodimlaringizni tizimga qo'shing: menejer, buxgalter, agent. Har biri o'z roli bo'yicha ma'lumotlarni ko'radi.",
    descRu: "Добавьте сотрудников: менеджер, бухгалтер, агент. Каждый видит только свои данные по роли.",
    descEn: "Add your staff: manager, accountant, agent. Each sees only their role-specific data.",
    actionUz: "Keyingi",
    actionRu: "Далее",
    actionEn: "Next",
    linkUz: "Xodimlarni qo'shish →",
    linkRu: "Добавить сотрудников →",
    linkEn: "Add Staff →",
    href: "/admin/users",
  },
  {
    icon: Rocket,
    color: 'text-primary',
    bg: 'bg-primary/10',
    titleUz: "Hammasi tayyor!",
    titleRu: "Всё готово!",
    titleEn: "All Set!",
    descUz: "Sizning biznes boshqaruv tizimingiz to'liq ishlashga tayyor. Bosh sahifaga o'ting va ishni boshlang!",
    descRu: "Ваша система управления бизнесом полностью готова к работе. Перейдите на главную страницу и начните!",
    descEn: "Your business management system is fully ready. Go to the dashboard and start working!",
    actionUz: "Dashboardga o'tish",
    actionRu: "На главную",
    actionEn: "Go to Dashboard",
  },
];

export default function AdminWelcome() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { language, activeTenant } = useApp();

  const lang = (language === 'ru' || language === 'uz') ? language : 'en';
  const s = STEPS[step];
  const Icon = s.icon;

  const title = lang === 'uz' ? s.titleUz : lang === 'ru' ? s.titleRu : s.titleEn;
  const desc = lang === 'uz' ? s.descUz : lang === 'ru' ? s.descRu : s.descEn;
  const action = lang === 'uz' ? s.actionUz : lang === 'ru' ? s.actionRu : s.actionEn;
  const link = lang === 'uz' ? (s as any).linkUz : lang === 'ru' ? (s as any).linkRu : (s as any).linkEn;

  const isLast = step === STEPS.length - 1;

  const handleAction = () => {
    if (isLast) {
      navigate('/admin/dashboard');
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/40' : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 text-center"
          >
            {/* Icon */}
            <div className={`w-16 h-16 ${s.bg} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
              <Icon className={`w-8 h-8 ${s.color}`} />
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{title}</h1>

            {/* Description */}
            <p className="text-white/60 leading-relaxed mb-8">{desc}</p>

            {/* Optional quick link */}
            {link && (s as any).href && (
              <button
                onClick={() => navigate((s as any).href)}
                className="block text-primary hover:text-primary/80 text-sm font-medium mb-6 transition-colors"
              >
                {link}
              </button>
            )}

            {/* Feature checklist for step 0 */}
            {step === 0 && (
              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                {[
                  { uz: 'CRM va arizalar', ru: 'CRM и заявки', en: 'CRM & Applications' },
                  { uz: 'Telegram bot', ru: 'Telegram-бот', en: 'Telegram Bot' },
                  { uz: 'Moliya & hisob', ru: 'Финансы', en: 'Finance & Billing' },
                  { uz: 'Analitika', ru: 'Аналитика', en: 'Analytics' },
                  { uz: 'Jamoaviy rollar', ru: 'Командные роли', en: 'Team Roles' },
                  { uz: 'Jamoat sayti', ru: 'Публичный сайт', en: 'Public Website' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-white/70">
                      {lang === 'uz' ? f.uz : lang === 'ru' ? f.ru : f.en}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action button */}
            <Button
              onClick={handleAction}
              className="w-full h-12 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {action}
              {!isLast && <ArrowRight className="w-4 h-4" />}
              {isLast && <Rocket className="w-4 h-4" />}
            </Button>

            {/* Skip for non-last steps */}
            {!isLast && step > 0 && (
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="mt-4 text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                {lang === 'uz' ? 'O\'tkazib yuborish' : lang === 'ru' ? 'Пропустить' : 'Skip for now'}
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tenant name at bottom */}
        {activeTenant?.name && (
          <p className="text-center text-white/20 text-xs mt-6">
            {activeTenant.name} · UniPath Platform
          </p>
        )}
      </div>
    </div>
  );
}
