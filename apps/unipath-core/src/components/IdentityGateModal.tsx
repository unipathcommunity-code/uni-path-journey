import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Phone, Send, User } from 'lucide-react';
import { toast } from 'sonner';

const labels = {
  en: {
    title: 'Complete Your Identity',
    subtitle: 'We need your contact info before you can proceed. This helps our team reach you.',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    phone: 'Phone Number',
    phonePlaceholder: '+998 XX XXX XX XX',
    telegram: 'Telegram Username',
    telegramPlaceholder: '@username',
    submit: 'Continue to Dashboard',
    nameError: 'Please enter first and last name',
    phoneError: 'Enter a valid +998 phone number',
    telegramError: 'Enter a valid Telegram username (@handle)',
  },
  uz: {
    title: 'Shaxsingizni tasdiqlang',
    subtitle: 'Davom etish uchun aloqa ma\'lumotlaringiz kerak. Bu jamoamizga siz bilan bog\'lanishga yordam beradi.',
    fullName: 'To\'liq ism',
    fullNamePlaceholder: 'Ismingizni kiriting',
    phone: 'Telefon raqam',
    phonePlaceholder: '+998 XX XXX XX XX',
    telegram: 'Telegram foydalanuvchi nomi',
    telegramPlaceholder: '@username',
    submit: 'Boshqaruv paneliga o\'tish',
    nameError: 'Ism va familiyangizni kiriting',
    phoneError: 'To\'g\'ri +998 telefon raqam kiriting',
    telegramError: 'To\'g\'ri Telegram username kiriting (@handle)',
  },
  ru: {
    title: 'Подтвердите личность',
    subtitle: 'Укажите контактные данные, чтобы продолжить. Это поможет нашей команде связаться с вами.',
    fullName: 'Полное имя',
    fullNamePlaceholder: 'Введите полное имя',
    phone: 'Номер телефона',
    phonePlaceholder: '+998 XX XXX XX XX',
    telegram: 'Telegram имя пользователя',
    telegramPlaceholder: '@username',
    submit: 'Перейти к панели',
    nameError: 'Введите имя и фамилию',
    phoneError: 'Введите корректный номер +998',
    telegramError: 'Введите корректный Telegram (@handle)',
  },
};

interface IdentityGateModalProps {
  onComplete: () => void;
}

export function IdentityGateModal({ onComplete }: IdentityGateModalProps) {
  const { user } = useAuth();
  const { language } = useApp();
  const l = labels[language as keyof typeof labels] || labels.en;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [telegram, setTelegram] = useState('@');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone, telegram_username')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        if (data.full_name) setFullName(data.full_name);
        if (data.phone) setPhone(data.phone);
        if (data.telegram_username) setTelegram(data.telegram_username);
      }
    })();
  }, [user]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length < 2 || nameParts.some(p => p.length < 2)) {
      errs.fullName = l.nameError;
    }
    const phoneClean = phone.replace(/\s/g, '');
    if (!/^\+998\d{9}$/.test(phoneClean)) {
      errs.phone = l.phoneError;
    }
    const tgRaw = telegram.replace(/^@/, '').trim();
    if (tgRaw.length > 0) {
      const tg = `@${tgRaw}`;
      if (!/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(tg)) {
        errs.telegram = l.telegramError;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    const tgRaw = telegram.replace(/^@/, '').trim();
    const tg = tgRaw.length > 0 ? `@${tgRaw}` : null;
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.replace(/\s/g, ''),
        telegram_username: tg,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success(language === 'uz' ? 'Saqlandi!' : language === 'ru' ? 'Сохранено!' : 'Saved!');
      onComplete();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{l.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{l.subtitle}</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="flex items-center gap-2 mb-1.5">
              <User className="w-3.5 h-3.5" />
              {l.fullName} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={l.fullNamePlaceholder}
            />
            {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-1.5">
              <Phone className="w-3.5 h-3.5" />
              {l.phone} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={l.phonePlaceholder}
            />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-1.5">
              <Send className="w-3.5 h-3.5" />
              {l.telegram} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder={l.telegramPlaceholder}
            />
            {errors.telegram && <p className="text-xs text-destructive mt-1">{errors.telegram}</p>}
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full mt-2" size="lg">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ...
              </span>
            ) : l.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}
