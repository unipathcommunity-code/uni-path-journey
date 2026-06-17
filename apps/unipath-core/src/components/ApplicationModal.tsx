import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useBusinessMode } from '@/hooks/useBusinessMode';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Calendar,
  Send,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface University {
  id: string;
  name: string;
  location: string;
  flag: string;
  programs: string[];
  intake: string[];
}

interface StudentDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
}

interface ApplicationModalProps {
  university: University | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REQUIRED_DOC_TYPES = ['passport', 'diploma', 'transcript', 'cv', 'sop', 'photo'];

const modalLabels = {
  uz: {
    applyTo: 'ga ariza topshirish',
    autoAttach: 'Hujjatlaringiz avtomatik ravishda arizangizga biriktriladi',
    program: 'Dastur',
    selectProgram: 'Dasturni tanlang',
    intakePeriod: 'Qabul davri',
    selectIntake: 'Qabul davrini tanlang',
    docStatus: 'Hujjatlar holati',
    required: 'majburiy',
    requiredDocs: 'Majburiy hujjatlar',
    manageDocs: 'Hujjatlarni boshqarish',
    loadingDocs: 'Hujjatlar yuklanmoqda...',
    approved: 'Tasdiqlangan',
    rejected: 'Rad etilgan',
    pending: 'Tekshirilmoqda',
    notUploaded: 'Yuklanmagan',
    uploadFromDocs: 'Hujjatlar sahifasidan yuklang',
    fillAll: 'Barcha maydonlarni to\'ldiring',
    uploadFirst: 'Avval',
    docsPage: 'Hujjatlar',
    uploadAllRequired: 'sahifasidan barcha majburiy hujjatlarni yuklang.',
    selectProgramIntake: 'Dastur va qabul davrini tanlang.',
    submitting: 'Yuborilmoqda...',
    submitApp: 'Ariza yuborish',
    errorTitle: 'Xatolik',
    loginRequired: 'Iltimos, tizimga kiring',
    incompleteTitle: 'Ariza tugallanmagan',
    incompleteDesc: 'Barcha majburiy hujjatlarni yuklang va dastur/qabul davrini tanlang.',
    successTitle: 'Ariza yuborildi!',
    successDesc: 'Arizangiz ko\'rib chiqish uchun yuborildi.',
    submitError: 'Arizani yuborishda xatolik yuz berdi. Qayta urinib ko\'ring.',
    passport: 'Passport',
    diploma: 'Diplom / Attestat',
    transcript: 'Transkript',
    cv: 'CV / Resume',
    sop: 'Motivatsion xat (SOP)',
    photo: 'Rasm (3x4)',
  },
  ru: {
    applyTo: ' — подать заявку',
    autoAttach: 'Ваши документы будут автоматически прикреплены к заявке',
    program: 'Программа',
    selectProgram: 'Выберите программу',
    intakePeriod: 'Период набора',
    selectIntake: 'Выберите период набора',
    docStatus: 'Статус документов',
    required: 'обязательных',
    requiredDocs: 'Обязательные документы',
    manageDocs: 'Управление документами',
    loadingDocs: 'Загрузка документов...',
    approved: 'Одобрен',
    rejected: 'Отклонён',
    pending: 'На проверке',
    notUploaded: 'Не загружен',
    uploadFromDocs: 'Загрузите на странице документов',
    fillAll: 'Заполните все поля',
    uploadFirst: 'Сначала загрузите все обязательные документы на странице',
    docsPage: 'Документы',
    uploadAllRequired: '.',
    selectProgramIntake: 'Выберите программу и период набора.',
    submitting: 'Отправка...',
    submitApp: 'Отправить заявку',
    errorTitle: 'Ошибка',
    loginRequired: 'Пожалуйста, войдите в систему',
    incompleteTitle: 'Заявка не завершена',
    incompleteDesc: 'Загрузите все обязательные документы и выберите программу/период набора.',
    successTitle: 'Заявка отправлена!',
    successDesc: 'Ваша заявка отправлена на рассмотрение.',
    submitError: 'Ошибка при отправке заявки. Попробуйте снова.',
    passport: 'Паспорт',
    diploma: 'Диплом / Аттестат',
    transcript: 'Транскрипт',
    cv: 'CV / Резюме',
    sop: 'Мотивационное письмо (SOP)',
    photo: 'Фото (3x4)',
  },
  en: {
    applyTo: ' — Apply',
    autoAttach: 'Your documents will be automatically attached to your application',
    program: 'Program',
    selectProgram: 'Select a program',
    intakePeriod: 'Intake Period',
    selectIntake: 'Select intake period',
    docStatus: 'Document Status',
    required: 'required',
    requiredDocs: 'Required Documents',
    manageDocs: 'Manage Documents',
    loadingDocs: 'Loading documents...',
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Under Review',
    notUploaded: 'Not Uploaded',
    uploadFromDocs: 'Upload from the Documents page',
    fillAll: 'Complete all fields',
    uploadFirst: 'First upload all required documents from the',
    docsPage: 'Documents',
    uploadAllRequired: 'page.',
    selectProgramIntake: 'Select a program and intake period.',
    submitting: 'Submitting...',
    submitApp: 'Submit Application',
    errorTitle: 'Error',
    loginRequired: 'Please sign in',
    incompleteTitle: 'Application incomplete',
    incompleteDesc: 'Upload all required documents and select a program/intake period.',
    successTitle: 'Application submitted!',
    successDesc: 'Your application has been submitted for review.',
    submitError: 'Error submitting application. Please try again.',
    passport: 'Passport',
    diploma: 'Diploma / Certificate',
    transcript: 'Transcript',
    cv: 'CV / Resume',
    sop: 'Statement of Purpose (SOP)',
    photo: 'Photo (3x4)',
  },
};

export function ApplicationModal({ university, open, onOpenChange }: ApplicationModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useApp();
  const { isPaid } = useBusinessMode();
  const { toast } = useToast();
  const l = modalLabels[language] || modalLabels.en;

  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedIntake, setSelectedIntake] = useState<string>('');
  const [studentDocuments, setStudentDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [prioritySupport, setPrioritySupport] = useState(false);

  useEffect(() => {
    if (!open || !user) {
      setLoading(false);
      return;
    }

    async function fetchDocuments() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, document_type, file_name, file_url, status')
          .eq('user_id', user!.id);

        if (error) throw error;
        setStudentDocuments(data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [open, user]);

  const getDocumentStatus = (docType: string) => {
    const doc = studentDocuments.find(d => d.document_type === docType);
    if (!doc) return { status: 'missing', doc: null };
    return { status: doc.status, doc };
  };

  const uploadedRequiredDocs = REQUIRED_DOC_TYPES.filter(type => {
    const { status } = getDocumentStatus(type);
    return status !== 'missing';
  });

  const progress = Math.round((uploadedRequiredDocs.length / REQUIRED_DOC_TYPES.length) * 100);
  const canSubmit = uploadedRequiredDocs.length === REQUIRED_DOC_TYPES.length && selectedProgram && selectedIntake;

  const getStatusIcon = (docType: string) => {
    const { status } = getDocumentStatus(docType);
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (docType: string) => {
    const { status } = getDocumentStatus(docType);
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">{l.approved}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs">{l.rejected}</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">{l.pending}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{l.notUploaded}</Badge>;
    }
  };

  const getDocTypeName = (type: string) => {
    const names: Record<string, string> = {
      passport: l.passport,
      diploma: l.diploma,
      transcript: l.transcript,
      cv: l.cv,
      sop: l.sop,
      photo: l.photo,
    };
    return names[type] || type;
  };

  const handleSubmit = async () => {
    if (!user || !university) {
      toast({
        title: l.errorTitle,
        description: l.loginRequired,
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!canSubmit) {
      toast({
        title: l.incompleteTitle,
        description: l.incompleteDesc,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const documentsData: Record<string, { id: string; name: string; type: string; url: string; status: string }> = {};
      
      studentDocuments.forEach(doc => {
        documentsData[doc.document_type] = {
          id: doc.id,
          name: doc.file_name,
          type: doc.document_type,
          url: doc.file_url,
          status: doc.status,
        };
      });

      const { error: appError } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          university_id: university.id,
          program: selectedProgram,
          intake: selectedIntake,
          documents: documentsData,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        });

      if (appError) throw appError;

      toast({
        title: l.successTitle,
        description: l.successDesc,
      });

      onOpenChange(false);
      navigate('/student/applications');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: l.errorTitle,
        description: l.submitError,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!university) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">{university.flag}</span>
            {university.name}{l.applyTo}
          </DialogTitle>
          <DialogDescription>
            {l.autoAttach}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Program & Intake Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {l.program} <span className="text-destructive">*</span>
              </label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder={l.selectProgram} />
                </SelectTrigger>
                <SelectContent>
                  {university.programs.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {l.intakePeriod} <span className="text-destructive">*</span>
              </label>
              <Select value={selectedIntake} onValueChange={setSelectedIntake}>
                <SelectTrigger>
                  <SelectValue placeholder={l.selectIntake} />
                </SelectTrigger>
                <SelectContent>
                  {university.intake.map((intake) => (
                    <SelectItem key={intake} value={intake}>
                      {intake}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{l.docStatus}</span>
              <span className="text-sm text-muted-foreground">
                {uploadedRequiredDocs.length}/{REQUIRED_DOC_TYPES.length} {l.required}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">{l.requiredDocs}</h3>
              <Link 
                to="/student/documents" 
                className="text-sm text-primary hover:underline flex items-center gap-1"
                onClick={() => onOpenChange(false)}
              >
                {l.manageDocs}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                {l.loadingDocs}
              </div>
            ) : (
              <>
                {REQUIRED_DOC_TYPES.map((docType) => {
                  const { doc } = getDocumentStatus(docType);
                  return (
                    <div
                      key={docType}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                        doc
                          ? doc.status === 'approved'
                            ? 'border-success/50 bg-success/5'
                            : doc.status === 'rejected'
                            ? 'border-destructive/50 bg-destructive/5'
                            : 'border-warning/50 bg-warning/5'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                        {getStatusIcon(docType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {getDocTypeName(docType)}
                          <span className="text-destructive ml-1">*</span>
                        </p>
                        {doc ? (
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.file_name}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {l.uploadFromDocs}
                          </p>
                        )}
                      </div>

                      {getStatusBadge(docType)}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Warning if documents missing */}
          {!canSubmit && !loading && (
            <div className="flex gap-3 p-4 bg-warning/10 rounded-xl">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {l.fillAll}
                </p>
                <p className="text-xs text-muted-foreground">
                  {uploadedRequiredDocs.length < REQUIRED_DOC_TYPES.length && (
                    <span>{l.uploadFirst} <Link to="/student/documents" className="text-primary underline" onClick={() => onOpenChange(false)}>{l.docsPage}</Link> {l.uploadAllRequired} </span>
                  )}
                  {(!selectedProgram || !selectedIntake) && l.selectProgramIntake}
                </p>
              </div>
            </div>
          )}

          {isPaid ? (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
              <span className="text-sm font-medium">
                {language === 'uz' ? 'Ko\'rib chiqish turi' : language === 'ru' ? 'Тип рассмотрения' : 'Review type'}
              </span>
              <span className="font-bold text-primary">
                {language === 'uz' ? 'Tarifga kiritilgan' : language === 'ru' ? 'Включено в тариф' : 'Included in plan'}
              </span>
            </div>
          ) : (
            <>
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                  prioritySupport ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:border-primary/30'
                }`}
                onClick={() => setPrioritySupport(!prioritySupport)}
              >
                <Checkbox
                  checked={prioritySupport}
                  onCheckedChange={(v) => setPrioritySupport(!!v)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">
                    ⚡ {language === 'uz' ? 'Tezkor ko\'rib chiqish' : language === 'ru' ? 'Приоритетная поддержка' : 'Priority Support'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'uz' ? '24 soat ichida javob olish kafolati (+5 UniCoin)' : language === 'ru' ? 'Гарантированный ответ в течение 24 часов (+5 UniCoin)' : 'Guaranteed 24h response time (+5 UniCoin)'}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary whitespace-nowrap">+5 UniCoin</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
                <span className="text-sm font-medium">
                  {language === 'uz' ? "Jami to'lov" : language === 'ru' ? 'Итого' : 'Total processing fee'}
                </span>
                <span className="font-bold text-primary">
                  {(prioritySupport ? 5 : 0)} UniCoin{prioritySupport ? ' (+ Priority)' : ''}
                </span>
              </div>
            </>
          )}

          {/* Submit Button */}
          <Button
            className="w-full gap-2"
            size="lg"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              l.submitting
            ) : (
              <>
                <Send className="w-5 h-5" />
                {l.submitApp}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
