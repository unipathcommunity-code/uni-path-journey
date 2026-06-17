import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Plane,
  FolderOpen,
  GraduationCap,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Deadline {
  id: string;
  label: string;
  labelUz: string;
  labelRu: string;
  dueDate: Date;
  type: 'application' | 'document' | 'visa' | 'general';
  link: string;
  urgency: 'overdue' | 'today' | 'soon' | 'upcoming';
}

const LABELS = {
  en: {
    title: 'Upcoming Deadlines',
    noDeadlines: 'No upcoming deadlines — you\'re on track!',
    overdue: 'Overdue',
    today: 'Due Today',
    soon: 'Due Soon',
    daysLeft: (d: number) => `${d}d left`,
    hoursLeft: (h: number) => `${h}h left`,
    viewAll: 'View All',
    submit: 'Submit Application',
    uploadDocs: 'Upload Documents',
    visaApply: 'Apply for Visa',
    completeProfile: 'Complete Profile',
  },
  uz: {
    title: 'Yaqinlashayotgan muddatlar',
    noDeadlines: "Hozircha muddat yo'q — siz rejalashtirilgansiz!",
    overdue: 'Muddati o\'tgan',
    today: 'Bugun',
    soon: 'Yaqinda',
    daysLeft: (d: number) => `${d} kun`,
    hoursLeft: (h: number) => `${h} soat`,
    viewAll: 'Barchasini ko\'rish',
    submit: 'Arizani yuborish',
    uploadDocs: 'Hujjatlarni yuklash',
    visaApply: 'Viza uchun ariza',
    completeProfile: 'Profilni to\'ldirish',
  },
  ru: {
    title: 'Предстоящие дедлайны',
    noDeadlines: 'Дедлайнов нет — вы в графике!',
    overdue: 'Просрочено',
    today: 'Сегодня',
    soon: 'Скоро',
    daysLeft: (d: number) => `${d} дн.`,
    hoursLeft: (h: number) => `${h} ч.`,
    viewAll: 'Смотреть все',
    submit: 'Подать заявку',
    uploadDocs: 'Загрузить документы',
    visaApply: 'Подать на визу',
    completeProfile: 'Заполнить профиль',
  },
};

function getUrgency(dueDate: Date): Deadline['urgency'] {
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'overdue';
  if (diffDays < 1) return 'today';
  if (diffDays <= 5) return 'soon';
  return 'upcoming';
}

function getDaysLeft(dueDate: Date): number {
  const now = new Date();
  return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getHoursLeft(dueDate: Date): number {
  const now = new Date();
  return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
}

const typeIcon = {
  application: GraduationCap,
  document: FolderOpen,
  visa: Plane,
  general: FileText,
};

const urgencyStyles = {
  overdue: {
    badge: 'bg-destructive/15 text-destructive border-0',
    dot: 'bg-destructive',
    ring: 'ring-destructive/20',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.15)]',
  },
  today: {
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0',
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/20',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]',
  },
  soon: {
    badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-0',
    dot: 'bg-orange-400',
    ring: 'ring-orange-400/20',
    glow: '',
  },
  upcoming: {
    badge: 'bg-primary/10 text-primary border-0',
    dot: 'bg-primary',
    ring: 'ring-primary/10',
    glow: '',
  },
};

export function DeadlineTracker({ language }: { language: string }) {
  const { user } = useAuth();
  const l = LABELS[language as keyof typeof LABELS] || LABELS.en;
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function buildDeadlines() {
      const list: Deadline[] = [];

      // 1. Draft applications older than 3 days → prompt to submit
      const { data: draftApps } = await supabase
        .from('applications')
        .select('id, created_at, university:universities(name)')
        .eq('user_id', user!.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: true });

      draftApps?.forEach((app: any) => {
        const created = new Date(app.created_at);
        const dueDate = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days to submit
        list.push({
          id: `app-${app.id}`,
          label: `Submit: ${app.university?.name || 'Application'}`,
          labelUz: `Yuborish: ${app.university?.name || 'Ariza'}`,
          labelRu: `Подать: ${app.university?.name || 'Заявку'}`,
          dueDate,
          type: 'application',
          link: '/student/applications',
          urgency: getUrgency(dueDate),
        });
      });

      // 2. Documents pending review → reminder
      const { data: pendingDocs } = await supabase
        .from('documents')
        .select('id, document_type, created_at')
        .eq('user_id', user!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(3);

      pendingDocs?.forEach((doc: any) => {
        const created = new Date(doc.created_at);
        const dueDate = new Date(created.getTime() + 5 * 24 * 60 * 60 * 1000);
        const typeName = doc.document_type?.replace(/_/g, ' ') || 'Document';
        list.push({
          id: `doc-${doc.id}`,
          label: `Review pending: ${typeName}`,
          labelUz: `Ko'rib chiqilmoqda: ${typeName}`,
          labelRu: `Ожидает проверки: ${typeName}`,
          dueDate,
          type: 'document',
          link: '/student/documents',
          urgency: getUrgency(dueDate),
        });
      });

      // 3. Profile completeness — no phone/telegram → nudge
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, telegram_username, full_name, date_of_birth')
        .eq('user_id', user!.id)
        .maybeSingle();

      const missingFields = [
        !profile?.phone?.trim(),
        !profile?.telegram_username?.trim(),
        !profile?.full_name?.trim(),
        !profile?.date_of_birth,
      ].filter(Boolean).length;

      if (missingFields >= 2) {
        const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        list.push({
          id: 'profile-complete',
          label: `Complete your profile (${missingFields} fields missing)`,
          labelUz: `Profilni to'ldiring (${missingFields} maydon)`,
          labelRu: `Заполните профиль (${missingFields} поля)`,
          dueDate,
          type: 'general',
          link: '/student/profile',
          urgency: getUrgency(dueDate),
        });
      }

      // 4. Accepted applications → visa urgency (30-day window suggestion)
      const { data: acceptedApps } = await supabase
        .from('applications')
        .select('id, updated_at, university:universities(name, country)')
        .eq('user_id', user!.id)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false })
        .limit(2);

      acceptedApps?.forEach((app: any) => {
        const accepted = new Date(app.updated_at);
        const visaDue = new Date(accepted.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (visaDue > new Date()) {
          list.push({
            id: `visa-${app.id}`,
            label: `Apply for visa: ${app.university?.country || 'country'}`,
            labelUz: `Viza uchun ariza: ${app.university?.country || 'mamlakat'}`,
            labelRu: `Подать на визу: ${app.university?.country || 'страна'}`,
            dueDate: visaDue,
            type: 'visa',
            link: '/student/visa',
            urgency: getUrgency(visaDue),
          });
        }
      });

      // Sort: overdue first, then by date
      const order = { overdue: 0, today: 1, soon: 2, upcoming: 3 };
      list.sort((a, b) =>
        order[a.urgency] !== order[b.urgency]
          ? order[a.urgency] - order[b.urgency]
          : a.dueDate.getTime() - b.dueDate.getTime()
      );

      setDeadlines(list);
      setLoading(false);
    }

    buildDeadlines();
  }, [user]);

  if (loading || deadlines.length === 0) {
    if (!loading && deadlines.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl px-4 py-3 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-xs md:text-sm text-emerald-700 dark:text-emerald-400 font-medium">{l.noDeadlines}</p>
        </motion.div>
      );
    }
    return null;
  }

  const visible = expanded ? deadlines : deadlines.slice(0, 3);
  const criticalCount = deadlines.filter(d => d.urgency === 'overdue' || d.urgency === 'today').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {criticalCount}
              </span>
            )}
          </div>
          <h3 className="text-xs md:text-sm font-semibold text-foreground">{l.title}</h3>
        </div>
        {deadlines.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] md:text-xs text-primary hover:underline flex items-center gap-1"
          >
            {expanded
              ? (language === 'uz' ? 'Kamroq' : language === 'ru' ? 'Меньше' : 'Less')
              : l.viewAll}
            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {/* Deadline list */}
      <div className="divide-y divide-border/60">
        <AnimatePresence initial={false}>
          {visible.map((d, i) => {
            const Icon = typeIcon[d.type];
            const styles = urgencyStyles[d.urgency];
            const daysLeft = getDaysLeft(d.dueDate);
            const hoursLeft = getHoursLeft(d.dueDate);
            const timeLabel =
              d.urgency === 'overdue'
                ? l.overdue
                : d.urgency === 'today'
                ? hoursLeft > 0 ? l.hoursLeft(hoursLeft) : l.today
                : daysLeft <= 5
                ? l.daysLeft(daysLeft)
                : l.daysLeft(daysLeft);

            const displayLabel =
              language === 'uz' ? d.labelUz :
              language === 'ru' ? d.labelRu :
              d.label;

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={d.link}
                  className={`flex items-center gap-3 px-4 md:px-5 py-3 hover:bg-muted/40 transition-colors active:bg-muted/60 ${styles.glow}`}
                >
                  {/* Dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot} ${d.urgency === 'overdue' || d.urgency === 'today' ? 'animate-pulse' : ''}`} />

                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 ring-1 ${styles.ring}`}>
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-foreground truncate leading-tight">{displayLabel}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {d.dueDate.toLocaleDateString(
                        language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US',
                        { month: 'short', day: 'numeric' }
                      )}
                    </p>
                  </div>

                  {/* Urgency badge */}
                  <Badge className={`text-[9px] md:text-[10px] px-2 py-0.5 flex-shrink-0 font-semibold ${styles.badge}`}>
                    {d.urgency === 'overdue' ? l.overdue : d.urgency === 'today' ? l.today : timeLabel}
                  </Badge>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
