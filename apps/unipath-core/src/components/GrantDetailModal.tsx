import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Award,
  Calendar,
  ExternalLink,
  Users,
  CheckCircle2,
  ArrowRightLeft,
  Coins,
  FileText,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getCompetitionLevel } from '@/lib/grantUtils';

interface Grant {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  description: string | null;
  description_uz: string | null;
  description_ru: string | null;
  grant_type: string;
  coverage_type: string;
  coverage_amount: string | null;
  eligibility_criteria: string | null;
  eligibility_criteria_uz: string | null;
  eligibility_criteria_ru: string | null;
  is_transfer_program: boolean | null;
  transfer_from_year: number | null;
  transfer_details: string | null;
  transfer_details_uz: string | null;
  transfer_details_ru: string | null;
  application_deadline: string | null;
  application_url: string | null;
  spots_available: number | null;
  success_rate: string | null;
  required_documents: any;
  country?: { name: string; flag: string | null };
  university?: { name: string };
}

const GRANT_TYPES: Record<string, { label: string; labelRu: string; labelEn: string; icon: string }> = {
  bachelor: { label: 'Bakalavr', labelRu: 'Бакалавриат', labelEn: 'Bachelor', icon: '🎓' },
  master: { label: 'Magistratura', labelRu: 'Магистратура', labelEn: 'Master', icon: '📚' },
  phd: { label: 'Doktorantura', labelRu: 'Докторантура', labelEn: 'PhD', icon: '🔬' },
  transfer: { label: 'Transfer', labelRu: 'Перевод', labelEn: 'Transfer', icon: '🔄' },
};

const COVERAGE_TYPES: Record<string, { label: string; labelRu: string; labelEn: string }> = {
  full: { label: "To'liq grant", labelRu: 'Полный грант', labelEn: 'Full Scholarship' },
  partial: { label: 'Qisman grant', labelRu: 'Частичный грант', labelEn: 'Partial Scholarship' },
  tuition_only: { label: "O'qish haqi", labelRu: 'Оплата обучения', labelEn: 'Tuition Only' },
  living_expenses: { label: 'Yashash xarajati', labelRu: 'Расходы на жизнь', labelEn: 'Living Expenses' },
};

interface GrantDetailModalProps {
  grant: Grant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GrantDetailModal({ grant, open, onOpenChange }: GrantDetailModalProps) {
  const { language } = useApp();

  if (!grant) return null;

  const t = (en: string | null, uz: string | null, ru: string | null) => {
    if (language === 'uz' && uz) return uz;
    if (language === 'ru' && ru) return ru;
    return en || '';
  };

  const name = t(grant.name, grant.name_uz, grant.name_ru);
  const description = t(grant.description, grant.description_uz, grant.description_ru);
  const eligibility = t(grant.eligibility_criteria, grant.eligibility_criteria_uz, grant.eligibility_criteria_ru);
  const transferDetails = t(grant.transfer_details, grant.transfer_details_uz, grant.transfer_details_ru);
  const typeInfo = GRANT_TYPES[grant.grant_type];
  const coverageInfo = COVERAGE_TYPES[grant.coverage_type];
  const competition = getCompetitionLevel(grant.success_rate);

  const deadline = grant.application_deadline ? new Date(grant.application_deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;

  const docs: string[] = Array.isArray(grant.required_documents) ? grant.required_documents : [];

  const txt = {
    coverageAmount: language === 'uz' ? 'Miqdori' : language === 'ru' ? 'Сумма' : 'Amount',
    eligibility: language === 'uz' ? 'Talablar' : language === 'ru' ? 'Требования' : 'Requirements',
    documents: language === 'uz' ? 'Kerakli hujjatlar' : language === 'ru' ? 'Необходимые документы' : 'Required Documents',
    deadline: language === 'uz' ? 'Ariza muddati' : language === 'ru' ? 'Срок подачи' : 'Deadline',
    daysLeft: language === 'uz' ? 'kun qoldi' : language === 'ru' ? 'дней осталось' : 'days left',
    expired: language === 'uz' ? "Muddati o'tgan" : language === 'ru' ? 'Срок истёк' : 'Expired',
    spots: language === 'uz' ? "Mavjud o'rinlar" : language === 'ru' ? 'Доступные места' : 'Available Spots',
    successRate: language === 'uz' ? 'Muvaffaqiyat' : language === 'ru' ? 'Успешность' : 'Success Rate',
    transfer: language === 'uz' ? 'Transfer ma\'lumotlari' : language === 'ru' ? 'Информация о переводе' : 'Transfer Info',
    transferYear: language === 'uz' ? '-kursdan' : language === 'ru' ? '-й курс' : 'year',
    apply: language === 'uz' ? 'Ariza berish' : language === 'ru' ? 'Подать заявку' : 'Apply Now',
    noDocuments: language === 'uz' ? "Ma'lumot tez orada qo'shiladi" : language === 'ru' ? 'Информация скоро будет добавлена' : 'Information coming soon',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-5 pb-4">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-xl shrink-0">
                {typeInfo?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg leading-snug">{name}</DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {grant.country && (
                    <span className="text-sm text-muted-foreground">
                      {grant.country.flag} {grant.country.name}
                    </span>
                  )}
                  {grant.university && (
                    <span className="text-sm text-muted-foreground">• {grant.university.name}</span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant={grant.coverage_type === 'full' ? 'default' : 'secondary'}>
              {language === 'uz' ? coverageInfo?.label : language === 'ru' ? coverageInfo?.labelRu : coverageInfo?.labelEn}
            </Badge>
            <Badge variant="outline">
              {language === 'uz' ? typeInfo?.label : language === 'ru' ? typeInfo?.labelRu : typeInfo?.labelEn}
            </Badge>
            {competition && (
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${competition.bgColor} ${competition.color}`}>
                {language === 'uz' ? competition.labelUz : language === 'ru' ? competition.labelRu : competition.labelEn}
              </span>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Coverage Amount */}
          {grant.coverage_amount && (
            <div className="bg-primary/5 rounded-lg p-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-primary">{txt.coverageAmount}: {grant.coverage_amount}</span>
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {deadline && !isExpired && (
              <div className={`rounded-lg p-3 ${isUrgent ? 'bg-destructive/10' : 'bg-muted/50'}`}>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {txt.deadline}
                </div>
                <p className="text-sm font-medium">
                  {deadline.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                {isUrgent && (
                  <p className="text-xs text-destructive font-medium mt-0.5">
                    ⚡ {daysLeft} {txt.daysLeft}
                  </p>
                )}
              </div>
            )}
            {isExpired && (
              <div className="bg-destructive/10 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {txt.deadline}
                </div>
                <p className="text-sm font-medium text-destructive">{txt.expired}</p>
              </div>
            )}
            {grant.spots_available && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Users className="w-3.5 h-3.5" />
                  {txt.spots}
                </div>
                <p className="text-sm font-medium">{grant.spots_available.toLocaleString()}</p>
              </div>
            )}
            {grant.success_rate && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Target className="w-3.5 h-3.5" />
                  {txt.successRate}
                </div>
                <p className="text-sm font-semibold text-primary">{grant.success_rate}</p>
              </div>
            )}
          </div>

          {/* Transfer Info */}
          {grant.is_transfer_program && (
            <div className="bg-primary/5 rounded-lg p-4">
              <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
                {txt.transfer}
              </h4>
              {grant.transfer_from_year && (
                <p className="text-sm text-foreground font-medium mb-1">
                  {grant.transfer_from_year}{txt.transferYear}
                </p>
              )}
              {transferDetails && (
                <p className="text-sm text-muted-foreground">{transferDetails}</p>
              )}
            </div>
          )}

          {/* Eligibility */}
          {eligibility && (
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                {txt.eligibility}
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{eligibility}</p>
            </div>
          )}

          {/* Required Documents */}
          {docs.length > 0 && (
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                {txt.documents}
              </h4>
              <ul className="space-y-1.5">
                {docs.map((doc, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply Button */}
          {grant.application_url && (
            <Button asChild className="w-full gap-2" size="lg">
              <a href={grant.application_url} target="_blank" rel="noopener noreferrer">
                {txt.apply}
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
