import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { useBusinessMode } from '@/hooks/useBusinessMode';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ApplicationModal } from '@/components/ApplicationModal';
import { UniversityDetailModal, type UniversityDetail } from '@/components/UniversityDetailModal';
import { supabase } from '@/integrations/supabase/client';
import { UniversityMap } from '@/components/UniversityMap';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  GraduationCap,
  DollarSign,
  Award,
  Calendar,
  Users,
  ChevronLeft,
  Heart,
  ExternalLink,
  Star,
  Loader2,
  User,
} from 'lucide-react';

interface DbUniversity {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  country: string;
  city: string | null;
  description: string | null;
  description_uz: string | null;
  description_ru: string | null;
  images: string[] | null;
  ranking: number | null;
  tuition_min: number | null;
  tuition_max: number | null;
  currency: string | null;
  scholarship_available: boolean | null;
  intake_spring: boolean | null;
  intake_fall: boolean | null;
  programs: string[] | null;
  students_total: number | null;
  students_international: number | null;
  students_uzbek: number | null;
  students_local: number | null;
  website: string | null;
  credit_cost: number;
  application_fee: number | null;
  requirements: {
    documents?: string[];
    certificates?: string[];
    languageTests?: string[];
    minGPA?: number;
  } | null;
}

const countryFlags: Record<string, string> = {
  'South Korea': '🇰🇷',
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'USA': '🇺🇸',
  'Germany': '🇩🇪',
  'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿',
  'Malaysia': '🇲🇾',
  'UAE': '🇦🇪',
  'Georgia': '🇬🇪',
  'Hungary': '🇭🇺',
  'Russia': '🇷🇺',
  'UK': '🇬🇧',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
  'Spain': '🇪🇸',
  'Netherlands': '🇳🇱',
};

const defaultUniversityImages: Record<string, string[]> = {
  'South Korea': [
    'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400',
    'https://images.unsplash.com/photo-1546874177-9e664107314e?w=400',
    'https://images.unsplash.com/photo-1583167618360-7e3b5e1c4c76?w=400',
    'https://images.unsplash.com/photo-1578037571214-25e07ed4a925?w=400',
  ],
  'China': [
    'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400',
    'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
    'https://images.unsplash.com/photo-1474181628612-e6a1e5be1d58?w=400',
  ],
  'Japan': [
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400',
    'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400',
  ],
  'USA': [
    'https://images.unsplash.com/photo-1562774053-701939374585?w=400',
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=400',
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400',
    'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400',
  ],
  'Germany': [
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400',
    'https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?w=400',
    'https://images.unsplash.com/photo-1551410224-699683e15636?w=400',
  ],
  'UK': [
    'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=400',
    'https://images.unsplash.com/photo-1548793978-65bdcae3b6f0?w=400',
    'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=400',
  ],
  'Canada': [
    'https://images.unsplash.com/photo-1569388330292-79cc2a8e22d2?w=400',
    'https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=400',
  ],
  'Australia': [
    'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400',
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400',
  ],
  'Poland': [
    'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=400',
    'https://images.unsplash.com/photo-1607427293702-036933bbf746?w=400',
  ],
  'Malaysia': [
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400',
    'https://images.unsplash.com/photo-1508062878650-88b52897f298?w=400',
  ],
  'UAE': [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
    'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400',
  ],
  'Czech Republic': [
    'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400',
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=400',
  ],
  'Hungary': [
    'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=400',
    'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=400',
  ],
  'Georgia': [
    'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400',
  ],
  'Russia': [
    'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400',
    'https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=400',
  ],
  'Italy': [
    'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400',
    'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400',
  ],
  'France': [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400',
  ],
  'Spain': [
    'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400',
    'https://images.unsplash.com/photo-1509619465718-da42ff05e6c4?w=400',
  ],
  'Netherlands': [
    'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
  ],
};

// Get a varied image per university based on index
function getUniversityImage(uni: DbUniversity, index: number): string {
  if (uni.images?.[0]) return uni.images[0];
  const countryImages = defaultUniversityImages[uni.country];
  if (countryImages && countryImages.length > 0) {
    return countryImages[index % countryImages.length];
  }
  return 'https://images.unsplash.com/photo-1562774053-701939374585?w=400';
}

export default function UniversitySearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, selectedCountry } = useApp();
  const t = useTranslation(language);
  const { isPaid } = useBusinessMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityDetail | null>(null);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [universities, setUniversities] = useState<DbUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('ranking');
  const [profileMissingContact, setProfileMissingContact] = useState(false);

  // Check if profile has contact info
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('phone, telegram_username')
        .eq('user_id', user.id)
        .maybeSingle();
      setProfileMissingContact(!(data as any)?.phone?.trim() || !(data as any)?.telegram_username?.trim());
    })();
  }, [user]);
  
  // Filter states - country is LOCKED to selected country for students
  const [budgetMax, setBudgetMax] = useState<string>('');
  const [scholarshipFilter, setScholarshipFilter] = useState<string>('');
  const [intakeFilter, setIntakeFilter] = useState<string>('');
  
  // Students can only see universities from their selected country
  const studentSelectedCountry = selectedCountry?.name || '';

  useEffect(() => {
    const fetchUniversities = async () => {
      setLoading(true);
      
      let query = (supabase as any)
        .from('universities')
        .select('*')
        .eq('is_active', true);
      
      // If student has selected a country, filter by that country
      if (studentSelectedCountry) {
        query = query.eq('country', studentSelectedCountry);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        // Filter out null entries and cast to DbUniversity
        setUniversities(data.filter((u: any) => u.id !== null) as unknown as DbUniversity[]);
      }
      setLoading(false);
    };
    
    fetchUniversities();
  }, [studentSelectedCountry]);

  const filteredUniversities = useMemo(() => {
    let result = [...universities];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(uni => 
        uni.name.toLowerCase().includes(query) ||
        uni.name_uz?.toLowerCase().includes(query) ||
        uni.name_ru?.toLowerCase().includes(query) ||
        uni.country.toLowerCase().includes(query) ||
        uni.city?.toLowerCase().includes(query) ||
        uni.programs?.some(p => p.toLowerCase().includes(query))
      );
    }
    
    // Budget filter
    if (budgetMax && !isNaN(Number(budgetMax))) {
      const maxBudget = Number(budgetMax);
      result = result.filter(uni => !uni.tuition_min || uni.tuition_min <= maxBudget);
    }
    
    // Scholarship filter
    if (scholarshipFilter === 'yes') {
      result = result.filter(uni => uni.scholarship_available);
    }
    
    // Intake filter
    if (intakeFilter === 'spring') {
      result = result.filter(uni => uni.intake_spring);
    } else if (intakeFilter === 'fall') {
      result = result.filter(uni => uni.intake_fall);
    }
    
    // Sort
    if (sortBy === 'ranking') {
      result.sort((a, b) => (a.ranking || 9999) - (b.ranking || 9999));
    } else if (sortBy === 'tuition') {
      result.sort((a, b) => (a.tuition_min || 0) - (b.tuition_min || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  }, [universities, searchQuery, budgetMax, scholarshipFilter, intakeFilter, sortBy]);


  const convertToUniversityDetail = (uni: DbUniversity): UniversityDetail => {
    const name = language === 'uz' && uni.name_uz ? uni.name_uz : 
                 language === 'ru' && uni.name_ru ? uni.name_ru : uni.name;
    
    const description = language === 'uz' && uni.description_uz ? uni.description_uz : 
                        language === 'ru' && uni.description_ru ? uni.description_ru : uni.description;
    
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Spring: applications open ~Oct-Feb, intake starts ~Mar
    // Fall: applications open ~Apr-Aug, intake starts ~Sep
    const isSpringOpen = currentMonth >= 9 || currentMonth <= 2; // Oct-Mar
    const isFallOpen = currentMonth >= 3 && currentMonth <= 8; // Apr-Sep
    
    const upcomingLabel = language === 'uz' ? 'tez kunda' : language === 'ru' ? 'скоро' : 'upcoming';
    const openLabel = language === 'uz' ? 'ochiq' : language === 'ru' ? 'открыт' : 'open';
    
    const intakes: string[] = [];
    if (uni.intake_spring) {
      // If spring is open (Oct-Mar), spring is for: Oct-Dec → next year, Jan-Mar → this year
      const springYear = isSpringOpen 
        ? (currentMonth >= 9 ? currentYear + 1 : currentYear)
        : (currentMonth <= 8 ? currentYear + 1 : currentYear);
      const springStatus = isSpringOpen ? openLabel : upcomingLabel;
      intakes.push(`Spring ${springYear} (${springStatus})`);
    }
    if (uni.intake_fall) {
      // Fall intake for current year if we haven't passed Sep, otherwise next year
      const fallYear = currentMonth <= 8 ? currentYear : currentYear + 1;
      const fallStatus = isFallOpen ? openLabel : upcomingLabel;
      intakes.push(`Fall ${fallYear} (${fallStatus})`);
    }
    
    const tuition = uni.tuition_min && uni.tuition_max 
      ? `$${uni.tuition_min.toLocaleString()} - $${uni.tuition_max.toLocaleString()}`
      : uni.tuition_min 
        ? `$${uni.tuition_min.toLocaleString()}+`
        : 'Contact for info';
    
    return {
      id: uni.id,
      name,
      location: uni.city ? `${uni.city}, ${uni.country}` : uni.country,
      flag: countryFlags[uni.country] || '🌍',
      ranking: uni.ranking || undefined,
      tuition,
      scholarship: uni.scholarship_available || false,
      intake: intakes.length > 0 ? intakes : ['Contact for info'],
      programs: uni.programs || [],
      students: uni.students_total || undefined,
      intlStudents: uni.students_international || undefined,
      localStudents: uni.students_local || undefined,
      uzbekStudents: uni.students_uzbek || undefined,
      rating: 4.5,
      image: getUniversityImage(uni, 0),
      description: description || '',
      founded: undefined,
      acceptanceRate: undefined,
      languageOfInstruction: ['English'],
      applicationDeadline: 'Contact for info',
      applicationFee: 'Contact for info',
      requirements: {
        documents: uni.requirements?.documents || ['Passport Copy', 'High School Diploma', 'Transcript'],
        certificates: uni.requirements?.certificates || ['High School Certificate'],
        languageTests: uni.requirements?.languageTests || ['IELTS', 'TOEFL'],
        minGPA: uni.requirements?.minGPA || 2.5,
      },
    };
  };

  const handleLearnMore = (uni: DbUniversity) => {
    setSelectedUniversity(convertToUniversityDetail(uni));
    setDetailModalOpen(true);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleApply = (uni: DbUniversity) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profileMissingContact) {
      toast.error(
        language === 'uz' ? 'Iltimos, avval profilingizni to\'ldiring (telefon va Telegram)'
        : language === 'ru' ? 'Пожалуйста, заполните профиль (телефон и Telegram)'
        : 'Please complete your profile (phone & Telegram) to continue.'
      );
      navigate('/student/profile');
      return;
    }
    setSelectedUniversity(convertToUniversityDetail(uni));
    setApplicationModalOpen(true);
  };

  const clearFilters = () => {
    setBudgetMax('');
    setScholarshipFilter('');
    setIntakeFilter('');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link
              to={user ? "/student/dashboard" : "/"}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Logo size="sm" />
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container px-4 py-6">
        {/* Search Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t.searchUniversities}
          </h1>
          <p className="text-muted-foreground">
            {language === 'uz' ? "Akademik sayohatingiz uchun ideal universitetni toping" :
             language === 'ru' ? "Найдите идеальный университет для вашего академического пути" :
             "Find the perfect university for your academic journey"}
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {t.filters}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-card rounded-xl border border-border animate-slide-up">
            {/* Show selected country info */}
            {studentSelectedCountry && (
              <div className="col-span-2 md:col-span-4 bg-primary/10 rounded-lg p-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">
                  {language === 'uz' ? 'Tanlangan davlat: ' : language === 'ru' ? 'Выбранная страна: ' : 'Selected country: '}
                  <strong>{studentSelectedCountry}</strong>
                </span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t.budget} (USD)
              </label>
              <Input
                type="number"
                placeholder={language === 'uz' ? "Max summa" : language === 'ru' ? "Макс. сумма" : "Max amount"}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t.scholarship}
              </label>
              <Select value={scholarshipFilter || 'all'} onValueChange={(val) => setScholarshipFilter(val === 'all' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'uz' ? 'Barchasi' : language === 'ru' ? 'Все' : 'Any'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'uz' ? 'Barchasi' : language === 'ru' ? 'Все' : 'Any'}</SelectItem>
                  <SelectItem value="yes">{language === 'uz' ? 'Bor' : language === 'ru' ? 'Есть' : 'Available'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t.intake}
              </label>
              <Select value={intakeFilter || 'all'} onValueChange={(val) => setIntakeFilter(val === 'all' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'uz' ? 'Barchasi' : language === 'ru' ? 'Все' : 'Any'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'uz' ? 'Barchasi' : language === 'ru' ? 'Все' : 'Any'}</SelectItem>
                  <SelectItem value="spring">{`Spring ${new Date().getFullYear()}`}</SelectItem>
                  <SelectItem value="fall">{`Fall ${new Date().getFullYear()}`}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="ghost" onClick={clearFilters} className="w-full">
                {language === 'uz' ? 'Tozalash' : language === 'ru' ? 'Очистить' : 'Clear'}
              </Button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">
            {language === 'uz' ? 'Ko\'rsatilmoqda' : language === 'ru' ? 'Показано' : 'Showing'}{' '}
            <span className="font-medium text-foreground">{filteredUniversities.length}</span>{' '}
            {language === 'uz' ? 'universitetlar' : language === 'ru' ? 'университетов' : 'universities'}
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ranking">{language === 'uz' ? 'Reyting' : language === 'ru' ? 'По рейтингу' : 'By Ranking'}</SelectItem>
              <SelectItem value="tuition">{language === 'uz' ? 'Narx' : language === 'ru' ? 'По цене' : 'By Tuition'}</SelectItem>
              <SelectItem value="name">{language === 'uz' ? 'Nomi' : language === 'ru' ? 'По названию' : 'By Name'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Map View - only render when there are universities WITH valid coordinates */}
        {(() => {
          if (loading || filteredUniversities.length === 0) return null;
          const mapUnis = filteredUniversities
            .map(u => ({
              id: u.id,
              name: language === 'uz' && u.name_uz ? u.name_uz : language === 'ru' && u.name_ru ? u.name_ru : u.name,
              city: u.city,
              country: u.country,
              latitude: (u as any).latitude ?? null,
              longitude: (u as any).longitude ?? null,
              ranking: u.ranking,
            }))
            .filter(u => u.latitude != null && u.longitude != null);
          if (mapUnis.length === 0) return null;
          return (
            <div className="mb-6 h-[300px] md:h-[400px]">
              <UniversityMap
                universities={mapUnis}
                onSelect={(id) => {
                  const uni = filteredUniversities.find(u => u.id === id);
                  if (uni) handleLearnMore(uni);
                }}
                className="h-full"
              />
            </div>
          );
        })()}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUniversities.length === 0 && (
          <div className="text-center py-20">
            <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {language === 'uz' ? 'Universitetlar topilmadi' : language === 'ru' ? 'Университеты не найдены' : 'No universities found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'uz' ? "Qidiruv so'rovingizni o'zgartiring" : language === 'ru' ? 'Попробуйте изменить параметры поиска' : 'Try adjusting your search or filters'}
            </p>
            <Button variant="outline" onClick={clearFilters}>
              {language === 'uz' ? 'Filtrlarni tozalash' : language === 'ru' ? 'Очистить фильтры' : 'Clear Filters'}
            </Button>
          </div>
        )}

        {/* University Cards */}
        {!loading && (
          <div className="grid gap-4">
            {filteredUniversities.map((uni, index) => {
              const displayName = language === 'uz' && uni.name_uz ? uni.name_uz : 
                                  language === 'ru' && uni.name_ru ? uni.name_ru : uni.name;
              const location = uni.city ? `${uni.city}, ${uni.country}` : uni.country;
              const tuition = uni.tuition_min && uni.tuition_max 
                ? `$${uni.tuition_min.toLocaleString()} - $${uni.tuition_max.toLocaleString()}`
                : uni.tuition_min 
                  ? `$${uni.tuition_min.toLocaleString()}+`
                  : language === 'uz' ? "Ma'lumot yo'q" : language === 'ru' ? 'Нет данных' : 'Contact for info';
              const now = new Date();
              const currentMonth = now.getMonth();
              const currentYear = now.getFullYear();
              const isSpringOpen = currentMonth >= 0 && currentMonth <= 5;
              const isFallOpen = currentMonth >= 5 && currentMonth <= 11;
              const intakes: string[] = [];
              if (uni.intake_spring) intakes.push(isSpringOpen ? `Spring ${currentYear}` : `Spring ${currentYear + 1}`);
              if (uni.intake_fall) intakes.push(isFallOpen ? `Fall ${currentYear}` : `Fall ${currentYear + 1}`);
              const image = getUniversityImage(uni, index);
              
              return (
                <div
                  key={uni.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden card-hover animate-slide-up"
                  style={{ animationDelay: `${Math.min(index, 5) * 100}ms` }}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-64 h-48 md:h-auto relative">
                      <img
                        src={image}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=400';
                        }}
                      />
                      <button
                        onClick={() => toggleFavorite(uni.id)}
                        className="absolute top-3 right-3 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center transition-colors hover:bg-background"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favorites.includes(uni.id)
                              ? 'fill-destructive text-destructive'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-2xl">{countryFlags[uni.country] || '🌍'}</span>
                            {uni.ranking && (
                              <Badge variant="secondary" className="text-xs">
                                #{uni.ranking} {language === 'uz' ? 'Dunyo reytingi' : language === 'ru' ? 'Мировой рейтинг' : 'World Ranking'}
                              </Badge>
                            )}
                            {uni.scholarship_available && (
                              <Badge className="bg-primary/10 text-primary border-0 text-xs">
                                <Award className="w-3 h-3 mr-1" />
                                {language === 'uz' ? 'Grant' : language === 'ru' ? 'Стипендия' : 'Scholarship'}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-1">
                            {displayName}
                          </h3>
                          <p className="text-muted-foreground flex items-center gap-1 text-sm">
                            <MapPin className="w-4 h-4" />
                            {location}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> {language === 'uz' ? "Yillik to'lov" : language === 'ru' ? 'Обучение/год' : 'Tuition/Year'}
                          </p>
                          <p className="font-medium text-foreground">{tuition}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3" /> {language === 'uz' ? "Ariza narxi" : language === 'ru' ? 'Стоимость заявки' : 'Application Cost'}
                          </p>
                          <p className="font-medium text-primary">
                            {isPaid
                              ? (uni.application_fee ? `$${uni.application_fee}` : (language === 'uz' ? 'Tarif asosida' : language === 'ru' ? 'По тарифу' : 'Included in plan'))
                              : `${uni.credit_cost} UniCoin`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {language === 'uz' ? 'Qabul' : language === 'ru' ? 'Набор' : 'Intake'}
                          </p>
                          <p className="font-medium text-foreground">
                            {intakes.length > 0 ? intakes.join(' / ') : 'N/A'}
                          </p>
                        </div>
                        {uni.students_total && (
                          <div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" /> {language === 'uz' ? 'Talabalar' : language === 'ru' ? 'Студенты' : 'Students'}
                            </p>
                            <p className="font-medium text-foreground">
                              {uni.students_total.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {uni.students_international && (
                          <div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" /> {language === 'uz' ? 'Xorijlik' : language === 'ru' ? 'Иностранцы' : "Int'l Students"}
                            </p>
                            <p className="font-medium text-foreground">
                              {uni.students_international.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Programs */}
                      {uni.programs && uni.programs.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {uni.programs.slice(0, 5).map((program) => (
                            <Badge key={program} variant="outline" className="text-xs">
                              {program}
                            </Badge>
                          ))}
                          {uni.programs.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{uni.programs.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 mt-4">
                        {profileMissingContact ? (
                          <Button 
                            variant="destructive"
                            className="gap-2"
                            onClick={() => navigate('/student/profile')}
                            title={language === 'uz' ? 'Profilingizni to\'ldiring' : language === 'ru' ? 'Заполните профиль' : 'Please complete your profile to continue'}
                          >
                            <User className="w-4 h-4" />
                            {language === 'uz' ? 'Profilni to\'ldiring' : language === 'ru' ? 'Заполнить профиль' : 'Complete Profile'}
                          </Button>
                        ) : (
                          <Button 
                            className="gap-2"
                            onClick={() => handleApply(uni)}
                          >
                            {t.apply}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => handleLearnMore(uni)}
                        >
                          {t.learnMore}
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}


        {/* Partner Promotions */}
        <div className="mt-12 space-y-4">
          <h2 className="text-xl font-bold text-foreground text-center mb-6">
            {language === 'uz' ? 'Bizning hamkorlar' : language === 'ru' ? 'Наши партнёры' : 'Our Partners'}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* UniTour */}
            <a
              href="https://unitour.me"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-indigo-500/10 rounded-2xl border border-blue-500/20 p-6 hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    UT
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">UniTour</h3>
                    <p className="text-sm text-muted-foreground">unitour.me</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {language === 'uz' 
                    ? "🌍 Universitetlarga virtual turlar — kampusni uydan turib ko'ring! Dunyo universitetlarini 360° formatda kashf eting."
                    : language === 'ru'
                    ? '🌍 Виртуальные туры по университетам — осмотрите кампус не выходя из дома! Откройте университеты мира в формате 360°.'
                    : '🌍 Virtual university tours — explore campuses from home! Discover world universities in 360° format.'}
                </p>
                <Badge className="mt-3 bg-blue-500/10 text-blue-600 border-blue-500/20">
                  {language === 'uz' ? '🎥 Virtual turlar' : language === 'ru' ? '🎥 Виртуальные туры' : '🎥 Virtual Tours'}
                </Badge>
              </div>
            </a>

            {/* UniTech */}
            <a
              href="https://unitechs.me"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-gradient-to-br from-emerald-500/10 via-green-600/5 to-teal-500/10 rounded-2xl border border-emerald-500/20 p-6 hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    UT
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">UniTech</h3>
                    <p className="text-sm text-muted-foreground">unitechs.me</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {language === 'uz' 
                    ? "💡 Ta'lim texnologiyalari — zamonaviy o'quv vositalari va platformalar. Raqamli ta'limda ilg'or yechimlar."
                    : language === 'ru'
                    ? '💡 Образовательные технологии — современные учебные инструменты и платформы. Передовые решения в цифровом образовании.'
                    : '💡 EdTech solutions — modern learning tools and platforms. Advanced solutions in digital education.'}
                </p>
                <Badge className="mt-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  {language === 'uz' ? '🚀 EdTech platforma' : language === 'ru' ? '🚀 EdTech платформа' : '🚀 EdTech Platform'}
                </Badge>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <ApplicationModal
        university={selectedUniversity}
        open={applicationModalOpen}
        onOpenChange={setApplicationModalOpen}
      />

      {/* University Detail Modal */}
      <UniversityDetailModal
        university={selectedUniversity}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onApply={() => {
          // “Apply now” from the details modal should open the application modal
          if (!selectedUniversity) return;
          if (!user) {
            navigate('/auth');
            return;
          }
          setApplicationModalOpen(true);
        }}
      />
    </div>
  );
}
