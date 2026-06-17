import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { useBusinessMode } from '@/hooks/useBusinessMode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AcceptanceCelebration } from '@/components/AcceptanceCelebration';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  FolderOpen,
  Calendar,
  Search,
  Send,
  CreditCard,
  Eye,
  Upload,
  Loader2,
  CheckCircle,
  Lock,
  ShieldCheck,
  Plus,
  PartyPopper,
} from 'lucide-react';

interface ApplicationData {
  id: string;
  status: string | null;
  program: string | null;
  intake: string | null;
  created_at: string;
  submitted_at: string | null;
  application_fee: number | null;
  fee_paid: boolean | null;
  acceptance_letter_url: string | null;
  university: {
    name: string;
    country: string;
    city: string | null;
  } | null;
}

const localLabels = {
  uz: {
    manageApps: 'Arizalaringizni kuzating va boshqaring',
    findUni: 'Universitet topish',
    newApplication: 'Yangi ariza',
    noApps: "Hali arizalar yo'q",
    noAppsDesc: "O'zingizga mos universitetlarni qidirib, sayohatingizni boshlang.",
    loadingApps: 'Arizalar yuklanmoqda...',
    process: 'Jarayon',
    uploadDoc: 'Hujjat yuklash',
    submitApp: 'Arizani yuborish',
    payFee: "To'lov qilish",
    details: 'Batafsil',
    paid: "To'langan",
    unpaid: "To'lanmagan",
    noProgram: 'Dastur tanlanmagan',
    university: 'Universitet',
    appDetails: 'Ariza tafsilotlari',
    country: 'Mamlakat',
    program: 'Dastur',
    intakePeriod: 'Qabul davri',
    statusLabel: 'Status',
    sentDate: 'Yuborilgan',
    appFee: "Ariza to'lovi",
    paidLabel: "To'langan",
    nextSteps: 'Keyingi qadamlar',
    uploadAllDocs: 'Barcha majburiy hujjatlarni yuklang',
    clickSubmit: 'Arizani yuborish tugmasini bosing',
    waitingReview: "Arizangiz ko'rib chiqish uchun kutmoqda",
    underReview: "Arizangiz hozirda ko'rib chiqilmoqda",
    payAppFee: "Ariza to'lovini amalga oshiring",
    securePay: "Xavfsiz to'lov",
    payAmount: "To'lov miqdori",
    cardNumber: 'Karta raqami',
    expiry: 'Amal qilish',
    cardHolder: 'Karta egasi',
    total: 'Jami',
    secureSSL: "256-bit SSL himoya bilan xavfsiz to'lov",
    payBtn: "to'lash",
    processingPay: "To'lov amalga oshirilmoqda...",
    demoNote: "Demo rejim: Haqiqiy to'lov amalga oshirilmaydi.",
    demoNote2: "Bu faqat namoyish uchun mo'ljallangan.",
    submitted: 'Yuborildi',
    inReview: "Ko'rib chiqilmoqda",
    accepted: 'Qabul qilindi',
    rejected: 'Rad etildi',
    waitlisted: "Kutish ro'yxatida",
    draft: 'Qoralama',
    docsMissing: 'Hujjatlar yetishmayapti',
    docsDesc: 'Iltimos, avval barcha majburiy hujjatlarni yuklang',
    appSent: 'Ariza yuborildi!',
    appSentDesc: "Arizangiz muvaffaqiyatli yuborildi. Tez orada ko'rib chiqiladi.",
    error: 'Xatolik',
    appSendError: 'Arizani yuborishda xatolik yuz berdi',
    paySuccess: "To'lov muvaffaqiyatli!",
    paySuccessDesc: "Ariza to'lovi qabul qilindi.",
    payError: "To'lovda xatolik yuz berdi",
  },
  ru: {
    manageApps: 'Отслеживайте и управляйте вашими заявками',
    findUni: 'Найти университет',
    newApplication: 'Новая заявка',
    noApps: 'Заявок пока нет',
    noAppsDesc: 'Начните поиск подходящих университетов.',
    loadingApps: 'Загрузка заявок...',
    process: 'Прогресс',
    uploadDoc: 'Загрузить документ',
    submitApp: 'Отправить заявку',
    payFee: 'Оплатить',
    details: 'Подробнее',
    paid: 'Оплачено',
    unpaid: 'Не оплачено',
    noProgram: 'Программа не выбрана',
    university: 'Университет',
    appDetails: 'Детали заявки',
    country: 'Страна',
    program: 'Программа',
    intakePeriod: 'Период набора',
    statusLabel: 'Статус',
    sentDate: 'Отправлено',
    appFee: 'Регистрационный взнос',
    paidLabel: 'Оплачено',
    nextSteps: 'Следующие шаги',
    uploadAllDocs: 'Загрузите все обязательные документы',
    clickSubmit: 'Нажмите кнопку отправки заявки',
    waitingReview: 'Ваша заявка ожидает рассмотрения',
    underReview: 'Ваша заявка сейчас рассматривается',
    payAppFee: 'Оплатите регистрационный взнос',
    securePay: 'Безопасная оплата',
    payAmount: 'Сумма оплаты',
    cardNumber: 'Номер карты',
    expiry: 'Срок действия',
    cardHolder: 'Владелец карты',
    total: 'Итого',
    secureSSL: 'Безопасная оплата с 256-bit SSL шифрованием',
    payBtn: 'оплатить',
    processingPay: 'Обработка оплаты...',
    demoNote: 'Демо режим: Реальная оплата не производится.',
    demoNote2: 'Это только для демонстрации.',
    submitted: 'Отправлено',
    inReview: 'На рассмотрении',
    accepted: 'Принято',
    rejected: 'Отклонено',
    waitlisted: 'В листе ожидания',
    draft: 'Черновик',
    docsMissing: 'Документы отсутствуют',
    docsDesc: 'Пожалуйста, сначала загрузите все обязательные документы',
    appSent: 'Заявка отправлена!',
    appSentDesc: 'Ваша заявка успешно отправлена и будет рассмотрена.',
    error: 'Ошибка',
    appSendError: 'Ошибка при отправке заявки',
    paySuccess: 'Оплата успешна!',
    paySuccessDesc: 'Оплата за заявку принята.',
    payError: 'Ошибка при оплате',
  },
  en: {
    manageApps: 'Track and manage your applications',
    findUni: 'Find University',
    newApplication: 'New Application',
    noApps: 'No applications yet',
    noAppsDesc: 'Search for universities and start your journey.',
    loadingApps: 'Loading applications...',
    process: 'Progress',
    uploadDoc: 'Upload Document',
    submitApp: 'Submit Application',
    payFee: 'Pay Fee',
    details: 'Details',
    paid: 'Paid',
    unpaid: 'Unpaid',
    noProgram: 'No program selected',
    university: 'University',
    appDetails: 'Application Details',
    country: 'Country',
    program: 'Program',
    intakePeriod: 'Intake Period',
    statusLabel: 'Status',
    sentDate: 'Submitted',
    appFee: 'Application Fee',
    paidLabel: 'Paid',
    nextSteps: 'Next Steps',
    uploadAllDocs: 'Upload all required documents',
    clickSubmit: 'Click the submit application button',
    waitingReview: 'Your application is waiting for review',
    underReview: 'Your application is currently under review',
    payAppFee: 'Complete the application fee payment',
    securePay: 'Secure Payment',
    payAmount: 'Payment Amount',
    cardNumber: 'Card Number',
    expiry: 'Expiry',
    cardHolder: 'Card Holder',
    total: 'Total',
    secureSSL: 'Secure payment with 256-bit SSL encryption',
    payBtn: 'pay',
    processingPay: 'Processing payment...',
    demoNote: 'Demo mode: No real payment is made.',
    demoNote2: 'This is for demonstration only.',
    submitted: 'Submitted',
    inReview: 'Under Review',
    accepted: 'Accepted',
    rejected: 'Rejected',
    waitlisted: 'Waitlisted',
    draft: 'Draft',
    docsMissing: 'Documents missing',
    docsDesc: 'Please upload all required documents first',
    appSent: 'Application submitted!',
    appSentDesc: 'Your application has been successfully submitted.',
    error: 'Error',
    appSendError: 'Error submitting application',
    paySuccess: 'Payment successful!',
    paySuccessDesc: 'Application fee has been accepted.',
    payError: 'Payment error',
  },
};

export default function StudentApplications() {
  const { user } = useAuth();
  const { language } = useApp();
  const t = useTranslation(language);
  const { isPaid } = useBusinessMode();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [celebrationApp, setCelebrationApp] = useState<ApplicationData | null>(null);
  const [celebrationLetterUrl, setCelebrationLetterUrl] = useState<string | null>(null);
  const l = localLabels[language] || localLabels.en;

  useEffect(() => {
    fetchApplications();

    if (!user) return;
    
    const channel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function fetchApplications() {
    if (!user) return;

    const { data, error } = await supabase
      .from('applications')
      .select(`
        id, status, program, intake, created_at, submitted_at, application_fee, fee_paid, acceptance_letter_url,
        university:universities(name, country, city)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplications(data as unknown as ApplicationData[]);
    }
    setLoading(false);
  }

  const handleSubmitApplication = async (app: ApplicationData) => {
    const { data: docs } = await supabase
      .from('documents')
      .select('document_type, status')
      .eq('user_id', user?.id);

    const requiredDocs = ['passport', 'diploma', 'transcript', 'cv', 'sop', 'photo', 'bank_statement'];
    const uploadedTypes = docs?.map(d => d.document_type) || [];
    const missingDocs = requiredDocs.filter(d => !uploadedTypes.includes(d));

    if (missingDocs.length > 0) {
      toast({
        title: l.docsMissing,
        description: `${l.docsDesc}: ${missingDocs.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', app.id);

      if (error) throw error;

      toast({ title: l.appSent, description: l.appSentDesc });
      fetchApplications();
    } catch (error: any) {
      toast({ title: l.error, description: error.message || l.appSendError, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayFee = async () => {
    if (!selectedApp) return;
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const { error } = await supabase
        .from('applications')
        .update({ fee_paid: true })
        .eq('id', selectedApp.id);

      if (error) throw error;

      toast({ title: l.paySuccess, description: l.paySuccessDesc });
      setPaymentOpen(false);
      fetchApplications();
    } catch (error: any) {
      toast({ title: l.error, description: error.message || l.payError, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusInfo = (status: string | null) => {
    switch (status) {
      case 'submitted':
        return { label: l.submitted, variant: 'default' as const, icon: CheckCircle2, progress: 50, color: 'bg-primary/10 text-primary' };
      case 'in_review':
        return { label: l.inReview, variant: 'secondary' as const, icon: Clock, progress: 75, color: 'bg-warning/10 text-warning' };
      case 'accepted':
        return { label: l.accepted, variant: 'default' as const, icon: TrendingUp, progress: 100, color: 'bg-success/10 text-success' };
      case 'rejected':
        return { label: l.rejected, variant: 'destructive' as const, icon: AlertCircle, progress: 100, color: 'bg-destructive/10 text-destructive' };
      case 'waitlisted':
        return { label: l.waitlisted, variant: 'secondary' as const, icon: Clock, progress: 80, color: 'bg-secondary' };
      default:
        return { label: l.draft, variant: 'outline' as const, icon: FileText, progress: 25, color: 'bg-muted' };
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'South Korea': '🇰🇷', 'China': '🇨🇳', 'Japan': '🇯🇵', 'USA': '🇺🇸',
      'Germany': '🇩🇪', 'Poland': '🇵🇱', 'Turkey': '🇹🇷', 'Czech Republic': '🇨🇿',
      'Malaysia': '🇲🇾', 'UAE': '🇦🇪', 'Georgia': '🇬🇪', 'Hungary': '🇭🇺',
      'Russia': '🇷🇺', 'UK': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
      'Italy': '🇮🇹', 'France': '🇫🇷', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱',
    };
    return flags[country] || '🌍';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">{l.loadingApps}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.myApplications}</h1>
          <p className="text-muted-foreground">{l.manageApps}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/search">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {l.newApplication}
            </Button>
          </Link>
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{l.noApps}</h2>
          <p className="text-muted-foreground mb-6">{l.noAppsDesc}</p>
          <Link to="/search">
            <Button size="lg" className="gap-2">
              <Search className="w-5 h-5" />
              {t.searchUniversities}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => {
            const statusInfo = getStatusInfo(app.status);
            const StatusIcon = statusInfo.icon;
            const isDraft = app.status === 'draft' || !app.status;
            
            return (
              <div key={app.id} className="bg-card rounded-2xl border border-border p-6 card-hover">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">
                      {app.university ? getCountryFlag(app.university.country) : '🌍'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {app.university?.name || l.university}
                      </h3>
                      <p className="text-muted-foreground">
                        {app.program || l.noProgram}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        {app.university?.city && (
                          <span>{app.university.city}, {app.university.country}</span>
                        )}
                        {app.intake && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {app.intake}
                          </span>
                        )}
                        {app.application_fee && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            {isPaid ? `$${app.application_fee}` : `${app.application_fee} UniCoin`}
                            {app.fee_paid ? (
                              <Badge className="ml-1 bg-success/10 text-success text-xs">{l.paid}</Badge>
                            ) : (
                              <Badge variant="outline" className="ml-1 text-xs">{l.unpaid}</Badge>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    <div className="w-40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{l.process}</span>
                        <span>{statusInfo.progress}%</span>
                      </div>
                      <Progress value={statusInfo.progress} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  {isDraft && (
                    <>
                      <Link to="/student/documents">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Upload className="w-4 h-4" />
                          {l.uploadDoc}
                        </Button>
                      </Link>
                      <Button 
                        size="sm" className="gap-1"
                        onClick={() => handleSubmitApplication(app)}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {l.submitApp}
                      </Button>
                    </>
                  )}
                  
                  {app.application_fee && !app.fee_paid && app.status !== 'draft' && (
                    <Button 
                      size="sm" variant="default" className="gap-1"
                      onClick={() => { setSelectedApp(app); setPaymentOpen(true); }}
                    >
                      <CreditCard className="w-4 h-4" />
                      {l.payFee} (${app.application_fee})
                    </Button>
                  )}

                  {app.status === 'accepted' && (
                    <Button
                      size="sm"
                      className="gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                      onClick={async () => {
                        let signedUrl: string | null = null;
                        if (app.acceptance_letter_url) {
                          const { data } = await supabase.storage
                            .from('documents')
                            .createSignedUrl(app.acceptance_letter_url, 3600);
                          signedUrl = data?.signedUrl || null;
                        }
                        setCelebrationLetterUrl(signedUrl);
                        setCelebrationApp(app);
                      }}
                    >
                      <PartyPopper className="w-4 h-4" />
                      {language === 'uz' ? 'Qabul xati' : language === 'ru' ? 'Письмо о зачислении' : 'Acceptance Letter'}
                    </Button>
                  )}

                  <Button 
                    variant="ghost" size="sm" className="gap-1"
                    onClick={() => { setSelectedApp(app); setDetailsOpen(true); }}
                  >
                    <Eye className="w-4 h-4" />
                    {l.details}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{l.appDetails}</DialogTitle>
            <DialogDescription>
              {selectedApp?.university?.name} - {selectedApp?.program}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{l.university}</span>
                  <span className="font-medium">{selectedApp.university?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{l.country}</span>
                  <span className="font-medium">{selectedApp.university?.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{l.program}</span>
                  <span className="font-medium">{selectedApp.program || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{l.intakePeriod}</span>
                  <span className="font-medium">{selectedApp.intake || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{l.statusLabel}</span>
                  <Badge className={getStatusInfo(selectedApp.status).color}>
                    {getStatusInfo(selectedApp.status).label}
                  </Badge>
                </div>
                {selectedApp.submitted_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{l.sentDate}</span>
                    <span className="font-medium">
                      {new Date(selectedApp.submitted_at).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US')}
                    </span>
                  </div>
                )}
              </div>

              {selectedApp.application_fee && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{l.appFee}</p>
                      <p className="text-2xl font-bold text-primary">${selectedApp.application_fee}</p>
                    </div>
                    {selectedApp.fee_paid ? (
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-medium">{l.paidLabel}</span>
                      </div>
                    ) : (
                      <Button onClick={() => { setDetailsOpen(false); setPaymentOpen(true); }}>
                        {l.payFee}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">{l.nextSteps}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {selectedApp.status === 'draft' && (
                    <>
                      <li className="flex items-center gap-2">
                        <Upload className="w-4 h-4" /> {l.uploadAllDocs}
                      </li>
                      <li className="flex items-center gap-2">
                        <Send className="w-4 h-4" /> {l.clickSubmit}
                      </li>
                    </>
                  )}
                  {selectedApp.status === 'submitted' && (
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {l.waitingReview}
                    </li>
                  )}
                  {selectedApp.status === 'in_review' && (
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {l.underReview}
                    </li>
                  )}
                  {selectedApp.status === 'accepted' && !selectedApp.fee_paid && selectedApp.application_fee && (
                    <li className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> {l.payAppFee}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{l.securePay}</h2>
                <p className="text-primary-foreground/80 text-sm">{selectedApp?.university?.name}</p>
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-primary-foreground/70 text-sm mb-1">{l.payAmount}</p>
              <p className="text-5xl font-bold">${selectedApp?.application_fee || 0}</p>
              <p className="text-primary-foreground/70 text-sm mt-2">USD</p>
            </div>
          </div>
          
          {selectedApp && (
            <div className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">{l.cardNumber}</label>
                  <div className="relative">
                    <Input placeholder="4242 4242 4242 4242" className="pl-4 pr-12 h-12 text-lg tracking-wider" maxLength={19} defaultValue="4242 4242 4242 4242" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <div className="w-8 h-5 bg-gradient-to-r from-primary to-primary/70 rounded text-[8px] text-primary-foreground flex items-center justify-center font-bold">VISA</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">{l.expiry}</label>
                    <Input placeholder="MM/YY" className="h-12 text-center tracking-wider" maxLength={5} defaultValue="12/28" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">CVV</label>
                    <div className="relative">
                      <Input type="password" placeholder="***" className="h-12 text-center tracking-wider" maxLength={4} defaultValue="123" />
                      <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">{l.cardHolder}</label>
                  <Input placeholder="JOHN DOE" className="h-12 uppercase tracking-wide" defaultValue="DEMO USER" />
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{l.university}</span>
                  <span className="font-medium">{selectedApp.university?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{l.program}</span>
                  <span className="font-medium">{selectedApp.program}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-border">
                  <span className="font-medium">{l.total}</span>
                  <span className="font-bold text-primary">${selectedApp.application_fee}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>{l.secureSSL}</span>
              </div>

              <Button className="w-full gap-2 h-14 text-lg font-semibold" size="lg" onClick={handlePayFee} disabled={processing}>
                {processing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {l.processingPay}</>
                ) : (
                  <><Lock className="w-5 h-5" /> ${selectedApp.application_fee} {l.payBtn}</>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {l.demoNote} <br/> {l.demoNote2}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Acceptance Celebration */}
      <AcceptanceCelebration
        open={!!celebrationApp}
        onOpenChange={(open) => { if (!open) setCelebrationApp(null); }}
        universityName={celebrationApp?.university?.name || ''}
        letterUrl={celebrationLetterUrl}
        language={language}
      />
    </div>
  );
}
