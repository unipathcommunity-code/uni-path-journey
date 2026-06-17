import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Award,
  ArrowRightLeft,
  Calendar,
  ExternalLink,
  Users,
  Search,
  Coins,
  Loader2,
  X,
  Filter,
} from 'lucide-react';
import GrantDetailModal from '@/components/GrantDetailModal';
import { getCompetitionLevel } from '@/lib/grantUtils';

interface Grant {
  id: string;
  country_id: string | null;
  university_id: string | null;
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

const GRANT_TYPES = [
  { value: 'bachelor', label: 'Bakalavr', labelRu: 'Бакалавриат', labelEn: 'Bachelor', icon: '🎓' },
  { value: 'master', label: 'Magistratura', labelRu: 'Магистратура', labelEn: 'Master', icon: '📚' },
  { value: 'phd', label: 'Doktorantura', labelRu: 'Докторантура', labelEn: 'PhD', icon: '🔬' },
  { value: 'transfer', label: 'Transfer', labelRu: 'Перевод', labelEn: 'Transfer', icon: '🔄' },
];

const COVERAGE_TYPES = [
  { value: 'full', label: "To'liq grant", labelRu: 'Полный грант', labelEn: 'Full Scholarship' },
  { value: 'partial', label: 'Qisman grant', labelRu: 'Частичный грант', labelEn: 'Partial Scholarship' },
  { value: 'tuition_only', label: "O'qish haqi", labelRu: 'Оплата обучения', labelEn: 'Tuition Only' },
  { value: 'living_expenses', label: 'Yashash xarajati', labelRu: 'Расходы на жизнь', labelEn: 'Living Expenses' },
];

export default function StudentGrants() {
  const { language, selectedCountry } = useApp();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterCoverage, setFilterCoverage] = useState<string>('');
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);

  useEffect(() => {
    fetchGrants();
  }, [selectedCountry]);

  const fetchGrants = async () => {
    setLoading(true);

    const selectedCountryId =
      selectedCountry?.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCountry.id)
        ? selectedCountry.id
        : null;

    const [grantsRes, countriesRes, universitiesRes] = await Promise.all([
      supabase.from('grants').select('*').eq('is_active', true).order('display_order'),
      supabase.from('countries').select('id, name, flag').eq('is_active', true),
      supabase.from('universities_public').select('id, name').eq('is_active', true),
    ]);

    if (grantsRes.error) {
      setGrants([]);
      setLoading(false);
      return;
    }

    const countriesById = new Map(
      (countriesRes.data || []).map((c) => [c.id, { name: c.name, flag: c.flag }])
    );
    const universitiesById = new Map(
      (universitiesRes.data || []).map((u) => [u.id, { name: u.name! }])
    );

    let list = (grantsRes.data || []) as Grant[];

    if (selectedCountryId) {
      list = list.filter((g) => g.country_id === selectedCountryId || g.country_id === null);
    }

    const resolved = list.map((g) => ({
      ...g,
      country: g.country_id ? countriesById.get(g.country_id) : undefined,
      university: g.university_id ? universitiesById.get(g.university_id) : undefined,
    }));

    setGrants(resolved);
    setLoading(false);
  };

  const loc = (en: string | null, uz: string | null, ru: string | null) => {
    if (language === 'uz' && uz) return uz;
    if (language === 'ru' && ru) return ru;
    return en || '';
  };

  const hasActiveFilters = !!searchQuery || !!filterType || !!filterCoverage;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterCoverage('');
  };

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() < Date.now();
  };

  const getDaysLeft = (dateStr: string | null) => {
    if (!dateStr) return null;
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  };

  const filteredGrants = useMemo(() => {
    return grants
      .filter((g) => !isExpired(g.application_deadline)) // hide expired
      .filter((g) => {
        const name = loc(g.name, g.name_uz, g.name_ru);
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !filterType || g.grant_type === filterType;
        const matchesCoverage = !filterCoverage || g.coverage_type === filterCoverage;
        return matchesSearch && matchesType && matchesCoverage;
      });
  }, [grants, searchQuery, filterType, filterCoverage, language]);

  const txt = {
    title: language === 'uz' ? 'Grant dasturlari' : language === 'ru' ? 'Грантовые программы' : 'Grant Programs',
    subtitle: language === 'uz'
      ? selectedCountry
        ? `${selectedCountry.name} uchun mavjud grantlar`
        : 'Barcha mavjud grant dasturlari'
      : language === 'ru'
      ? selectedCountry
        ? `Доступные гранты для ${selectedCountry.name}`
        : 'Все доступные грантовые программы'
      : selectedCountry
      ? `Available grants for ${selectedCountry.name}`
      : 'All available grant programs',
    search: language === 'uz' ? 'Grant nomi bo\'yicha qidirish...' : language === 'ru' ? 'Поиск по названию...' : 'Search by name...',
    all: language === 'uz' ? 'Barchasi' : language === 'ru' ? 'Все' : 'All',
    apply: language === 'uz' ? 'Ariza berish' : language === 'ru' ? 'Подать заявку' : 'Apply',
    spots: language === 'uz' ? "o'rin" : language === 'ru' ? 'мест' : 'spots',
    details: language === 'uz' ? 'Batafsil' : language === 'ru' ? 'Подробнее' : 'Details',
    clearFilters: language === 'uz' ? 'Filtrlarni tozalash' : language === 'ru' ? 'Сбросить фильтры' : 'Clear filters',
    noResults: language === 'uz' ? 'Natija topilmadi' : language === 'ru' ? 'Результатов не найдено' : 'No results found',
    noResultsHint: language === 'uz'
      ? 'Filtrlarni o\'zgartirib ko\'ring'
      : language === 'ru'
      ? 'Попробуйте изменить фильтры'
      : 'Try adjusting your filters',
    noGrants: language === 'uz'
      ? 'Hozircha grant dasturlari mavjud emas'
      : language === 'ru'
      ? 'Грантовых программ пока нет'
      : 'No grant programs available yet',
    daysLeft: language === 'uz' ? 'kun' : language === 'ru' ? 'дн.' : 'days',
    grantType: language === 'uz' ? 'Grant turi' : language === 'ru' ? 'Тип гранта' : 'Grant type',
    coverage: language === 'uz' ? 'Qoplash' : language === 'ru' ? 'Покрытие' : 'Coverage',
    found: language === 'uz' ? 'ta grant topildi' : language === 'ru' ? 'грантов найдено' : 'grants found',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <Award className="w-7 h-7" />
          <h1 className="text-2xl font-bold">{txt.title}</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm">{txt.subtitle}</p>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={txt.search}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Type chips */}
          {GRANT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(filterType === type.value ? '' : type.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filterType === type.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              <span>{type.icon}</span>
              {language === 'uz' ? type.label : language === 'ru' ? type.labelRu : type.labelEn}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterCoverage || 'all'} onValueChange={(v) => setFilterCoverage(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder={txt.coverage} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{txt.all}</SelectItem>
              {COVERAGE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {language === 'uz' ? type.label : language === 'ru' ? type.labelRu : type.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
              <X className="w-3.5 h-3.5" />
              {txt.clearFilters}
            </Button>
          )}

          <span className="ml-auto text-sm text-muted-foreground">
            {filteredGrants.length} {txt.found}
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredGrants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Award className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {hasActiveFilters ? txt.noResults : txt.noGrants}
          </h3>
          <p className="text-muted-foreground text-sm">
            {hasActiveFilters ? txt.noResultsHint : ''}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 gap-1.5">
              <X className="w-3.5 h-3.5" />
              {txt.clearFilters}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredGrants.map((grant) => {
            const name = loc(grant.name, grant.name_uz, grant.name_ru);
            const description = loc(grant.description, grant.description_uz, grant.description_ru);
            const coverageInfo = COVERAGE_TYPES.find((t) => t.value === grant.coverage_type);
            const typeInfo = GRANT_TYPES.find((t) => t.value === grant.grant_type);
            const competition = getCompetitionLevel(grant.success_rate);
            const daysLeft = getDaysLeft(grant.application_deadline);

            return (
              <div
                key={grant.id}
                className="group bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer flex flex-col"
                onClick={() => setSelectedGrant(grant)}
              >
                {/* Top row: type icon + name + country */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">
                    {typeInfo?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {grant.country && (
                        <span>{grant.country.flag} {grant.country.name}</span>
                      )}
                      {grant.university && (
                        <span className="truncate">• {grant.university.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coverage amount highlight */}
                {grant.coverage_amount && (
                  <div className="flex items-center gap-1.5 text-sm text-primary font-medium mb-2">
                    <Coins className="w-3.5 h-3.5" />
                    {grant.coverage_amount}
                  </div>
                )}

                {/* Description */}
                {description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
                )}

                {/* Transfer badge */}
                {grant.is_transfer_program && (
                  <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 rounded-md px-2.5 py-1.5 mb-3 w-fit">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    {grant.transfer_from_year && `${grant.transfer_from_year}-`}
                    {language === 'uz' ? 'kursdan transfer' : language === 'ru' ? 'курс перевод' : 'year transfer'}
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge
                    variant={grant.coverage_type === 'full' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {language === 'uz' ? coverageInfo?.label : language === 'ru' ? coverageInfo?.labelRu : coverageInfo?.labelEn}
                  </Badge>
                  {competition && (
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${competition.bgColor} ${competition.color}`}>
                      {language === 'uz' ? competition.labelUz : language === 'ru' ? competition.labelRu : competition.labelEn}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  {daysLeft !== null && (
                    <span className={`flex items-center gap-1 ${daysLeft <= 30 ? 'text-destructive font-medium' : ''}`}>
                      <Calendar className="w-3 h-3" />
                      {daysLeft} {txt.daysLeft}
                    </span>
                  )}
                  {grant.spots_available && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {grant.spots_available} {txt.spots}
                    </span>
                  )}
                  {grant.application_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 ml-auto text-xs h-7 text-primary hover:text-primary"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={grant.application_url} target="_blank" rel="noopener noreferrer">
                        {txt.apply}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <GrantDetailModal
        grant={selectedGrant}
        open={!!selectedGrant}
        onOpenChange={(open) => !open && setSelectedGrant(null)}
      />
    </div>
  );
}
