import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useCredits } from '@/contexts/CreditContext';
import { useBusinessMode } from '@/hooks/useBusinessMode';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star, Phone, MessageCircle, CheckCircle2, GraduationCap, Globe, Coins, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Mentor {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  bio: string | null;
  bio_uz: string | null;
  bio_ru: string | null;
  university_graduated: string | null;
  country_expertise: string[];
  avatar_url: string | null;
  telegram_username: string | null;
  is_verified: boolean;
  call_cost_credits: number;
  total_calls: number;
  rating: number;
}

interface Booking {
  id: string;
  mentor_id: string;
  status: string;
  credits_spent: number;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
}

const labels = {
  en: {
    title: 'Expert Mentors',
    subtitle: 'Get personalized guidance from verified mentors who graduated from top universities',
    verified: 'Verified Mentor',
    graduated: 'Graduated from',
    expertise: 'Country expertise',
    bookCall: 'Book Discovery Call',
    credits: 'UniCoin',
    rating: 'Rating',
    calls: 'calls completed',
    noMentors: 'No mentors available yet. Check back soon!',
    bookingTitle: 'Book a Discovery Call',
    bookingDesc: 'A 15-minute video call to discuss your study abroad plans',
    notes: 'What would you like to discuss?',
    notesPlaceholder: 'e.g. I want to study Computer Science in South Korea...',
    confirm: 'Confirm & Pay',
    cost: 'Cost',
    myBookings: 'My Bookings',
    noBookings: 'No bookings yet',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
  },
  uz: {
    title: 'Ekspert Mentorlar',
    subtitle: "Top universitetlarni tamomlagan tasdiqlangan mentorlardan shaxsiy maslahat oling",
    verified: 'Tasdiqlangan Mentor',
    graduated: 'Bitirgan',
    expertise: 'Davlat tajribasi',
    bookCall: "Maslahat so'rash",
    credits: 'UniCoin',
    rating: 'Reyting',
    calls: 'ta maslahat',
    noMentors: "Hozircha mentorlar yo'q. Tez orada qo'shiladi!",
    bookingTitle: "Maslahat uchun qo'ng'iroq",
    bookingDesc: "15 daqiqalik video qo'ng'iroq — o'qish rejalaringizni muhokama qilish uchun",
    notes: 'Nimani muhokama qilmoqchisiz?',
    notesPlaceholder: "masalan, Men Janubiy Koreyada Kompyuter fanlari o'qimoqchiman...",
    confirm: "Tasdiqlash va to'lash",
    cost: 'Narxi',
    myBookings: 'Mening bronlarim',
    noBookings: "Hali bronlar yo'q",
    pending: 'Kutilmoqda',
    confirmed: 'Tasdiqlangan',
    completed: 'Yakunlangan',
    cancelled: 'Bekor qilingan',
  },
  ru: {
    title: 'Эксперт-менторы',
    subtitle: 'Получите персональные консультации от верифицированных менторов',
    verified: 'Верифицированный',
    graduated: 'Окончил',
    expertise: 'Экспертиза',
    bookCall: 'Записаться',
    credits: 'UniCoin',
    rating: 'Рейтинг',
    calls: 'консультаций',
    noMentors: 'Пока нет менторов. Скоро появятся!',
    bookingTitle: 'Записаться на консультацию',
    bookingDesc: '15-минутный видеозвонок для обсуждения ваших планов',
    notes: 'Что хотите обсудить?',
    notesPlaceholder: 'Например, я хочу изучать IT в Южной Корее...',
    confirm: 'Подтвердить и оплатить',
    cost: 'Стоимость',
    myBookings: 'Мои записи',
    noBookings: 'Пока нет записей',
    pending: 'Ожидание',
    confirmed: 'Подтверждено',
    completed: 'Завершено',
    cancelled: 'Отменено',
  },
};

export default function StudentMentors() {
  const { user } = useAuth();
  const { language } = useApp();
  const { spendCredits } = useCredits();
  const { isUniCoin, isPaid } = useBusinessMode();
  const l = labels[language as keyof typeof labels] || labels.en;
  const priceLabel = isPaid
    ? (language === 'uz' ? 'Tarif' : language === 'ru' ? 'Тариф' : 'Plan')
    : l.credits;

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: mentorData }, { data: bookingData }] = await Promise.all([
      supabase.from('mentors').select('*').eq('is_active', true).order('rating', { ascending: false }),
      user ? supabase.from('mentor_bookings').select('*').eq('student_id', user.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    setMentors((mentorData as any[]) || []);
    setBookings((bookingData as any[]) || []);
    setLoading(false);
  };

  const getMentorName = (m: Mentor) =>
    language === 'uz' ? m.name_uz || m.name :
    language === 'ru' ? m.name_ru || m.name : m.name;

  const getMentorBio = (m: Mentor) =>
    language === 'uz' ? m.bio_uz || m.bio :
    language === 'ru' ? m.bio_ru || m.bio : m.bio;

  const handleBook = async () => {
    if (!user || !selectedMentor) return;
    setSubmitting(true);

    if (isUniCoin) {
      const success = await spendCredits(
        selectedMentor.call_cost_credits,
        `Mentor call: ${selectedMentor.name}`,
        selectedMentor.id
      );

      if (!success) {
        setSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from('mentor_bookings').insert({
      mentor_id: selectedMentor.id,
      student_id: user.id,
      credits_spent: isUniCoin ? selectedMentor.call_cost_credits : 0,
      notes: bookingNotes || null,
      status: 'pending',
    });

    if (error) {
      toast.error('Booking failed');
    } else {
      toast.success(language === 'uz' ? 'Bron qilindi!' : language === 'ru' ? 'Записано!' : 'Booked!');
      setSelectedMentor(null);
      setBookingNotes('');
      fetchData();
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-warning/10 text-warning border-warning/20', label: l.pending },
      confirmed: { className: 'bg-primary/10 text-primary border-primary/20', label: l.confirmed },
      completed: { className: 'bg-success/10 text-success border-success/20', label: l.completed },
      cancelled: { className: 'bg-destructive/10 text-destructive border-destructive/20', label: l.cancelled },
    };
    const s = map[status] || map.pending;
    return <Badge className={`${s.className} text-xs`}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{l.title}</h1>
        <p className="text-muted-foreground">{l.subtitle}</p>
      </div>

      {/* Mentor Cards */}
      {mentors.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{l.noMentors}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor, i) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  {/* Avatar & Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
                      {mentor.avatar_url ? (
                        <img src={mentor.avatar_url} alt={mentor.name} className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        mentor.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{getMentorName(mentor)}</h3>
                      {mentor.is_verified && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {l.verified}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  {mentor.university_graduated && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <GraduationCap className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{l.graduated}: {mentor.university_graduated}</span>
                    </div>
                  )}

                  {mentor.country_expertise.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{mentor.country_expertise.join(', ')}</span>
                    </div>
                  )}

                  {/* Bio */}
                  {getMentorBio(mentor) && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                      {getMentorBio(mentor)}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{Number(mentor.rating).toFixed(1)}</span>
                    </div>
                    <span className="text-muted-foreground">{mentor.total_calls} {l.calls}</span>
                  </div>

                  {/* Book Button */}
                  <Button
                    className="w-full gap-2"
                    onClick={() => setSelectedMentor(mentor)}
                  >
                    <Phone className="w-4 h-4" />
                    {l.bookCall} — {isPaid ? (language === 'uz' ? 'So\'rov yuborish' : language === 'ru' ? 'Отправить запрос' : 'Send request') : `${mentor.call_cost_credits} ${priceLabel}`}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* My Bookings */}
      {bookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">{l.myBookings}</h2>
          <div className="space-y-3">
            {bookings.map(b => {
              const mentor = mentors.find(m => m.id === b.mentor_id);
              return (
                <Card key={b.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{mentor ? getMentorName(mentor) : 'Mentor'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</p>
                      {b.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{b.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {isUniCoin && <span className="text-sm font-medium text-primary">{b.credits_spent} {priceLabel}</span>}
                      {statusBadge(b.status)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={!!selectedMentor} onOpenChange={(open) => !open && setSelectedMentor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {l.bookingTitle}
            </DialogTitle>
            <DialogDescription>{l.bookingDesc}</DialogDescription>
          </DialogHeader>

          {selectedMentor && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {selectedMentor.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{getMentorName(selectedMentor)}</p>
                  <p className="text-xs text-muted-foreground">{selectedMentor.university_graduated}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{l.notes}</label>
                <Textarea
                  className="mt-1.5"
                  placeholder={l.notesPlaceholder}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
                <span className="text-sm font-medium">{l.cost}</span>
                {isUniCoin ? (
                  <span className="font-bold text-primary flex items-center gap-1">
                    <Coins className="w-4 h-4" />
                    {selectedMentor.call_cost_credits} {priceLabel}
                  </span>
                ) : (
                  <span className="font-bold text-primary">
                    {language === 'uz' ? 'Admin tasdiqlaydi' : language === 'ru' ? 'Подтверждает админ' : 'Admin will confirm'}
                  </span>
                )}
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleBook}
                disabled={submitting}
              >
                {submitting ? '...' : l.confirm}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
