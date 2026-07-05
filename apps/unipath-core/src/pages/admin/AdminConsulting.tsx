import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  Users, FileText, TrendingUp, Clock, ArrowRight, BarChart3,
  Target, Zap, FolderOpen, GraduationCap, Wallet, LayoutList,
  Plus, ChevronRight, Activity,
} from 'lucide-react';
import { IconBadge } from '@/components/ui/icon-badge';

interface Stats {
  totalStudents: number;
  totalApplications: number;
  pendingReview: number;
  acceptedApplications: number;
  draftApplications: number;
  submittedApplications: number;
  rejectedApplications: number;
}

interface RecentApplication {
  id: string;
  status: string | null;
  created_at: string;
  profile: { full_name: string | null; email: string | null } | null;
  university: { name: string } | null;
}

const LABELS = {
  en: {
    greeting: 'Welcome back',
    subtitle: 'Real-time overview of your consulting workspace',
    clients: 'Total Clients', apps: 'Applications', pending: 'Pending Review', accepted: 'Accepted',
    pipeline: 'Client Pipeline', pipelineDesc: 'Client journey from first contact to completion',
    registered: 'Clients', drafted: 'Drafts', submitted: 'Submitted', inReview: 'In Review',
    convRate: 'Conv. Rate', urgentTitle: 'Needs Attention', urgentDesc: 'items awaiting review',
    quickActions: 'Quick Actions', viewStudents: 'All Clients', reviewDocs: 'Documents',
    recentApps: 'Recent Activity', viewAll: 'View All', unknownStudent: 'Unknown Client',
    unknownUni: 'Unknown', noApps: 'No activity yet', pendingDocs: 'Documents',
    totalDocs: 'Total', approvedDocs: 'Approved', rejectedDocs: 'Rejected', loading: 'Loading...',
    thisWeek: 'this week', viewCRM: 'CRM Pipeline', viewAccounting: 'Accounting',
    newClients: 'New Clients', appFlow: 'Application Flow', last6: 'Last 6 months',
    status: { draft: 'Draft', submitted: 'Submitted', in_review: 'In Review', accepted: 'Done', rejected: 'Rejected' },
  },
  uz: {
    greeting: 'Xush kelibsiz',
    subtitle: "Konsalting ishchangizning real vaqtdagi ko'rinishi",
    clients: 'Jami mijozlar', apps: 'Arizalar', pending: "Ko'rib chiqilmoqda", accepted: 'Bajarildi',
    pipeline: 'Mijozlar Pipeline', pipelineDesc: "Birinchi aloqadan yakunigacha yo'l",
    registered: "Mijozlar", drafted: 'Qoralamalar', submitted: 'Yuborilgan', inReview: "Ko'rib chiqilmoqda",
    convRate: 'Konversiya', urgentTitle: 'Diqqat talab etadi', urgentDesc: 'element kutmoqda',
    quickActions: 'Tezkor harakatlar', viewStudents: 'Barcha mijozlar', reviewDocs: 'Hujjatlar',
    recentApps: "So'nggi faoliyat", viewAll: 'Barchasini ko\'rish', unknownStudent: "Noma'lum mijoz",
    unknownUni: "Noma'lum", noApps: "Hali faoliyat yo'q", pendingDocs: 'Hujjatlar',
    totalDocs: 'Jami', approvedDocs: 'Tasdiqlangan', rejectedDocs: 'Rad etilgan', loading: 'Yuklanmoqda...',
    thisWeek: 'bu hafta', viewCRM: 'CRM Pipeline', viewAccounting: 'Buxgalteriya',
    newClients: 'Yangi mijozlar', appFlow: 'Arizalar oqimi', last6: 'Oxirgi 6 oy',
    status: { draft: 'Qoralama', submitted: 'Yuborilgan', in_review: "Ko'rib chiqilmoqda", accepted: 'Bajarildi', rejected: 'Rad etildi' },
  },
  ru: {
    greeting: 'Добро пожаловать',
    subtitle: 'Обзор вашего консалтингового пространства в реальном времени',
    clients: 'Всего клиентов', apps: 'Заявки', pending: 'На рассмотрении', accepted: 'Выполнено',
    pipeline: 'Воронка клиентов', pipelineDesc: 'Путь от первого контакта до завершения',
    registered: 'Клиенты', drafted: 'Черновики', submitted: 'Отправлено', inReview: 'На рассмотрении',
    convRate: 'Конверсия', urgentTitle: 'Требует внимания', urgentDesc: 'элементов ожидают',
    quickActions: 'Быстрые действия', viewStudents: 'Все клиенты', reviewDocs: 'Документы',
    recentApps: 'Последняя активность', viewAll: 'Посмотреть все', unknownStudent: 'Неизвестный',
    unknownUni: 'Неизвестно', noApps: 'Активности пока нет', pendingDocs: 'Документы',
    totalDocs: 'Всего', approvedDocs: 'Одобрено', rejectedDocs: 'Отклонено', loading: 'Загрузка...',
    thisWeek: 'на этой неделе', viewCRM: 'CRM Pipeline', viewAccounting: 'Бухгалтерия',
    newClients: 'Новые клиенты', appFlow: 'Поток заявок', last6: 'Последние 6 месяцев',
    status: { draft: 'Черновик', submitted: 'Отправлено', in_review: 'На рассмотрении', accepted: 'Выполнено', rejected: 'Отклонено' },
  },
};

function StatCard({ icon: Icon, label, value, sub, color, bg, delay }: {
  icon: any; label: string; value: number; sub: string; color: string; bg: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-card rounded-2xl border border-border p-5 overflow-hidden group hover:shadow-lg transition-shadow"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at top right, hsl(var(--primary)/0.04), transparent 70%)` }} />
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-3xl font-extrabold text-foreground tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      <p className={`text-[11px] mt-1 font-semibold ${color}`}>{sub}</p>
    </motion.div>
  );
}

function PipeBar({ value, max, color, label, count }: { value: number; max: number; color: string; label: string; count: number }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 3) : 3;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-right shrink-0">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex-1 h-7 bg-muted/60 rounded-xl overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className={`h-full rounded-xl ${color} flex items-center justify-end pr-2.5`}
        >
          {pct > 18 && <span className="text-[11px] font-bold text-white">{count}</span>}
        </motion.div>
        {pct <= 18 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-foreground">{count}</span>}
      </div>
    </div>
  );
}

export default function AdminConsulting() {
  const { language, activeTenant } = useApp();
  const t = useTranslation(language);
  const l = LABELS[language as keyof typeof LABELS] || LABELS.en;

  const [stats, setStats] = useState<Stats>({ totalStudents: 0, totalApplications: 0, pendingReview: 0, acceptedApplications: 0, draftApplications: 0, submittedApplications: 0, rejectedApplications: 0 });
  const [documentStats, setDocumentStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; clients: number; apps: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newThisWeek, setNewThisWeek] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!activeTenant?.id) {
        setLoading(false);
        return;
      }
      const tid = activeTenant.id;
      try {
        // Query profiles filtered by tenant_id (if profiles has tenant_id)
        const { count: profilesCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tid);

        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: weekCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tid)
          .gte('created_at', weekAgo);

        setNewThisWeek(weekCount || 0);

        const { data: applications } = await supabase
          .from('applications')
          .select('id, status')
          .eq('tenant_id', tid);

        const apps = applications || [];
        setStats({
          totalStudents: profilesCount || 0,
          totalApplications: apps.length,
          pendingReview: apps.filter(a => a.status === 'submitted' || a.status === 'in_review').length,
          acceptedApplications: apps.filter(a => a.status === 'accepted').length,
          draftApplications: apps.filter(a => a.status === 'draft').length,
          submittedApplications: apps.filter(a => a.status === 'submitted').length,
          rejectedApplications: apps.filter(a => a.status === 'rejected').length,
        });

        const { data: documents } = await supabase
          .from('documents')
          .select('status')
          .eq('tenant_id', tid);

        if (documents) {
          setDocumentStats({
            total: documents.length,
            pending: documents.filter(d => d.status === 'pending').length,
            approved: documents.filter(d => d.status === 'approved').length,
            rejected: documents.filter(d => d.status === 'rejected').length
          });
        }

        const { data: recent } = await supabase
          .from('applications')
          .select('id, status, created_at, user_id, university:universities(name)')
          .eq('tenant_id', tid)
          .order('created_at', { ascending: false })
          .limit(6);

        if (recent?.length) {
          const userIds = recent.map(r => r.user_id).filter(Boolean);
          if (userIds.length) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, full_name, email')
              .in('user_id', userIds);

            setRecentApplications(
              recent.map(app => ({
                ...app,
                profile: profiles?.find(p => p.user_id === app.user_id) || null
              })) as unknown as RecentApplication[]
            );
          }
        }

        // Monthly chart data
        const MONTH_NAMES: Record<string, string[]> = {
          en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          uz: ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'],
          ru: ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'],
        };
        const now = new Date();
        const mnames = MONTH_NAMES[language] || MONTH_NAMES.en;
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
          return { month: mnames[d.getMonth()], year: d.getFullYear(), m: d.getMonth() };
        });

        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('tenant_id', tid);

        const { data: allApps } = await supabase
          .from('applications')
          .select('created_at')
          .eq('tenant_id', tid);

        setMonthlyData(months.map(({ month, year, m }) => ({
          month,
          clients: (allProfiles || []).filter(p => { const d = new Date(p.created_at); return d.getFullYear() === year && d.getMonth() === m; }).length,
          apps: (allApps || []).filter(a => { const d = new Date(a.created_at); return d.getFullYear() === year && d.getMonth() === m; }).length,
        })));
      } catch (err) {
        console.error('Error fetching consulting data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [language, activeTenant?.id]);

  const conversionRate = stats.totalStudents > 0 ? Math.round((stats.acceptedApplications / stats.totalStudents) * 100) : 0;
  const tenantName = activeTenant?.name || 'Konsalting';

  const getStatusInfo = (status: string | null) => {
    const s = l.status as Record<string, string>;
    switch (status) {
      case 'submitted': return { label: s.submitted, color: 'text-primary', bg: 'bg-primary/10' };
      case 'in_review': return { label: s.in_review, color: 'text-amber-600', bg: 'bg-amber-500/10' };
      case 'accepted':  return { label: s.accepted,  color: 'text-emerald-600', bg: 'bg-emerald-500/10' };
      case 'rejected':  return { label: s.rejected,  color: 'text-destructive', bg: 'bg-destructive/10' };
      default:          return { label: s.draft,     color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{l.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <IconBadge icon={<LayoutList />} tone="primary" size="sm" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">CRM & Consulting</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">{tenantName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{l.subtitle}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to="/admin/crm">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs">
              <LayoutList className="w-3.5 h-3.5" /> {l.viewCRM}
            </Button>
          </Link>
          <Link to="/admin/students">
            <Button size="sm" className="gap-1.5 rounded-xl text-xs">
              <Plus className="w-3.5 h-3.5" /> {l.viewStudents}
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Users}      label={l.clients}  value={stats.totalStudents}         sub={`+${newThisWeek} ${l.thisWeek}`}               color="text-primary"       bg="bg-primary/10"       delay={0.05} />
        <StatCard icon={FileText}   label={l.apps}     value={stats.totalApplications}      sub={`${stats.draftApplications} ${l.drafted.toLowerCase()}`} color="text-blue-500" bg="bg-blue-500/10"  delay={0.1} />
        <StatCard icon={Clock}      label={l.pending}  value={stats.pendingReview}           sub={stats.pendingReview > 0 ? '⚡ ' + l.urgentTitle : '✓ All clear'} color={stats.pendingReview > 0 ? 'text-amber-500' : 'text-emerald-500'} bg={stats.pendingReview > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'} delay={0.15} />
        <StatCard icon={TrendingUp} label={l.accepted} value={stats.acceptedApplications}   sub={`${conversionRate}% ${l.convRate}`}            color="text-emerald-500"   bg="bg-emerald-500/10"   delay={0.2} />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-5 gap-4 md:gap-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-3 bg-card rounded-2xl border border-border p-5"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{l.pipeline}</h2>
              <p className="text-[10px] text-muted-foreground">{l.pipelineDesc}</p>
            </div>
          </div>
          <div className="space-y-3">
            <PipeBar value={stats.totalStudents}          max={stats.totalStudents} color="bg-primary"       label={l.registered}  count={stats.totalStudents} />
            <PipeBar value={stats.draftApplications}      max={stats.totalStudents} color="bg-blue-400"      label={l.drafted}     count={stats.draftApplications} />
            <PipeBar value={stats.submittedApplications}  max={stats.totalStudents} color="bg-amber-400"     label={l.submitted}   count={stats.submittedApplications} />
            <PipeBar value={stats.pendingReview}          max={stats.totalStudents} color="bg-orange-400"    label={l.inReview}    count={stats.pendingReview} />
            <PipeBar value={stats.acceptedApplications}   max={stats.totalStudents} color="bg-emerald-500"   label={l.accepted}    count={stats.acceptedApplications} />
          </div>
          {stats.totalStudents > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{conversionRate}%</span>
                {' '}{l.convRate} — <span className="text-foreground font-semibold">{stats.acceptedApplications}</span> / {stats.totalStudents}
              </p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-4"
        >
          {stats.pendingReview > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{l.urgentTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-base">{stats.pendingReview}</span>{' '}{l.urgentDesc}
                  </p>
                  <Link to="/admin/applications">
                    <Button size="sm" className="mt-3 h-7 text-xs px-3 rounded-xl gap-1.5">
                      {l.reviewDocs} <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">{l.pendingDocs}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: l.totalDocs,    value: documentStats.total,    color: 'text-foreground' },
                { label: l.pendingDocs,  value: documentStats.pending,  color: 'text-amber-500' },
                { label: l.approvedDocs, value: documentStats.approved, color: 'text-emerald-500' },
                { label: l.rejectedDocs, value: documentStats.rejected, color: 'text-destructive' },
              ].map(item => (
                <div key={item.label} className="bg-muted/40 rounded-xl p-3">
                  <p className={`text-xl font-extrabold tabular-nums ${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{l.quickActions}</p>
            {[
              { href: '/admin/crm',         icon: LayoutList,    label: l.viewCRM,         color: 'text-primary' },
              { href: '/admin/accounting',   icon: Wallet,        label: l.viewAccounting,  color: 'text-emerald-500' },
              { href: '/admin/students',     icon: Users,         label: l.viewStudents,    color: 'text-blue-500' },
              { href: '/admin/documents',    icon: FolderOpen,    label: l.reviewDocs,      color: 'text-amber-500' },
              { href: '/admin/analytics',    icon: Activity,      label: language === 'ru' ? 'Аналитика' : language === 'uz' ? 'Analitika' : 'Analytics', color: 'text-violet-500' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} to={href} className="block">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-9 text-xs rounded-xl hover:bg-muted">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />{label}
                </Button>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts */}
      {monthlyData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{l.newClients}</h3>
                <p className="text-[10px] text-muted-foreground">{l.last6}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyData} barSize={22}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="clients" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{l.appFlow}</h3>
                <p className="text-[10px] text-muted-foreground">{l.last6}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} />
                <Line type="monotone" dataKey="apps" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">{l.recentApps}</h2>
          </div>
          <Link to="/admin/applications" className="text-xs text-primary hover:underline flex items-center gap-1">
            {l.viewAll} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recentApplications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{l.noApps}</p>
            <Link to="/admin/students">
              <Button size="sm" variant="outline" className="mt-3 gap-1.5 rounded-xl text-xs">
                <Plus className="w-3 h-3" /> {l.viewStudents}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentApplications.map((app) => {
              const si = getStatusInfo(app.status);
              return (
                <div key={app.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-foreground truncate">
                      {app.profile?.full_name || app.profile?.email || l.unknownStudent}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {app.university?.name || l.unknownUni} · {new Date(app.created_at).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${si.color} ${si.bg}`}>
                    {si.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
