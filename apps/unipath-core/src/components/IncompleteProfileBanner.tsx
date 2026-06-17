import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const labels = {
  en: {
    warning: 'Your profile is incomplete! Our team cannot contact you.',
    detail: 'Please add your Phone & Telegram to proceed.',
    cta: 'Complete Profile',
  },
  uz: {
    warning: 'Profilingiz to\'liq emas! Jamoamiz siz bilan bog\'lana olmaydi.',
    detail: 'Iltimos, telefon va Telegram qo\'shing.',
    cta: 'Profilni to\'ldiring',
  },
  ru: {
    warning: 'Ваш профиль не заполнен! Наша команда не может связаться с вами.',
    detail: 'Добавьте телефон и Telegram.',
    cta: 'Заполнить профиль',
  },
};

interface Props {
  hasDocuments: boolean;
  missingContactInfo: boolean;
}

export function IncompleteProfileBanner({ hasDocuments, missingContactInfo }: Props) {
  const { language } = useApp();
  const l = labels[language as keyof typeof labels] || labels.en;

  if (!hasDocuments || !missingContactInfo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 mb-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-destructive/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive leading-snug">{l.warning}</p>
            <p className="text-xs text-destructive/70 mt-0.5">{l.detail}</p>
          </div>
        </div>
        <Link to="/student/profile" className="flex-shrink-0 self-end sm:self-auto">
          <Button size="sm" variant="destructive" className="gap-1.5 rounded-xl text-xs h-9 px-4 shadow-sm whitespace-nowrap">
            {l.cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
