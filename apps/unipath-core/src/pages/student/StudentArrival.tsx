import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentJourney } from '@/hooks/useStudentJourney';
import { LockedFeatureBlur } from '@/components/LockedFeatureBlur';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, MapPin, MessageCircle, Phone, Plane, UserCheck } from 'lucide-react';

const labels = {
  en: {
    title: 'Arrival Preparation', subtitle: 'Everything you need before departure and airport pickup.',
    locked: 'This section opens after your visa is approved.', checklist: 'Checklist', support: 'Support contact', assigned: 'Assigned agent', noAgent: 'Agent will be assigned soon',
  },
  uz: {
    title: 'Ketishga tayyorgarlik', subtitle: 'Jo‘nab ketish va kutib olishdan oldin kerakli barcha ma’lumotlar.',
    locked: 'Bu bo‘lim viza tasdiqlangandan keyin ochiladi.', checklist: 'Tayyorlov ro‘yxati', support: 'Yordam uchun aloqa', assigned: 'Biriktirilgan agent', noAgent: 'Tez orada agent biriktiriladi',
  },
  ru: {
    title: 'Подготовка к прибытию', subtitle: 'Все нужное перед вылетом и встречей в аэропорту.',
    locked: 'Этот раздел откроется после одобрения визы.', checklist: 'Чек-лист', support: 'Контакт для поддержки', assigned: 'Назначенный агент', noAgent: 'Агент будет назначен скоро',
  },
};

const checklistByLanguage = {
  en: ['Book your ticket', 'Confirm airport arrival time', 'Prepare passport and visa print', 'Confirm housing address', 'Keep local SIM / internet plan ready'],
  uz: ['Biletni bron qiling', 'Aeroportga kelish vaqtini tasdiqlang', 'Pasport va viza nusxasini tayyorlang', 'Turar joy manzilini tasdiqlang', 'SIM-karta yoki internet rejasini tayyorlang'],
  ru: ['Забронируйте билет', 'Подтвердите время прибытия в аэропорт', 'Подготовьте паспорт и распечатку визы', 'Подтвердите адрес жилья', 'Подготовьте SIM-карту или интернет'],
};

export default function StudentArrival() {
  const { language } = useApp();
  const { user } = useAuth();
  const journey = useStudentJourney(language);
  const l = labels[language as keyof typeof labels] || labels.en;
  const checklist = checklistByLanguage[language as keyof typeof checklistByLanguage] || checklistByLanguage.en;
  const [agent, setAgent] = useState<{ full_name: string | null; email: string | null; telegram_username: string | null; phone: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !journey.isArrivalUnlocked) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data: assignment } = await supabase
        .from('agent_students')
        .select('agent_id')
        .eq('student_id', user.id)
        .maybeSingle();

      if (assignment?.agent_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, telegram_username, phone')
          .eq('user_id', assignment.agent_id)
          .maybeSingle();
        setAgent(profile || null);
      }

      setLoading(false);
    })();
  }, [journey.isArrivalUnlocked, user]);

  if (journey.isLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!journey.isArrivalUnlocked) {
    return (
      <LockedFeatureBlur title={l.title} description={l.locked} featureKey="arrival_preparation">
        <div className="grid gap-4 md:grid-cols-2 p-4">
          <div className="h-40 rounded-2xl bg-card border" />
          <div className="h-40 rounded-2xl bg-card border" />
        </div>
      </LockedFeatureBlur>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{l.title}</h1>
        <p className="text-muted-foreground mt-1">{l.subtitle}</p>
        {journey.acceptedUniversity && (
          <p className="text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="w-4 h-4" />{journey.acceptedUniversity.city}, {journey.acceptedUniversity.country}</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plane className="w-5 h-5 text-primary" />{l.checklist}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item) => (
              <div key={item} className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /><span className="text-sm text-foreground">{item}</span></div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary" />{l.support}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="outline">{l.assigned}</Badge>
            {agent ? (
              <>
                <div className="text-sm font-medium text-foreground">{agent.full_name || 'Agent'}</div>
                {agent.phone && <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline"><Phone className="w-4 h-4" />{agent.phone}</a>}
                {agent.telegram_username && <a href={`https://t.me/${agent.telegram_username.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline"><MessageCircle className="w-4 h-4" />{agent.telegram_username}</a>}
                {agent.email && <p className="text-sm text-muted-foreground">{agent.email}</p>}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{l.noAgent}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}