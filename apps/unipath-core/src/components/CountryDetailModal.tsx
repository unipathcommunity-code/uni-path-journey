import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plane,
  DollarSign,
  GraduationCap,
  Clock,
  FileText,
  Lightbulb,
  Home,
  UtensilsCrossed,
  Bus,
  Wallet,
  Globe,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CountryDetail {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  flag: string | null;
  image_url: string | null;
  avg_tuition: string | null;
  currency: string | null;
  visa_website: string | null;
  visa_info: any;
  cost_of_living: any;
  education_info: any;
  key_requirements: string[] | null;
}

interface Props {
  countryId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const labels = {
  en: {
    visa: 'Visa',
    costs: 'Costs',
    education: 'Education',
    visaType: 'Visa Type',
    process: 'Process',
    cost: 'Fee',
    processingTime: 'Processing Time',
    requiredDocs: 'Required Documents',
    tips: 'Tips',
    monthlyRent: 'Rent',
    food: 'Food',
    transport: 'Transport',
    totalMonthly: 'Total Monthly',
    system: 'System',
    language: 'Language',
    academicYear: 'Academic Year',
    grading: 'Grading',
    keyTests: 'Key Tests',
    highlights: 'Highlights',
    uniTypes: 'University Types',
    keyRequirements: 'Key Requirements',
    visitEmbassy: 'Visit Embassy Website',
    loading: 'Loading...',
  },
  uz: {
    visa: 'Viza',
    costs: 'Xarajatlar',
    education: "Ta'lim",
    visaType: 'Viza turi',
    process: 'Jarayon',
    cost: "To'lov",
    processingTime: "Ko'rib chiqish muddati",
    requiredDocs: 'Kerakli hujjatlar',
    tips: 'Maslahatlar',
    monthlyRent: 'Ijara',
    food: 'Oziq-ovqat',
    transport: 'Transport',
    totalMonthly: 'Jami oylik',
    system: 'Tizim',
    language: 'Til',
    academicYear: "O'quv yili",
    grading: 'Baholash',
    keyTests: 'Asosiy testlar',
    highlights: 'Afzalliklar',
    uniTypes: 'Universitet turlari',
    keyRequirements: 'Asosiy talablar',
    visitEmbassy: 'Elchixona saytiga kirish',
    loading: 'Yuklanmoqda...',
  },
  ru: {
    visa: 'Виза',
    costs: 'Расходы',
    education: 'Образование',
    visaType: 'Тип визы',
    process: 'Процесс',
    cost: 'Стоимость',
    processingTime: 'Срок обработки',
    requiredDocs: 'Необходимые документы',
    tips: 'Советы',
    monthlyRent: 'Аренда',
    food: 'Еда',
    transport: 'Транспорт',
    totalMonthly: 'Итого в месяц',
    system: 'Система',
    language: 'Язык',
    academicYear: 'Учебный год',
    grading: 'Оценивание',
    keyTests: 'Основные тесты',
    highlights: 'Преимущества',
    uniTypes: 'Типы университетов',
    keyRequirements: 'Основные требования',
    visitEmbassy: 'Посетить сайт посольства',
    loading: 'Загрузка...',
  },
};

export function CountryDetailModal({ countryId, open, onOpenChange }: Props) {
  const { language } = useApp();
  const l = labels[language];
  const [country, setCountry] = useState<CountryDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!countryId || !open) return;
    setLoading(true);
    supabase
      .from('countries')
      .select('*')
      .eq('id', countryId)
      .single()
      .then(({ data }) => {
        setCountry(data as unknown as CountryDetail);
        setLoading(false);
      });
  }, [countryId, open]);

  const countryName =
    language === 'uz'
      ? country?.name_uz || country?.name
      : language === 'ru'
      ? country?.name_ru || country?.name
      : country?.name;

  const visa = country?.visa_info || {};
  const costs = country?.cost_of_living || {};
  const edu = country?.education_info || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : country ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <span className="text-4xl">{country.flag}</span>
                {countryName}
              </DialogTitle>
              {country.avg_tuition && (
                <p className="text-sm text-muted-foreground mt-1">
                  {l.costs}: {country.avg_tuition}/yr • {country.currency}
                </p>
              )}
            </DialogHeader>

            {/* Key Requirements */}
            {country.key_requirements && country.key_requirements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {country.key_requirements.map((req, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {req}
                  </Badge>
                ))}
              </div>
            )}

            <Tabs defaultValue="visa" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="visa" className="gap-1.5 text-xs sm:text-sm">
                  <Plane className="w-3.5 h-3.5" />
                  {l.visa}
                </TabsTrigger>
                <TabsTrigger value="costs" className="gap-1.5 text-xs sm:text-sm">
                  <DollarSign className="w-3.5 h-3.5" />
                  {l.costs}
                </TabsTrigger>
                <TabsTrigger value="education" className="gap-1.5 text-xs sm:text-sm">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {l.education}
                </TabsTrigger>
              </TabsList>

              {/* Visa Tab */}
              <TabsContent value="visa" className="space-y-4 mt-4">
                {visa.type && (
                  <InfoRow icon={Plane} label={l.visaType} value={visa.type} />
                )}
                {visa.process && (
                  <InfoRow icon={FileText} label={l.process} value={visa.process} />
                )}
                {visa.cost && (
                  <InfoRow icon={DollarSign} label={l.cost} value={visa.cost} />
                )}
                {visa.processing_time && (
                  <InfoRow icon={Clock} label={l.processingTime} value={visa.processing_time} />
                )}
                {visa.documents && visa.documents.length > 0 && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-foreground mb-2">{l.requiredDocs}</p>
                    <ul className="space-y-1.5">
                      {visa.documents.map((doc: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {visa.tips && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{visa.tips}</p>
                    </div>
                  </div>
                )}
                {country.visa_website && (
                  <a href={country.visa_website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="w-4 h-4" />
                      {l.visitEmbassy}
                    </Button>
                  </a>
                )}
              </TabsContent>

              {/* Costs Tab */}
              <TabsContent value="costs" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <CostCard icon={Home} label={l.monthlyRent} value={costs.monthly_rent} />
                  <CostCard icon={UtensilsCrossed} label={l.food} value={costs.food} />
                  <CostCard icon={Bus} label={l.transport} value={costs.transport} />
                  <CostCard icon={Wallet} label={l.totalMonthly} value={costs.total_monthly} highlight />
                </div>
                {costs.notes && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{costs.notes}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-4 mt-4">
                {edu.system && (
                  <InfoRow icon={GraduationCap} label={l.system} value={edu.system} />
                )}
                {edu.language && (
                  <InfoRow icon={Globe} label={l.language} value={edu.language} />
                )}
                {edu.academic_year && (
                  <InfoRow icon={Clock} label={l.academicYear} value={edu.academic_year} />
                )}
                {edu.grading && (
                  <InfoRow icon={FileText} label={l.grading} value={edu.grading} />
                )}
                {edu.key_tests && edu.key_tests.length > 0 && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-foreground mb-2">{l.keyTests}</p>
                    <div className="flex flex-wrap gap-2">
                      {edu.key_tests.map((test: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {test}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {edu.highlights && edu.highlights.length > 0 && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-foreground mb-2">{l.highlights}</p>
                    <ul className="space-y-1.5">
                      {edu.highlights.map((h: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {edu.university_types && (
                  <InfoRow icon={GraduationCap} label={l.uniTypes} value={edu.university_types} />
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
      <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function CostCard({ icon: Icon, label, value, highlight }: { icon: any; label: string; value?: string; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'}`}>
      <Icon className={`w-5 h-5 mb-2 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
