import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import {
  Search,
  GraduationCap,
  FileText,
  Plane,
  User,
  Award,
  Briefcase,
  Building,
  Home,
  X,
  ArrowRight,
  MapPin,
  Loader2,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'university' | 'page';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  href: string;
}

const pageLinks = {
  en: [
    { title: 'Dashboard', subtitle: 'Overview & stats', icon: Home, href: '/student/dashboard', keywords: 'dashboard home overview' },
    { title: 'My Applications', subtitle: 'Track your applications', icon: FileText, href: '/student/applications', keywords: 'applications apply status' },
    { title: 'Grants & Scholarships', subtitle: 'Find financial aid', icon: Award, href: '/student/grants', keywords: 'grants scholarships financial aid money' },
    { title: 'Documents', subtitle: 'Upload & manage docs', icon: FileText, href: '/student/documents', keywords: 'documents upload passport transcript' },
    { title: 'Visa', subtitle: 'Track visa progress', icon: Plane, href: '/student/visa', keywords: 'visa embassy appointment' },
    { title: 'Jobs', subtitle: 'Find part-time jobs', icon: Briefcase, href: '/student/jobs', keywords: 'jobs work part-time employment' },
    { title: 'Housing', subtitle: 'Find accommodation', icon: Building, href: '/student/housing', keywords: 'housing accommodation dormitory rent' },
    { title: 'Profile', subtitle: 'Edit your profile', icon: User, href: '/student/profile', keywords: 'profile settings account' },
    { title: 'Search Universities', subtitle: 'Browse all universities', icon: GraduationCap, href: '/search', keywords: 'search universities browse find' },
  ],
  uz: [
    { title: 'Bosh sahifa', subtitle: "Umumiy ko'rinish", icon: Home, href: '/student/dashboard', keywords: 'bosh sahifa dashboard' },
    { title: 'Arizalarim', subtitle: 'Arizalarni kuzating', icon: FileText, href: '/student/applications', keywords: 'arizalar ariza topshirish' },
    { title: 'Grantlar', subtitle: 'Moliyaviy yordam toping', icon: Award, href: '/student/grants', keywords: 'grantlar stipendiya moliyaviy' },
    { title: 'Hujjatlar', subtitle: 'Hujjatlarni yuklang', icon: FileText, href: '/student/documents', keywords: 'hujjatlar yuklash pasport' },
    { title: 'Viza', subtitle: 'Viza jarayonini kuzating', icon: Plane, href: '/student/visa', keywords: 'viza elchixona uchrashuv' },
    { title: 'Ishlar', subtitle: 'Ish toping', icon: Briefcase, href: '/student/jobs', keywords: 'ish ishlash yarim stavka' },
    { title: 'Turar joy', subtitle: 'Yashash joyini toping', icon: Building, href: '/student/housing', keywords: 'turar joy yotoqxona ijara' },
    { title: 'Profil', subtitle: 'Profilingizni tahrirlang', icon: User, href: '/student/profile', keywords: 'profil sozlamalar' },
    { title: 'Universitetlar', subtitle: 'Barcha universitetlar', icon: GraduationCap, href: '/search', keywords: 'qidirish universitetlar' },
  ],
  ru: [
    { title: 'Главная', subtitle: 'Обзор и статистика', icon: Home, href: '/student/dashboard', keywords: 'главная дашборд обзор' },
    { title: 'Мои заявки', subtitle: 'Отслеживайте заявки', icon: FileText, href: '/student/applications', keywords: 'заявки подать статус' },
    { title: 'Гранты', subtitle: 'Финансовая помощь', icon: Award, href: '/student/grants', keywords: 'гранты стипендии финансовая помощь' },
    { title: 'Документы', subtitle: 'Загрузка документов', icon: FileText, href: '/student/documents', keywords: 'документы загрузка паспорт' },
    { title: 'Виза', subtitle: 'Прогресс визы', icon: Plane, href: '/student/visa', keywords: 'виза посольство встреча' },
    { title: 'Работа', subtitle: 'Найти работу', icon: Briefcase, href: '/student/jobs', keywords: 'работа подработка' },
    { title: 'Жильё', subtitle: 'Найти жильё', icon: Building, href: '/student/housing', keywords: 'жильё общежитие аренда' },
    { title: 'Профиль', subtitle: 'Редактировать профиль', icon: User, href: '/student/profile', keywords: 'профиль настройки аккаунт' },
    { title: 'Университеты', subtitle: 'Все университеты', icon: GraduationCap, href: '/search', keywords: 'поиск университеты' },
  ],
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const { language } = useApp();
  const t = useTranslation(language);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const pages = pageLinks[language as keyof typeof pageLinks] || pageLinks.en;

  const searchLabel = language === 'uz' ? 'Qidirish...' : language === 'ru' ? 'Поиск...' : 'Search...';

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) {
      setResults(pages.map((p, i) => ({
        id: `page-${i}`,
        type: 'page' as const,
        title: p.title,
        subtitle: p.subtitle,
        icon: p.icon,
        href: p.href,
      })));
      setLoading(false);
      return;
    }

    // Filter pages
    const pageResults: SearchResult[] = pages
      .filter(p =>
        p.title.toLowerCase().includes(trimmed) ||
        p.keywords.toLowerCase().includes(trimmed) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(trimmed))
      )
      .map((p, i) => ({
        id: `page-${i}`,
        type: 'page' as const,
        title: p.title,
        subtitle: p.subtitle,
        icon: p.icon,
        href: p.href,
      }));

    // Search universities
    setLoading(true);
    const nameField = language === 'uz' ? 'name_uz' : language === 'ru' ? 'name_ru' : 'name';
    const { data } = await supabase
      .from('universities')
      .select('id, name, name_uz, name_ru, country, city')
      .eq('is_active', true)
      .or(`name.ilike.%${trimmed}%,name_uz.ilike.%${trimmed}%,name_ru.ilike.%${trimmed}%,country.ilike.%${trimmed}%,city.ilike.%${trimmed}%`)
      .limit(5);

    const uniResults: SearchResult[] = (data || []).map((u) => ({
      id: u.id,
      type: 'university' as const,
      title: (language === 'uz' ? u.name_uz : language === 'ru' ? u.name_ru : u.name) || u.name,
      subtitle: `${u.city || ''}, ${u.country}`.replace(/^, /, ''),
      icon: GraduationCap,
      href: `/search?q=${encodeURIComponent(u.name)}`,
    }));

    setResults([...uniResults, ...pageResults]);
    setLoading(false);
  }, [language, pages]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, open, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex].href);
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.href);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={searchLabel}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-8 w-full md:w-80 bg-muted border-0 rounded-xl h-10 transition-all focus:ring-2 focus:ring-primary/30"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-background rounded"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[400px] overflow-y-auto"
          >
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="py-8 text-center">
                <Search className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === 'uz' ? 'Natija topilmadi' : language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-1">
                {/* Group universities */}
                {results.some(r => r.type === 'university') && (
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {language === 'uz' ? 'Universitetlar' : language === 'ru' ? 'Университеты' : 'Universities'}
                    </p>
                  </div>
                )}
                {results
                  .filter(r => r.type === 'university')
                  .map((result, i) => {
                    const globalIndex = results.indexOf(result);
                    return (
                      <motion.button
                        key={result.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleSelect(result)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          globalIndex === selectedIndex
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/60 text-foreground'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <result.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </motion.button>
                    );
                  })}

                {/* Group pages */}
                {results.some(r => r.type === 'page') && (
                  <div className="px-3 py-2 mt-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {language === 'uz' ? 'Sahifalar' : language === 'ru' ? 'Страницы' : 'Pages'}
                    </p>
                  </div>
                )}
                {results
                  .filter(r => r.type === 'page')
                  .map((result, i) => {
                    const globalIndex = results.indexOf(result);
                    return (
                      <motion.button
                        key={result.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleSelect(result)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          globalIndex === selectedIndex
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/60 text-foreground'
                        }`}
                      >
                        <result.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
                      </motion.button>
                    );
                  })}
              </div>
            )}

            {/* Keyboard hint */}
            <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">↑↓</kbd>
                {language === 'uz' ? 'tanlash' : language === 'ru' ? 'выбор' : 'navigate'}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">↵</kbd>
                {language === 'uz' ? 'ochish' : language === 'ru' ? 'открыть' : 'select'}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">esc</kbd>
                {language === 'uz' ? 'yopish' : language === 'ru' ? 'закрыть' : 'close'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
