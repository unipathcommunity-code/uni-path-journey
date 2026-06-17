import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import NovaStudentDashboard from '../StudentDashboard';
import TravelPlannerPage from '../TravelPlannerPage';
import { useCredits } from '@/contexts/CreditContext';
import { useTranslation } from '@/lib/i18n';
import { useStudentJourney } from '@/hooks/useStudentJourney';
import { useBusinessMode } from '@/hooks/useBusinessMode';
import { CreditBalanceWidget } from '@/components/CreditBalanceWidget';
import { ProfileCompletionBar } from '@/components/ProfileCompletionBar';
import { IncompleteProfileBanner } from '@/components/IncompleteProfileBanner';
import { DailyStreakWidget } from '@/components/DailyStreakWidget';
import { AcceptanceCard } from '@/components/AcceptanceCard';
import { RejectionSupportCard } from '@/components/RejectionSupportCard';
import { DeadlineTracker } from '@/components/DeadlineTracker';
import { AIReadinessScore } from '@/components/AIReadinessScore';
import { UniversityComparison } from '@/components/UniversityComparison';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  FolderOpen,
  Megaphone,
  Info,
  GraduationCap,
  ArrowRight,
  Gift,
  Users,
  Copy,
  MessageCircle,
  Share2,
  ExternalLink,
  Coins,
  UserPlus,
  FolderUp,
  Award,
  Plane,
  Home,
  GitCompare,
} from 'lucide-react';
import { toast } from 'sonner';

interface ApplicationData {
  id: string;
  status: string | null;
  program: string | null;
  created_at: string;
  acceptance_letter_url: string | null;
  university: { name: string; country: string; city?: string | null } | null;
}

interface AnnouncementData {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const labels = {
  en: {
    welcomeBack: (name: string) => `Welcome back, ${name}!`,
    subtitle: 'Here\'s your study abroad progress at a glance.',
    totalApps: 'Applications',
    inProgress: 'In Progress',
    submitted: 'Submitted',
    noAppsYet: 'No applications yet. Start by searching for universities!',
    loading: 'Loading...',
    quickActions: 'Quick Actions',
    completeProfile: 'Complete Profile',
    uploadDocs: 'Upload Documents',
    browseUnis: 'Find Universities',
    news: 'Announcements',
    draft: 'Draft',
    inReview: 'In Review',
    accepted: 'Accepted',
    rejected: 'Rejected',
    programTbd: 'Program TBD',
    recentApps: 'Recent Applications',
    journey: 'Your Journey',
    inviteTitle: 'Invite Friends',
    inviteDesc: 'Share & earn 3 UniCoin each',
    copied: 'Copied!',
  },
  uz: {
    welcomeBack: (name: string) => `Xush kelibsiz, ${name}!`,
    subtitle: "Xorijda o'qish jarayoningiz bir qarashda.",
    totalApps: 'Arizalar',
    inProgress: 'Jarayonda',
    submitted: 'Yuborilgan',
    noAppsYet: "Hali ariza yo'q. Universitetlarni qidirishdan boshlang!",
    loading: 'Yuklanmoqda...',
    quickActions: 'Tezkor harakatlar',
    completeProfile: "Profilni to'ldirish",
    uploadDocs: 'Hujjatlarni yuklash',
    browseUnis: 'Universitetlarni topish',
    news: "E'lonlar",
    draft: 'Qoralama',
    inReview: "Ko'rib chiqilmoqda",
    accepted: 'Qabul qilindi',
    rejected: 'Rad etildi',
    programTbd: 'Dastur belgilanmagan',
    recentApps: 'Oxirgi arizalar',
    journey: 'Sizning sayohatingiz',
    inviteTitle: "Do'stlarni taklif qiling",
    inviteDesc: "Ulashing va har biringiz 3 UniCoin oling",
    copied: 'Nusxalandi!',
  },
  ru: {
    welcomeBack: (name: string) => `Добро пожаловать, ${name}!`,
    subtitle: 'Ваш прогресс по учёбе за рубежом.',
    totalApps: 'Заявки',
    inProgress: 'В процессе',
    submitted: 'Отправлено',
    noAppsYet: 'Пока нет заявок. Начните с поиска университетов!',
    loading: 'Загрузка...',
    quickActions: 'Быстрые действия',
    completeProfile: 'Заполнить профиль',
    uploadDocs: 'Загрузить документы',
    browseUnis: 'Найти университеты',
    news: 'Объявления',
    draft: 'Черновик',
    inReview: 'На рассмотрении',
    accepted: 'Принято',
    rejected: 'Отклонено',
    programTbd: 'Программа не выбрана',
    recentApps: 'Последние заявки',
    journey: 'Ваш путь',
    inviteTitle: 'Пригласите друзей',
    inviteDesc: 'Поделитесь и получите по 3 UniCoin',
    copied: 'Скопировано!',
  },
};

const STEPS = [
  { key: 'onboarding', icon: UserPlus },
  { key: 'documents', icon: FolderUp },
  { key: 'credits', icon: Coins },
  { key: 'apply', icon: GraduationCap },
  { key: 'admission', icon: Award },
  { key: 'visa', icon: Plane },
  { key: 'housing', icon: Home },
];

const STEP_LABELS: Record<string, Record<string, Record<string, string>>> = {
  unicoin: {
    en: { onboarding: 'Register', documents: 'Documents', credits: 'UniCoin', apply: 'Apply', admission: 'Admission', visa: 'Visa', housing: 'Housing' },
    uz: { onboarding: "Ro'yxatdan", documents: 'Hujjatlar', credits: 'UniCoin', apply: 'Ariza', admission: 'Qabul', visa: 'Viza', housing: 'Turar joy' },
    ru: { onboarding: 'Регистрация', documents: 'Документы', credits: 'UniCoin', apply: 'Заявка', admission: 'Зачисление', visa: 'Виза', housing: 'Жильё' },
  },
  paid: {
    en: { onboarding: 'Register', documents: 'Documents', credits: 'Plan', apply: 'Apply', admission: 'Admission', visa: 'Visa', housing: 'Housing' },
    uz: { onboarding: "Ro'yxatdan", documents: 'Hujjatlar', credits: 'Tarif', apply: 'Ariza', admission: 'Qabul', visa: 'Viza', housing: 'Turar joy' },
    ru: { onboarding: 'Регистрация', documents: 'Документы', credits: 'Тариф', apply: 'Заявка', admission: 'Зачисление', visa: 'Виза', housing: 'Жильё' },
  },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { language, activeTenant } = useApp();

  const impersonatedTenantRaw = localStorage.getItem('active_tenant');
  const impersonatedTenant = impersonatedTenantRaw ? JSON.parse(impersonatedTenantRaw) : null;
  const effectiveTenant = impersonatedTenant || activeTenant;
  const activeModules = (effectiveTenant?.config?.modules ?? {}) as Record<string, boolean>;

  const detectVertical = (modules: Record<string, boolean> = {}): string => {
    const VERTICALS = [
      'consulting', 'academy', 'hotel', 'pharmacy', 'restaurant', 'clinic',
      'gym', 'manufacturing', 'parking', 'auto_service', 'wholesale',
      'wedding_hall', 'kindergarten', 'library', 'cosmetics', 'stadium', 'tour',
    ];
    return VERTICALS.find(v => !!modules[v]) ?? 'consulting';
  };

  let vertical = effectiveTenant?.business_type || effectiveTenant?.config?.business_type || effectiveTenant?.vertical || detectVertical(activeModules) || 'consulting';
  if (vertical === 'nova' || vertical === 'edu') vertical = 'academy';
  if (vertical === 'unitour' || vertical === 'tour_farm' || vertical === 'travel') vertical = 'tour';

  // If strictly an academy or tour tenant, force redirect to the hosted app path
  if (vertical === 'academy') {
    window.location.href = '/nova/';
    return null;
  }
  if (vertical === 'tour') {
    window.location.href = '/unitour/';
    return null;
  }

  const { balance } = useCredits();
  const { isUniCoin } = useBusinessMode();
  const t = useTranslation(language);
  const journey = useStudentJourney(language);
  const l = labels[language as keyof typeof labels] || labels.en;
  const stepLabels = (STEP_LABELS[isUniCoin ? 'unicoin' : 'paid'] || STEP_LABELS.unicoin)[language] || STEP_LABELS.unicoin.en;
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [missingContactInfo, setMissingContactInfo] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [profileName, setProfileName] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const roadmapStep = journey.stageIndex >= 3 ? 5 : journey.stageIndex >= 2 ? 4 : journey.stageIndex >= 1 ? 3 : balance > 0 ? 2 : 1;

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('applications')
      .select('id, status, program, created_at, acceptance_letter_url, university:universities(name, country, city)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setApplications(data as unknown as ApplicationData[]);

    const { data: ann } = await supabase
      .from('announcements')
      .select('id, title, message, type, created_at')
      .eq('is_active', true)
      .or('target_role.eq.all,target_role.eq.student')
      .order('created_at', { ascending: false })
      .limit(3);
    if (ann) setAnnouncements(ann);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchApplications();
    if (user) {
      (async () => {
        const { count } = await supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
        setHasDocuments((count || 0) > 0);
        const { data: profile } = await supabase.from('profiles').select('phone, telegram_username, full_name').eq('user_id', user.id).maybeSingle();
        setMissingContactInfo(!profile?.phone?.trim() || !profile?.telegram_username?.trim());
        if (profile?.full_name?.trim()) setProfileName(profile.full_name.trim());

        const { data: refs } = await supabase.from('referrals').select('referral_code').eq('referrer_id', user.id).limit(1);
        if (refs && refs.length > 0) {
          setReferralCode(refs[0].referral_code);
        } else {
          const code = `UNI${user.id.slice(0, 6).toUpperCase()}`;
          await supabase.from('referrals').insert({ referrer_id: user.id, referral_code: code });
          setReferralCode(code);
        }
      })();
    }
    if (!user) return;
    const channel = supabase
      .channel('dashboard-apps-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${user.id}` }, () => fetchApplications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchApplications]);

  const userName = profileName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

  const getStatusInfo = (status: string | null) => {
    switch (status) {
      case 'submitted': return { label: l.submitted, color: 'text-primary', bg: 'bg-primary/10' };
      case 'in_review': return { label: l.inReview, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/15' };
      case 'accepted': return { label: l.accepted, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/15' };
      case 'rejected': return { label: l.rejected, color: 'text-destructive', bg: 'bg-destructive/10' };
      default: return { label: l.draft, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(l.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    { label: l.totalApps, count: applications.length, icon: FileText, color: 'bg-primary/10', iconColor: 'text-primary' },
    { label: l.inProgress, count: applications.filter(a => a.status === 'draft' || a.status === 'in_review').length, icon: Clock, color: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: l.submitted, count: applications.filter(a => a.status === 'submitted' || a.status === 'accepted').length, icon: CheckCircle2, color: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto pb-6">
      {/* University Comparison Modal */}
      <UniversityComparison open={compareOpen} onClose={() => setCompareOpen(false)} language={language} />

      {/* Profile banners */}
      <IncompleteProfileBanner hasDocuments={hasDocuments} missingContactInfo={missingContactInfo} />
      <ProfileCompletionBar />

      {/* Acceptance / Rejection Cards */}
      {applications.filter(a => a.status === 'accepted').map(app => (
        <AcceptanceCard key={`accept-${app.id}`} application={app} language={language} />
      ))}
      {applications.filter(a => a.status === 'rejected').map(app => (
        app.university?.country && <RejectionSupportCard key={`reject-${app.id}`} rejectedUniversityCountry={app.university.country} language={language} />
      ))}

      {/* Welcome + Search CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">{l.welcomeBack(userName)} 👋</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{l.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCompareOpen(true)}
              className="gap-1.5 rounded-xl text-xs h-9 px-3 hidden sm:flex"
            >
              <GitCompare className="w-3.5 h-3.5" />
              {language === 'uz' ? 'Solishtir' : language === 'ru' ? 'Сравнить' : 'Compare'}
            </Button>
            <Link to="/search" className="flex-shrink-0">
              <Button size="sm" className="gap-1.5 shadow-sm rounded-xl text-xs h-9 px-3 md:px-4">
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.searchUniversities}</span>
                <span className="sm:hidden">{language === 'uz' ? 'Qidirish' : language === 'ru' ? 'Поиск' : 'Search'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ===== TOP ROW: UniCoin + Stats — 2×2 grid on mobile ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {isUniCoin && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="col-span-2 sm:col-span-1"
          >
            <CreditBalanceWidget />
          </motion.div>
        )}

        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
            className={`${stat.color} rounded-2xl p-4 md:p-5 border border-border/50`}
          >
            <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.iconColor} mb-2 md:mb-3`} />
            <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.count}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ===== DAILY STREAK ===== */}
      {isUniCoin && <DailyStreakWidget language={language} />}

      {/* ===== JOURNEY PROGRESS — scrollable on mobile ===== */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl border border-border p-4 md:p-5"
      >
        <h3 className="text-xs md:text-sm font-semibold text-foreground mb-3 md:mb-4">{l.journey}</h3>
        <div className="relative overflow-x-auto -mx-1 px-1 pb-1">
          <div className="relative min-w-[420px] md:min-w-0">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-700"
              style={{ width: `${Math.min((roadmapStep / (STEPS.length - 1)) * 100, 100)}%`, maxWidth: 'calc(100% - 2rem)' }}
            />
            <div className="relative flex justify-between">
              {STEPS.map((step, i) => {
                const isCompleted = i < roadmapStep;
                const isActive = i === roadmapStep;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${
                      isCompleted ? 'bg-primary text-primary-foreground' :
                      isActive ? 'bg-primary/15 text-primary border-2 border-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-medium leading-tight text-center whitespace-nowrap ${
                      isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {stepLabels[step.key]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== DEADLINE TRACKER ===== */}
      <DeadlineTracker language={language} />

      {/* ===== MAIN CONTENT: Applications + Sidebar ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Applications — 2 cols on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-card rounded-2xl border border-border overflow-hidden h-full">
            <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-border">
              <h2 className="text-xs md:text-sm font-semibold text-foreground">{l.recentApps}</h2>
              <Link to="/student/applications" className="text-[10px] md:text-xs text-primary hover:underline flex items-center gap-1">
                {t.viewAll} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="p-8 md:p-10 text-center text-muted-foreground text-sm">{l.loading}</div>
            ) : applications.length === 0 ? (
              <div className="p-8 md:p-10 text-center">
                <div className="w-12 h-12 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-3">
                  <FolderOpen className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">{l.noAppsYet}</p>
                <Link to="/search"><Button size="sm" className="gap-2 rounded-xl"><Search className="w-3.5 h-3.5" />{t.searchUniversities}</Button></Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {applications.slice(0, 4).map(app => {
                  const si = getStatusInfo(app.status);
                  return (
                    <Link key={app.id} to="/student/applications" className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5 hover:bg-muted/40 transition-colors active:bg-muted/60">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-foreground truncate">{app.university?.name || 'University'}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{app.program || l.programTbd}</p>
                      </div>
                      <Badge variant="outline" className={`text-[9px] md:text-[10px] ${si.color} ${si.bg} border-0 px-1.5 md:px-2 flex-shrink-0`}>{si.label}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar — Quick Actions + Invite */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3 md:space-y-4"
        >
          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border p-3.5 md:p-4">
            <h3 className="text-xs md:text-sm font-semibold text-foreground mb-2.5 md:mb-3">{l.quickActions}</h3>
            <div className="space-y-1">
              {[
                { task: l.completeProfile, link: '/student/profile', icon: UserPlus },
                { task: l.uploadDocs, link: '/student/documents', icon: FolderUp },
                { task: l.browseUnis, link: '/search', icon: Search },
              ].map((item, i) => (
                <Link
                  key={i}
                  to={item.link}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 active:bg-muted transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs md:text-sm text-foreground flex-1">{item.task}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          {/* AI Readiness Score */}
          <AIReadinessScore language={language} />

          {isUniCoin && (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-3.5 md:p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-foreground">{l.inviteTitle}</p>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground">{isUniCoin ? l.inviteDesc : (language === 'uz' ? "Do'st taklif qiling, ikkalangiz bonus oling" : language === 'ru' ? 'Пригласите друга, оба получите бонус' : 'Invite a friend, both get a bonus')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input readOnly value={referralLink} className="flex-1 min-w-0 text-[10px] md:text-[11px] bg-background border border-border rounded-xl px-2.5 py-2 text-muted-foreground truncate" />
                <Button size="sm" variant="outline" onClick={copyReferral} className="flex-shrink-0 h-8 w-8 p-0 rounded-xl">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-2">
                <Button variant="ghost" size="sm" className="h-8 text-[9px] md:text-[10px] gap-1 px-1.5 text-muted-foreground hover:text-foreground rounded-xl" onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}`, '_blank')}><MessageCircle className="w-3 h-3 text-blue-500 flex-shrink-0" /><span className="truncate">TG</span></Button>
                <Button variant="ghost" size="sm" className="h-8 text-[9px] md:text-[10px] gap-1 px-1.5 text-muted-foreground hover:text-foreground rounded-xl" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(referralLink)}`, '_blank')}><MessageCircle className="w-3 h-3 text-green-500 flex-shrink-0" /><span className="truncate">WA</span></Button>
                <Button variant="ghost" size="sm" className="h-8 text-[9px] md:text-[10px] gap-1 px-1.5 text-muted-foreground hover:text-foreground rounded-xl" onClick={() => { navigator.clipboard.writeText(referralLink); toast.success(l.copied); window.open('https://instagram.com/direct/new/', '_blank'); }}><ExternalLink className="w-3 h-3 text-pink-500 flex-shrink-0" /><span className="truncate">IG</span></Button>
                <Button variant="ghost" size="sm" className="h-8 text-[9px] md:text-[10px] gap-1 px-1.5 text-muted-foreground hover:text-foreground rounded-xl" onClick={async () => { if (navigator.share) { try { await navigator.share({ title: 'UniPath', text: l.inviteDesc, url: referralLink }); } catch {} } else { copyReferral(); } }}><Share2 className="w-3 h-3 text-primary flex-shrink-0" /><span className="truncate">{language === 'uz' ? 'Boshqa' : language === 'ru' ? 'Другое' : 'Other'}</span></Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ===== ANNOUNCEMENTS ===== */}
      {announcements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-gradient-to-br from-primary/5 via-card to-accent/5 rounded-2xl border border-primary/15 overflow-hidden shadow-sm">
            <div className="px-4 md:px-5 py-3 md:py-4 border-b border-primary/10 flex items-center gap-2.5 bg-primary/5">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xs md:text-sm font-bold text-foreground">{l.news}</h2>
              <Badge variant="outline" className="ml-auto text-[9px] md:text-[10px] border-primary/30 text-primary bg-primary/10">
                {announcements.length}
              </Badge>
            </div>
            <div className="divide-y divide-border/60">
              {announcements.map(a => (
                <div key={a.id} className="px-4 md:px-5 py-3 md:py-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    a.type === 'warning' ? 'bg-amber-100 dark:bg-amber-500/15' :
                    a.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/15' :
                    'bg-primary/10'
                  }`}>
                    {a.type === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> :
                     a.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> :
                     <Info className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs md:text-sm font-semibold text-foreground">{a.title}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 leading-relaxed line-clamp-2">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
