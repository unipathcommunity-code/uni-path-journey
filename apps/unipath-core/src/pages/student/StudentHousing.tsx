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
  Home, MapPin, Heart, Search, Wifi, UtensilsCrossed, Bath, BadgeCheck, Loader2, DollarSign, Ruler,
} from 'lucide-react';
import { toast } from 'sonner';

interface Housing {
  id: string;
  title: string;
  country: string;
  city: string;
  price_per_month: number;
  deposit: number | null;
  currency: string;
  distance_from_university: string | null;
  room_type: string;
  housing_type: string;
  has_internet: boolean;
  has_kitchen: boolean;
  has_bathroom: boolean;
  photos: string[] | null;
  contact_details: string | null;
  description: string | null;
  is_verified: boolean;
}

const lockMessages: Record<string, string> = {
  en: 'This feature will unlock after your visa is approved.',
  uz: 'Bu funksiya vizangiz tasdiqlanganidan keyin ochiladi.',
  ru: 'Эта функция станет доступна после одобрения визы.',
};

export default function StudentHousing() {
  const { language, selectedCountry } = useApp();
  const { user } = useAuth();
  const journey = useStudentJourney(language);
  const [housing, setHousing] = useState<Housing[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!journey.isHousingUnlocked || !user) return;

    async function fetchHousing() {
      let query = supabase.from('housing').select('*').eq('is_active', true);

      const countryFilter = journey.acceptedUniversity?.country || selectedCountry?.name;
      if (countryFilter) {
        query = query.eq('country', countryFilter);
      }
      if (journey.acceptedUniversity?.city) {
        query = query.eq('city', journey.acceptedUniversity.city);
      }

      const { data } = await query.order('is_verified', { ascending: false });
      setHousing((data as Housing[]) || []);

      const { data: saved } = await supabase
        .from('saved_housing')
        .select('housing_id')
        .eq('user_id', user.id);
      setSavedIds(new Set((saved || []).map(s => s.housing_id)));

      setLoading(false);
    }

    fetchHousing();
  }, [journey.isHousingUnlocked, journey.acceptedUniversity, selectedCountry?.name, user]);

  if (journey.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!journey.isHousingUnlocked) {
    const placeholderContent = (
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold">Student Housing</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-card border rounded-2xl p-5 h-64">
              <div className="w-full h-32 bg-muted rounded-xl mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
    return (
      <LockedFeatureBlur
        title={language === 'uz' ? 'Turar joy' : language === 'ru' ? 'Жильё' : 'Student Housing'}
        description={lockMessages[language] || lockMessages.en}
        featureKey="housing"
      >
        {placeholderContent}
      </LockedFeatureBlur>
    );
  }

  const toggleSave = async (housingId: string) => {
    if (!user) return;
    if (savedIds.has(housingId)) {
      await supabase.from('saved_housing').delete().eq('user_id', user.id).eq('housing_id', housingId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(housingId); return n; });
      toast.success(language === 'uz' ? 'Olib tashlandi' : 'Removed');
    } else {
      await supabase.from('saved_housing').insert({ user_id: user.id, housing_id: housingId });
      setSavedIds(prev => new Set(prev).add(housingId));
      toast.success(language === 'uz' ? 'Saqlandi' : 'Saved');
    }
  };

  const filtered = housing.filter(h => {
    if (search && !h.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && h.housing_type !== typeFilter) return false;
    return true;
  });

  const labels = {
    en: { title: 'Student Housing Near Your University', search: 'Search housing...', all: 'All Types', dormitory: 'Dormitory', apartment: 'Shared Apartment', private: 'Private Rent', studio: 'Studio', perMonth: '/month', deposit: 'Deposit', distance: 'Distance', contact: 'Contact Landlord', reserve: 'Reserve', verified: 'UniPath Verified', noHousing: 'No housing found', amenities: 'Amenities' },
    uz: { title: 'Universitetingiz yaqinidagi turar joy', search: 'Turar joy qidirish...', all: 'Barcha turlar', dormitory: 'Yotoqxona', apartment: 'Sherikli kvartira', private: 'Xususiy ijara', studio: 'Studiya', perMonth: '/oy', deposit: 'Depozit', distance: 'Masofa', contact: 'Uy egasiga bog\'lanish', reserve: 'Band qilish', verified: 'UniPath Tasdiqlangan', noHousing: 'Turar joy topilmadi', amenities: 'Qulayliklar' },
    ru: { title: 'Жильё рядом с вашим университетом', search: 'Поиск жилья...', all: 'Все типы', dormitory: 'Общежитие', apartment: 'Совместная квартира', private: 'Частная аренда', studio: 'Студия', perMonth: '/мес', deposit: 'Депозит', distance: 'Расстояние', contact: 'Связаться с арендодателем', reserve: 'Забронировать', verified: 'Проверено UniPath', noHousing: 'Жильё не найдено', amenities: 'Удобства' },
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
            <SelectItem value="dormitory">{l.dormitory}</SelectItem>
            <SelectItem value="apartment">{l.apartment}</SelectItem>
            <SelectItem value="private">{l.private}</SelectItem>
            <SelectItem value="studio">{l.studio}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{l.noHousing}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(h => (
            <div key={h.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Photo placeholder */}
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                {h.photos && h.photos.length > 0 ? (
                  <img src={h.photos[0]} alt={h.title} className="w-full h-full object-cover" />
                ) : (
                  <Home className="w-12 h-12 text-muted-foreground/40" />
                )}
                <button
                  onClick={() => toggleSave(h.id)}
                  className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                >
                  <Heart className={`w-4 h-4 ${savedIds.has(h.id) ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
                </button>
                {h.is_verified && (
                  <Badge className="absolute top-3 left-3 gap-1" variant="secondary">
                    <BadgeCheck className="w-3 h-3" /> {l.verified}
                  </Badge>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">{h.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {h.city}, {h.country}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{h.currency} {h.price_per_month}</span>
                  <span className="text-sm text-muted-foreground">{l.perMonth}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{h.room_type}</Badge>
                  <Badge variant="outline" className="capitalize">{h.housing_type}</Badge>
                  {h.distance_from_university && (
                    <Badge variant="outline" className="gap-1">
                      <Ruler className="w-3 h-3" /> {h.distance_from_university}
                    </Badge>
                  )}
                </div>

                {/* Amenities */}
                <div className="flex gap-3">
                  {h.has_internet && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Wifi className="w-3.5 h-3.5 text-primary" /> Internet
                    </div>
                  )}
                  {h.has_kitchen && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-primary" /> Kitchen
                    </div>
                  )}
                  {h.has_bathroom && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Bath className="w-3.5 h-3.5 text-primary" /> Bathroom
                    </div>
                  )}
                </div>

                {h.deposit && (
                  <p className="text-xs text-muted-foreground">
                    {l.deposit}: {h.currency} {h.deposit}
                  </p>
                )}

                {h.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{h.description}</p>
                )}

                <div className="flex gap-2">
                  {h.contact_details && (
                    <Button size="sm" variant="outline" className="flex-1">
                      {l.contact}
                    </Button>
                  )}
                  <Button size="sm" className="flex-1">
                    {l.reserve}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
