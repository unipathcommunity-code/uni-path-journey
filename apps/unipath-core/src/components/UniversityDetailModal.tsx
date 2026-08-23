import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  GraduationCap,
  DollarSign,
  Award,
  Calendar,
  Users,
  Star,
  Globe,
  FileText,
  BookOpen,
  Building2,
  Trophy,
  CheckCircle2,
  Languages,
  Clock,
  Banknote,
} from 'lucide-react';

export interface UniversityDetail {
  id: string;
  name: string;
  location: string;
  flag: string;
  ranking?: number;
  tuition: string;
  scholarship: boolean;
  intake: string[];
  programs: string[];
  students?: number;
  intlStudents?: number;
  localStudents?: number;
  rating?: number;
  image: string;
  // Extended details
  uzbekStudents?: number;
  description?: string;
  website?: string;
  founded?: number;
  acceptanceRate?: number;
  languageOfInstruction?: string[];
  applicationDeadline?: string;
  applicationFee?: string;
  requirements?: {
    documents: string[];
    certificates: string[];
    languageTests: string[];
    minGPA?: number;
  };
}

interface UniversityDetailModalProps {
  university: UniversityDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: () => void;
}

export function UniversityDetailModal({
  university,
  open,
  onOpenChange,
  onApply,
}: UniversityDetailModalProps) {
  const { language } = useApp();
  const t = useTranslation(language);

  if (!university) return null;

  const labels = {
    uz: {
      worldRanking: "Jahon reytingi",
      scholarship: "Grant mavjud",
      totalStudents: "Jami talabalar",
      intlStudents: "Xalqaro talabalar",
      uzbekStudents: "O'zbekistonlik talabalar",
      tuitionPerYear: "Yillik to'lov",
      intake: "Qabul davri",
      programs: "Dasturlar",
      requirements: "Talablar",
      documents: "Hujjatlar",
      certificates: "Sertifikatlar",
      languageTests: "Til testlari",
      minGPA: "Minimal GPA",
      notSpecified: "Ma'lumot kiritilmagan",
      applicationDeadline: "Ariza topshirish muddati",
      applicationFee: "Ariza to'lovi",
      languageOfInstruction: "O'qitish tili",
      founded: "Tashkil etilgan yil",
      acceptanceRate: "Qabul foizi",
      applyNow: "Hozir ariza topshirish",
      about: "Universitet haqida",
      statistics: "Statistika",
      admissionInfo: "Qabul ma'lumotlari",
    },
    ru: {
      worldRanking: "Мировой рейтинг",
      scholarship: "Стипендия доступна",
      totalStudents: "Всего студентов",
      intlStudents: "Иностранные студенты",
      uzbekStudents: "Студенты из Узбекистана",
      tuitionPerYear: "Стоимость в год",
      intake: "Набор",
      programs: "Программы",
      requirements: "Требования",
      documents: "Документы",
      certificates: "Сертификаты",
      languageTests: "Языковые тесты",
      minGPA: "Минимальный GPA",
      notSpecified: "Информация не указана",
      applicationDeadline: "Срок подачи заявки",
      applicationFee: "Регистрационный взнос",
      languageOfInstruction: "Язык обучения",
      founded: "Год основания",
      acceptanceRate: "Процент принятия",
      applyNow: "Подать заявку",
      about: "О университете",
      statistics: "Статистика",
      admissionInfo: "Информация о приёме",
    },
    en: {
      worldRanking: "World Ranking",
      scholarship: "Scholarship Available",
      totalStudents: "Total Students",
      intlStudents: "International Students",
      uzbekStudents: "Uzbek Students",
      tuitionPerYear: "Tuition/Year",
      intake: "Intake",
      programs: "Programs",
      requirements: "Requirements",
      documents: "Documents",
      certificates: "Certificates",
      languageTests: "Language Tests",
      minGPA: "Minimum GPA",
      notSpecified: "Not specified",
      applicationDeadline: "Application Deadline",
      applicationFee: "Application Fee",
      languageOfInstruction: "Language of Instruction",
      founded: "Founded",
      acceptanceRate: "Acceptance Rate",
      applyNow: "Apply Now",
      about: "About University",
      statistics: "Statistics",
      admissionInfo: "Admission Info",
    },
  };

  const l = labels[language] || labels.en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header Image */}
        <div className="relative h-48 w-full">
          <img
            src={university.image}
            alt={university.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{university.flag}</span>
              <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                #{university.ranking} {l.worldRanking}
              </Badge>
              {university.scholarship && (
                <Badge className="bg-primary/90 border-0">
                  <Award className="w-3 h-3 mr-1" />
                  {l.scholarship}
                </Badge>
              )}
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-bold text-foreground">
                {university.name}
              </DialogTitle>
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {university.location}
              </p>
            </DialogHeader>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-12rem)]">
          <div className="p-6 space-y-6">
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-warning/10 rounded-full">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="font-bold text-warning">{university.rating}</span>
              </div>
              {university.founded && (
                <Badge variant="outline" className="gap-1">
                  <Building2 className="w-3 h-3" />
                  {l.founded}: {university.founded}
                </Badge>
              )}
              {university.acceptanceRate && (
                <Badge variant="outline" className="gap-1">
                  <Trophy className="w-3 h-3" />
                  {l.acceptanceRate}: {university.acceptanceRate}%
                </Badge>
              )}
            </div>

            {/* Description */}
            {university.description && (
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {l.about}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {university.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Statistics */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {l.statistics}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {university.students && (
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-foreground">
                      {university.students.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{l.totalStudents}</p>
                  </div>
                )}
                {university.localStudents && (
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold text-foreground">
                      {university.localStudents.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'uz' ? 'Mahalliy talabalar' : language === 'ru' ? 'Местные студенты' : 'Local Students'}
                    </p>
                  </div>
                )}
                {university.intlStudents && (
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <Globe className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-foreground">
                      {university.intlStudents.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{l.intlStudents}</p>
                  </div>
                )}
                {university.uzbekStudents && (
                  <div className="p-4 bg-primary/10 rounded-xl text-center border-2 border-primary/20">
                    <img
                      src="https://flagcdn.com/w40/uz.png"
                      alt="Uzbekistan"
                      className="w-6 h-4 mx-auto mb-2 object-cover rounded"
                    />
                    <p className="text-2xl font-bold text-primary">
                      {university.uzbekStudents.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{l.uzbekStudents}</p>
                  </div>
                )}
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-lg font-bold text-foreground">
                    {university.tuition}
                  </p>
                  <p className="text-xs text-muted-foreground">{l.tuitionPerYear}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Admission Info */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                {l.admissionInfo}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Intake */}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    {l.intake}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {university.intake.map((intake) => (
                      <Badge key={intake} variant="secondary">
                        {intake}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Language of Instruction */}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4" />
                    {l.languageOfInstruction}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {university.languageOfInstruction?.length ? (
                      university.languageOfInstruction.map((lang) => (
                        <Badge key={lang} variant="secondary">
                          {lang}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground/70">{l.notSpecified}</span>
                    )}
                  </div>
                </div>

                {/* Application Deadline */}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    {l.applicationDeadline}
                  </p>
                  <p className="font-medium text-foreground">
                    {university.applicationDeadline || 'March 15, 2025'}
                  </p>
                </div>

                {/* Application Fee */}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <Banknote className="w-4 h-4" />
                    {l.applicationFee}
                  </p>
                  <p className="font-medium text-foreground">
                    {university.applicationFee || '$50 - $100'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Programs */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                {l.programs}
              </h3>
              <div className="flex flex-wrap gap-2">
                {university.programs.map((program) => (
                  <Badge key={program} variant="outline" className="py-1.5">
                    {program}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Requirements */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                {l.requirements}
              </h3>
              
              <div className="space-y-4">
                {/* Required Documents */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {l.documents}
                  </p>
                  <div className="space-y-2">
                    {!university.requirements?.documents?.length && (
                      <span className="text-sm text-muted-foreground/70">{l.notSpecified}</span>
                    )}
                    {(university.requirements?.documents ?? []).map((doc) => (
                      <div key={doc} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-foreground">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificates */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {l.certificates}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!university.requirements?.certificates?.length && (
                      <span className="text-sm text-muted-foreground/70">{l.notSpecified}</span>
                    )}
                    {(university.requirements?.certificates ?? []).map((cert) => (
                      <Badge key={cert} variant="secondary" className="gap-1">
                        <Award className="w-3 h-3" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Language Tests */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {l.languageTests}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!university.requirements?.languageTests?.length && (
                      <span className="text-sm text-muted-foreground/70">{l.notSpecified}</span>
                    )}
                    {(university.requirements?.languageTests ?? []).map((test) => (
                      <Badge key={test} className="bg-primary/10 text-primary border-primary/20">
                        {test}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Min GPA */}
                {typeof university.requirements?.minGPA === 'number' && (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{l.minGPA}:</span>
                    <span className="font-semibold text-foreground">
                      {university.requirements.minGPA} / 4.0
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-4">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onApply?.();
                }}
              >
                <GraduationCap className="w-5 h-5" />
                {l.applyNow}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
