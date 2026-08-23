import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  X,
  GitCompare,
  GraduationCap,
  DollarSign,
  Globe,
  Star,
  CheckCircle2,
  Circle,
  ChevronDown,
  Search,
  Loader2,
} from 'lucide-react';

interface University {
  id: string;
  name: string;
  country: string;
  city?: string | null;
  ranking?: number | null;
  tuition_min?: number | null;
  tuition_max?: number | null;
  currency?: string | null;

  language?: string | null;

  website?: string | null;
  description?: string | null;
  images?: string[] | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  language: string;
}

const LABELS = {
  en: {
    title: 'Compare Universities',
    subtitle: 'Select up to 3 universities to compare side by side',
    search: 'Search university...',
    country: 'Country',
    city: 'City',
    ranking: 'World Ranking',
    tuition: 'Annual Tuition',
    duration: 'Duration',
    language: 'Language',
    acceptRate: 'Acceptance Rate',
    notAvailable: 'N/A',
    addUni: 'Add University',
    removeSlot: 'Remove',
    close: 'Close',
    apply: 'Apply Now',
    noRanking: 'Unranked',
  },
  uz: {
    title: 'Universitetlarni solishtirish',
    subtitle: "Parallel ko'rish uchun 3 tagacha universitet tanlang",
    search: 'Universiterni qidirish...',
    country: 'Davlat',
    city: 'Shahar',
    ranking: 'Dunyo reytingi',
    tuition: 'Yillik to\'lov',
    duration: 'Davomiyligi',
    language: 'Ta\'lim tili',
    acceptRate: 'Qabul darajasi',
    notAvailable: 'Ma\'lumot yo\'q',
    addUni: 'Universitet qo\'shish',
    removeSlot: 'Olib tashlash',
    close: 'Yopish',
    apply: 'Ariza topshirish',
    noRanking: 'Reytinglanmagan',
  },
  ru: {
    title: 'Сравнение университетов',
    subtitle: 'Выберите до 3 университетов для сравнения',
    search: 'Поиск университета...',
    country: 'Страна',
    city: 'Город',
    ranking: 'Мировой рейтинг',
    tuition: 'Стоимость в год',
    duration: 'Продолжительность',
    language: 'Язык обучения',
    acceptRate: 'Процент принятых',
    notAvailable: 'Нет данных',
    addUni: 'Добавить ВУЗ',
    removeSlot: 'Убрать',
    close: 'Закрыть',
    apply: 'Подать заявку',
    noRanking: 'Нет рейтинга',
  },
};

const ROWS = [
  { key: 'country', icon: Globe },
  { key: 'city', icon: Globe },
  { key: 'ranking', icon: Star },
  { key: 'tuition', icon: DollarSign },
  { key: 'duration', icon: CheckCircle2 },
  { key: 'language', icon: GraduationCap },
  { key: 'acceptRate', icon: CheckCircle2 },
] as const;

function getValue(uni: University, key: typeof ROWS[number]['key'], l: typeof LABELS.en): string {
  switch (key) {
    case 'country': return uni.country || l.notAvailable;
    case 'city': return uni.city || l.notAvailable;
    case 'ranking': return uni.ranking ? `#${uni.ranking}` : l.noRanking;
    case 'tuition': {
      const cur = uni.currency || 'USD';
      if (uni.tuition_min && uni.tuition_max)
        return `${uni.tuition_min.toLocaleString()}–${uni.tuition_max.toLocaleString()} ${cur}`;
      if (uni.tuition_min) return `${uni.tuition_min.toLocaleString()} ${cur}`;
      return l.notAvailable;
    }
    case 'duration': return l.notAvailable;
    case 'language': return l.notAvailable;
    case 'acceptRate': return l.notAvailable;
    default: return l.notAvailable;
  }
}

export function UniversityComparison({ open, onClose, language }: Props) {
  const l = LABELS[language as keyof typeof LABELS] || LABELS.en;
  const [slots, setSlots] = useState<(University | null)[]>([null, null, null]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<University[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('universities')
        .select('id, name, country, city, ranking, tuition_min, tuition_max, currency, website, description, images')
        .ilike('name', `%${searchQuery}%`)
        .limit(8);
      setSearchResults((data as University[]) || []);
      setSearchLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUni = (uni: University) => {
    if (activeSlot === null) return;
    const updated = [...slots];
    updated[activeSlot] = uni;
    setSlots(updated);
    setActiveSlot(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemove = (idx: number) => {
    const updated = [...slots];
    updated[idx] = null;
    setSlots(updated);
  };

  const filledCount = slots.filter(Boolean).length;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="bg-card w-full sm:max-w-5xl rounded-t-3xl sm:rounded-3xl border border-border overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <GitCompare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">{l.title}</h2>
                <p className="text-[10px] text-muted-foreground">{l.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Search bar — shown when a slot is active */}
          <AnimatePresence>
            {activeSlot !== null && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex-shrink-0 border-b border-border"
              >
                <div className="px-5 py-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={l.search}
                      className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    {searchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 bg-background border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {searchResults.map((uni) => (
                        <button
                          key={uni.id}
                          onClick={() => handleSelectUni(uni)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                        >
                          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{uni.name}</p>
                            <p className="text-[10px] text-muted-foreground">{uni.country}{uni.city ? `, ${uni.city}` : ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comparison Table */}
          <div className="overflow-auto flex-1">
            <div className="min-w-[560px]">
              {/* University headers */}
              <div className="grid grid-cols-4 gap-0 sticky top-0 bg-card z-10 border-b border-border">
                {/* Row label column */}
                <div className="px-4 py-3 bg-muted/40" />
                {slots.map((uni, idx) => (
                  <div key={idx} className="px-3 py-3 border-l border-border">
                    {uni ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-1">
                          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-4 h-4 text-primary" />
                          </div>
                          <button
                            onClick={() => handleRemove(idx)}
                            className="w-5 h-5 bg-muted hover:bg-destructive/10 hover:text-destructive rounded-md flex items-center justify-center transition-colors flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">{uni.name}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveSlot(idx)}
                        className="w-full h-16 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all group"
                      >
                        <Circle className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                        <span className="text-[9px] text-muted-foreground group-hover:text-primary/60 transition-colors font-medium">{l.addUni}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {ROWS.map((row, rowIdx) => (
                <div key={row.key} className={`grid grid-cols-4 gap-0 border-b border-border/50 ${rowIdx % 2 === 0 ? 'bg-muted/20' : ''}`}>
                  <div className="px-4 py-3 flex items-center gap-2">
                    <row.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-[10px] md:text-xs font-medium text-muted-foreground">{l[row.key]}</span>
                  </div>
                  {slots.map((uni, idx) => (
                    <div key={idx} className="px-3 py-3 border-l border-border/50 flex items-center">
                      {uni ? (
                        <span className="text-[11px] md:text-xs font-medium text-foreground">
                          {getValue(uni, row.key, l)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/30">—</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* Apply row */}
              {filledCount > 0 && (
                <div className="grid grid-cols-4 gap-0 bg-card">
                  <div className="px-4 py-4" />
                  {slots.map((uni, idx) => (
                    <div key={idx} className="px-3 py-4 border-l border-border/50 flex items-center">
                      {uni && (
                        <Button size="sm" className="text-[10px] h-7 px-3 rounded-lg w-full" asChild>
                          <a href={`/student/applications`}>{l.apply}</a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
