import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Phone,
  Globe,
  Save,
  Camera,
  Loader2,
  Send,
  LogOut,
} from 'lucide-react';

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  telegram_username: string | null;
  selected_country: string | null;
  preferred_language: string | null;
  avatar_url: string | null;
  parent_name: string | null;
  parent_phone: string | null;
}

const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
  return phoneRegex.test(phone.replace(/\s/g, '').replace(/^\+998/, '+998 '));
};

const isValidTelegram = (username: string): boolean => {
  if (!username || username.trim() === '' || username.trim() === '@') return true;
  const normalized = username.startsWith('@') ? username : `@${username}`;
  const telegramRegex = /^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
  return telegramRegex.test(normalized);
};

const labels = {
  uz: {
    title: 'Profil',
    subtitle: 'Shaxsiy ma\'lumotlaringizni boshqaring',
    fullName: 'To\'liq ism',
    fullNamePlaceholder: 'Ismingizni kiriting',
    email: 'Email',
    emailPlaceholder: 'Email kiriting',
    phone: 'Telefon raqam',
    phonePlaceholder: '+998 90 123 45 67',
    phoneError: 'To\'g\'ri telefon raqam kiriting (+998 XX XXX XX XX)',
    telegram: 'Telegram username',
    telegramPlaceholder: '@username',
    telegramError: 'To\'g\'ri Telegram username kiriting (@username)',
    country: 'Maqsad davlat',
    countryPlaceholder: 'Masalan: Janubiy Koreya, Germaniya',
    save: 'Saqlash',
    saving: 'Saqlanmoqda...',
    accountInfo: 'Hisob ma\'lumotlari',
    accountId: 'Hisob ID',
    created: 'Yaratilgan',
    emailVerified: 'Email tasdiqlangan',
    yes: 'Ha',
    no: 'Yo\'q',
    validationError: 'Iltimos, barcha majburiy maydonlarni to\'g\'ri to\'ldiring.',
    errorTitle: 'Xatolik',
    profileUpdated: 'Profil yangilandi',
    profileUpdatedDesc: 'Ma\'lumotlaringiz muvaffaqiyatli saqlandi.',
    profileError: 'Profil yangilanmadi. Qayta urinib ko\'ring.',
    avatarUpdated: 'Avatar yangilandi',
    avatarUpdatedDesc: 'Profil rasmingiz yangilandi.',
    invalidFileType: 'Noto\'g\'ri fayl turi',
    invalidFileTypeDesc: 'Faqat JPG, PNG yoki WEBP rasmlar yuklang.',
    fileTooLarge: 'Fayl juda katta',
    fileTooLargeDesc: 'Maksimal fayl hajmi 5MB.',
    uploadFailed: 'Yuklash xatosi',
    parentName: 'Ota-ona ismi',
    parentNamePlaceholder: 'Ota yoki onangiz ismini kiriting',
    parentPhone: 'Ota-ona telefon raqami',
    parentPhonePlaceholder: '+998 90 123 45 67',
    parentSection: 'Ota-ona ma\'lumotlari',
    parentSectionDesc: 'Qabul qilinganingizda ota-onangizga xabar yuboriladi',
    logout: 'Tizimdan chiqish',
  },
  ru: {
    title: 'Профиль',
    subtitle: 'Управляйте своей личной информацией',
    fullName: 'Полное имя',
    fullNamePlaceholder: 'Введите ваше имя',
    email: 'Эл. почта',
    emailPlaceholder: 'Введите email',
    phone: 'Телефон',
    phonePlaceholder: '+998 90 123 45 67',
    phoneError: 'Введите правильный номер (+998 XX XXX XX XX)',
    telegram: 'Telegram username',
    telegramPlaceholder: '@username',
    telegramError: 'Введите правильный Telegram username (@username)',
    country: 'Целевая страна',
    countryPlaceholder: 'Например: Южная Корея, Германия',
    save: 'Сохранить',
    saving: 'Сохранение...',
    accountInfo: 'Информация об аккаунте',
    accountId: 'ID аккаунта',
    created: 'Создан',
    emailVerified: 'Email подтверждён',
    yes: 'Да',
    no: 'Нет',
    validationError: 'Пожалуйста, заполните все обязательные поля правильно.',
    errorTitle: 'Ошибка',
    profileUpdated: 'Профиль обновлён',
    profileUpdatedDesc: 'Ваши данные успешно сохранены.',
    profileError: 'Не удалось обновить профиль. Попробуйте снова.',
    avatarUpdated: 'Аватар обновлён',
    avatarUpdatedDesc: 'Ваша фотография профиля обновлена.',
    invalidFileType: 'Неверный тип файла',
    invalidFileTypeDesc: 'Загрузите только JPG, PNG или WEBP изображения.',
    fileTooLarge: 'Файл слишком большой',
    fileTooLargeDesc: 'Максимальный размер файла — 5 МБ.',
    uploadFailed: 'Ошибка загрузки',
    parentName: 'Имя родителя',
    parentNamePlaceholder: 'Введите имя родителя',
    parentPhone: 'Телефон родителя',
    parentPhonePlaceholder: '+998 90 123 45 67',
    parentSection: 'Данные родителя',
    parentSectionDesc: 'Родитель будет уведомлён при зачислении',
    logout: 'Выйти из системы',
  },
  en: {
    title: 'Profile',
    subtitle: 'Manage your personal information',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    email: 'Email',
    emailPlaceholder: 'Enter your email',
    phone: 'Phone Number',
    phonePlaceholder: '+998 90 123 45 67',
    phoneError: 'Enter a valid phone number (+998 XX XXX XX XX)',
    telegram: 'Telegram Username',
    telegramPlaceholder: '@username',
    telegramError: 'Enter a valid Telegram username (@username)',
    country: 'Target Country',
    countryPlaceholder: 'e.g., South Korea, Germany',
    save: 'Save Changes',
    saving: 'Saving...',
    accountInfo: 'Account Information',
    accountId: 'Account ID',
    created: 'Created',
    emailVerified: 'Email Verified',
    yes: 'Yes',
    no: 'No',
    validationError: 'Please fill all required fields correctly.',
    errorTitle: 'Error',
    profileUpdated: 'Profile Updated',
    profileUpdatedDesc: 'Your information has been saved successfully.',
    profileError: 'Failed to update profile. Please try again.',
    avatarUpdated: 'Avatar Updated',
    avatarUpdatedDesc: 'Your profile picture has been updated.',
    invalidFileType: 'Invalid file type',
    invalidFileTypeDesc: 'Please upload JPG, PNG, or WEBP images only.',
    fileTooLarge: 'File too large',
    fileTooLargeDesc: 'Maximum file size is 5MB.',
    uploadFailed: 'Upload failed',
    parentName: 'Parent Name',
    parentNamePlaceholder: 'Enter parent\'s name',
    parentPhone: 'Parent Phone',
    parentPhonePlaceholder: '+998 90 123 45 67',
    parentSection: 'Parent Information',
    parentSectionDesc: 'Your parent will be notified when you are accepted',
    logout: 'Log Out',
  },
};

export default function StudentProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { language } = useApp();
  const t = useTranslation(language);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const l = labels[language] || labels.en;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    email: '',
    phone: '',
    telegram_username: '',
    selected_country: '',
    preferred_language: 'en',
    avatar_url: null,
    parent_name: '',
    parent_phone: '',
  });
  const [errors, setErrors] = useState<{ phone?: string; telegram?: string }>({});

  useEffect(() => {
    let active = true;
    async function fetchProfile() {
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone, telegram_username, selected_country, preferred_language, avatar_url, parent_name, parent_phone')
          .eq('user_id', user.id)
          .maybeSingle();

        if (active) {
          if (!error && data) {
            setProfile({
              full_name: data.full_name || user.user_metadata?.full_name || '',
              email: data.email || user.email || '',
              phone: data.phone || '',
              telegram_username: data.telegram_username || '',
              selected_country: data.selected_country || '',
              preferred_language: data.preferred_language || 'en',
              avatar_url: data.avatar_url || null,
              parent_name: (data as any).parent_name || '',
              parent_phone: (data as any).parent_phone || '',
            });
          } else {
            setProfile(prev => ({
              ...prev,
              full_name: user.user_metadata?.full_name || '',
              email: user.email || '',
            }));
          }
          setLoading(false);
        }
      } catch (err) {
        if (active) setLoading(false);
      }
    }
    fetchProfile();
    return () => { active = false; };
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: l.invalidFileType, description: l.invalidFileTypeDesc, variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: l.fileTooLarge, description: l.fileTooLargeDesc, variant: 'destructive' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: l.avatarUpdated, description: l.avatarUpdatedDesc });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({ title: l.uploadFailed, description: error.message || l.uploadFailed, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const newErrors: { phone?: string; telegram?: string } = {};
    if (!profile.phone || !isValidPhone(profile.phone)) newErrors.phone = l.phoneError;
    if (!profile.telegram_username || !isValidTelegram(profile.telegram_username)) newErrors.telegram = l.telegramError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({ title: l.errorTitle, description: l.validationError, variant: 'destructive' });
      return;
    }
    
    setErrors({});
    setSaving(true);

    const normalizedTelegram = profile.telegram_username?.startsWith('@') 
      ? profile.telegram_username 
      : `@${profile.telegram_username}`;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        telegram_username: normalizedTelegram,
        selected_country: profile.selected_country,
        preferred_language: profile.preferred_language,
        avatar_url: profile.avatar_url,
        parent_name: profile.parent_name || null,
        parent_phone: profile.parent_phone || null,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'user_id' });

    setSaving(false);

    if (error) {
      toast({ title: l.errorTitle, description: l.profileError, variant: 'destructive' });
    } else {
      toast({ title: l.profileUpdated, description: l.profileUpdatedDesc });
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('active_tenant');
    await signOut();
    navigate('/auth');
  };

  const userInitials = (profile.full_name || 'U').slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{l.title}</h1>
        <p className="text-muted-foreground">{l.subtitle}</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                {userInitials}
              </div>
            )}
            <button 
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center border-2 border-background hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <Camera className="w-4 h-4 text-muted-foreground" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">{profile.full_name || 'Your Name'}</h2>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2"><User className="w-4 h-4" />{l.fullName}</Label>
            <Input id="fullName" value={profile.full_name || ''} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder={l.fullNamePlaceholder} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" />{l.email}</Label>
            <Input id="email" type="email" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder={l.emailPlaceholder} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4" />{l.phone} <span className="text-destructive">*</span></Label>
            <Input id="phone" type="tel" value={profile.phone || ''} onChange={(e) => { setProfile({ ...profile, phone: e.target.value }); if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined })); }} placeholder={l.phonePlaceholder} className={errors.phone ? 'border-destructive' : ''} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram" className="flex items-center gap-2"><Send className="w-4 h-4" />{l.telegram} <span className="text-destructive">*</span></Label>
            <Input id="telegram" type="text" value={profile.telegram_username || ''} onChange={(e) => { setProfile({ ...profile, telegram_username: e.target.value }); if (errors.telegram) setErrors(prev => ({ ...prev, telegram: undefined })); }} placeholder={l.telegramPlaceholder} className={errors.telegram ? 'border-destructive' : ''} />
            {errors.telegram && <p className="text-sm text-destructive">{errors.telegram}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country" className="flex items-center gap-2"><Globe className="w-4 h-4" />{l.country}</Label>
            <Input id="country" value={profile.selected_country || ''} onChange={(e) => setProfile({ ...profile, selected_country: e.target.value })} placeholder={l.countryPlaceholder} />
          </div>

          {/* Parent Information Section */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground mb-1">{l.parentSection}</h3>
            <p className="text-sm text-muted-foreground mb-4">{l.parentSectionDesc}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parentName" className="flex items-center gap-2"><User className="w-4 h-4" />{l.parentName}</Label>
                <Input id="parentName" value={profile.parent_name || ''} onChange={(e) => setProfile({ ...profile, parent_name: e.target.value })} placeholder={l.parentNamePlaceholder} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone" className="flex items-center gap-2"><Phone className="w-4 h-4" />{l.parentPhone}</Label>
                <Input id="parentPhone" type="tel" value={profile.parent_phone || ''} onChange={(e) => setProfile({ ...profile, parent_phone: e.target.value })} placeholder={l.parentPhonePlaceholder} />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            <Save className="w-4 h-4" />
            {saving ? l.saving : l.save}
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4">{l.accountInfo}</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{l.accountId}</span>
            <span className="font-mono text-foreground">{user?.id?.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{l.created}</span>
            <span className="text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{l.emailVerified}</span>
            <span className="text-foreground">{user?.email_confirmed_at ? l.yes : l.no}</span>
          </div>
        </div>
      </div>

      <div className="bg-destructive/5 rounded-2xl border border-destructive/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-destructive mb-1">{l.logout}</h3>
          <p className="text-sm text-muted-foreground">
            {language === 'uz' ? 'Tizimdan chiqib, boshqa hisobga kirishingiz mumkin.' : 
             language === 'ru' ? 'Вы можете выйти из системы и войти под другой учетной записью.' : 
             'Sign out of your account to switch users.'}
          </p>
        </div>
        <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto gap-2">
          <LogOut className="w-4 h-4" />
          {l.logout}
        </Button>
      </div>
    </div>
  );
}
