import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentJourney } from '@/hooks/useStudentJourney';
import { LockedFeatureBlur } from '@/components/LockedFeatureBlur';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Briefcase, MapPin, Clock, DollarSign, Heart, Search, Building2, Languages, FileText, BadgeCheck, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  company_name: string;
  country: string;
  city: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  working_hours: string | null;
  job_type: string;
  language_requirement: string | null;
  required_documents: string[] | null;
  description: string | null;
  employer_contact: string | null;
  is_verified: boolean;
  image_url: string | null;
}

const lockMessages: Record<string, string> = {
  en: 'This feature will unlock after your visa is approved.',
  uz: 'Bu funksiya vizangiz tasdiqlanganidan keyin ochiladi.',
  ru: 'Эта функция станет доступна после одобрения визы.',
};

export default function StudentJobs() {
  const { language, selectedCountry } = useApp();
  const { user } = useAuth();
  const journey = useStudentJourney(language);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!journey.isJobsUnlocked || !user) return;

    async function fetchJobs() {
      let query = supabase.from('jobs').select('*').eq('is_active', true);

      const countryFilter = journey.acceptedUniversity?.country || selectedCountry?.name;
      if (countryFilter) {
        query = query.eq('country', countryFilter);
      }
      if (journey.acceptedUniversity?.city) {
        query = query.eq('city', journey.acceptedUniversity.city);
      }

      const { data } = await query.order('is_verified', { ascending: false });
      setJobs((data as Job[]) || []);

      const { data: saved } = await supabase
        .from('saved_jobs')
        .select('job_id')
        .eq('user_id', user.id);
      setSavedJobIds(new Set((saved || []).map(s => s.job_id)));

      setLoading(false);
    }

    fetchJobs();
  }, [journey.isJobsUnlocked, journey.acceptedUniversity, selectedCountry?.name, user]);

  if (journey.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!journey.isJobsUnlocked) {
    const placeholderContent = (
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold">Job Board</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-card border rounded-2xl p-5 h-48">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded-full w-20" />
                <div className="h-6 bg-muted rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    return (
      <LockedFeatureBlur
        title={language === 'uz' ? 'Ish qidirish' : language === 'ru' ? 'Поиск работы' : 'Job Board'}
        description={lockMessages[language] || lockMessages.en}
        featureKey="jobs"
      >
        {placeholderContent}
      </LockedFeatureBlur>
    );
  }

  const toggleSave = async (jobId: string) => {
    if (!user) return;
    if (savedJobIds.has(jobId)) {
      await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);
      setSavedJobIds(prev => { const n = new Set(prev); n.delete(jobId); return n; });
      toast.success(language === 'uz' ? 'Olib tashlandi' : 'Removed');
    } else {
      await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: jobId });
      setSavedJobIds(prev => new Set(prev).add(jobId));
      toast.success(language === 'uz' ? 'Saqlandi' : 'Saved');
    }
  };

  const filtered = jobs.filter(j => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && j.job_type !== typeFilter) return false;
    return true;
  });

  const labels = {
    en: { title: 'Jobs Near Your University', search: 'Search jobs...', all: 'All Types', partTime: 'Part-time', weekend: 'Weekend', fullTime: 'Full-time', salary: 'Salary', hours: 'Hours', contact: 'Contact Employer', apply: 'Apply', verified: 'UniPath Verified', lang: 'Language', docs: 'Required Documents', noJobs: 'No jobs found', saved: 'Saved' },
    uz: { title: 'Universitetingiz yaqinidagi ishlar', search: 'Ish qidirish...', all: 'Barcha turlar', partTime: 'Yarim stavka', weekend: 'Dam olish kuni', fullTime: 'To\'liq stavka', salary: 'Maosh', hours: 'Soatlar', contact: 'Ish beruvchiga bog\'lanish', apply: 'Ariza berish', verified: 'UniPath Tasdiqlangan', lang: 'Til', docs: 'Kerakli hujjatlar', noJobs: 'Ish topilmadi', saved: 'Saqlangan' },
    ru: { title: 'Работа рядом с вашим университетом', search: 'Поиск работы...', all: 'Все типы', partTime: 'Частичная занятость', weekend: 'Выходные', fullTime: 'Полная занятость', salary: 'Зарплата', hours: 'Часы', contact: 'Связаться с работодателем', apply: 'Подать заявку', verified: 'Проверено UniPath', lang: 'Язык', docs: 'Необходимые документы', noJobs: 'Работа не найдена', saved: 'Сохранено' },
  };
  const l = labels[language as keyof typeof labels] || labels.en;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{l.title}</h1>
        {journey.acceptedUniversity && (
          <p className="text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {journey.acceptedUniversity.city}, {journey.acceptedUniversity.country}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={l.search} className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{l.all}</SelectItem>
            <SelectItem value="part-time">{l.partTime}</SelectItem>
            <SelectItem value="weekend">{l.weekend}</SelectItem>
            <SelectItem value="full-time">{l.fullTime}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{l.noJobs}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(job => (
            <div
              key={job.id}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
            >
              {/* Photo placeholder */}
              <div className="h-32 bg-muted flex items-center justify-center relative flex-shrink-0">
                {job.image_url ? (
                  <img src={job.image_url} alt={job.title} className="w-full h-full object-cover" />
                ) : (
                  <Briefcase className="w-10 h-10 text-muted-foreground/40" />
                )}
                <button
                  onClick={e => { e.stopPropagation(); toggleSave(job.id); }}
                  className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                >
                  <Heart className={`w-4 h-4 ${savedJobIds.has(job.id) ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground line-clamp-1">{job.title}</h3>
                      {job.is_verified && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <BadgeCheck className="w-3 h-3" /> {l.verified}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> {job.company_name}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" /> {job.city}, {job.country}
                    </p>
                  </div>
                </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {(job.salary_min || job.salary_max) && (
                  <Badge variant="outline" className="gap-1">
                    <DollarSign className="w-3 h-3" />
                    {job.salary_min && job.salary_max
                      ? `${job.salary_min}-${job.salary_max} ${job.currency}`
                      : `${job.salary_min || job.salary_max} ${job.currency}`}
                  </Badge>
                )}
                {job.working_hours && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" /> {job.working_hours}
                  </Badge>
                )}
                <Badge variant="outline">{job.job_type}</Badge>
              </div>

              {/* Expanded details */}
              {selectedJob?.id === job.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {job.description && (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{job.description}</p>
                  )}
                  {job.language_requirement && (
                    <div className="flex items-center gap-2 text-sm">
                      <Languages className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{l.lang}:</span>
                      <span className="text-foreground">{job.language_requirement}</span>
                    </div>
                  )}
                  {job.required_documents && job.required_documents.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground flex items-center gap-1 mb-1">
                        <FileText className="w-4 h-4" /> {l.docs}:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {job.required_documents.map((d, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.employer_contact && (
                    <Button size="sm" className="w-full mt-2" onClick={(e) => e.stopPropagation()}>
                      {l.contact}
                    </Button>
                  )}
                </div>
              )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
