import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plane, Phone, MessageCircle, MapPin, UserCheck } from 'lucide-react';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { UpgradeGate } from '@/components/admin/UpgradeGate';

interface Row {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  telegram_username: string | null;
  country: string;
  visa_received: boolean;
  agent_name: string | null;
  agent_phone: string | null;
  agent_telegram: string | null;
}

export default function AdminArrival() {
  const { hasMentors } = usePlanLimits();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasMentors) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: visas } = await supabase
        .from('visa_applications')
        .select('user_id, country, visa_received')
        .eq('visa_received', true);

      const ids = (visas || []).map(v => v.user_id);
      if (ids.length === 0) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, telegram_username')
        .in('user_id', ids);

      const { data: assignments } = await supabase
        .from('agent_students')
        .select('agent_id, student_id')
        .in('student_id', ids)
        .eq('status', 'active');

      const agentIds = Array.from(new Set((assignments || []).map(a => a.agent_id)));
      const { data: agents } = agentIds.length
        ? await supabase.from('profiles').select('user_id, full_name, phone, telegram_username').in('user_id', agentIds)
        : { data: [] as any[] };

      const agentMap = new Map((agents || []).map((a: any) => [a.user_id, a]));
      const assignMap = new Map((assignments || []).map(a => [a.student_id, a.agent_id]));
      const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      const out: Row[] = (visas || []).map(v => {
        const p: any = profMap.get(v.user_id) || {};
        const agentId = assignMap.get(v.user_id);
        const agent: any = agentId ? agentMap.get(agentId) : null;
        return {
          user_id: v.user_id,
          full_name: p.full_name || null,
          email: p.email || null,
          phone: p.phone || null,
          telegram_username: p.telegram_username || null,
          country: v.country,
          visa_received: v.visa_received,
          agent_name: agent?.full_name || null,
          agent_phone: agent?.phone || null,
          agent_telegram: agent?.telegram_username || null,
        };
      });
      setRows(out);
      setLoading(false);
    })();
  }, [hasMentors]);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!hasMentors) {
    return <UpgradeGate requiredPlan="Pro" featureName="Arrival Tracker" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Plane className="w-6 h-6 text-primary" /> Kutib olish boshqaruvi</h1>
        <p className="text-muted-foreground mt-1">Vizasi tasdiqlangan talabalar va ularga biriktirilgan agentlar.</p>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Hozircha vizasi tasdiqlangan talabalar yo'q.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(r => (
            <Card key={r.user_id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{r.full_name || r.email || 'Talaba'}</span>
                  <Badge variant="secondary" className="gap-1"><MapPin className="w-3 h-3" /> {r.country}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {r.phone && <a href={`tel:${r.phone}`} className="flex items-center gap-2 text-primary hover:underline"><Phone className="w-4 h-4" /> {r.phone}</a>}
                {r.telegram_username && <a href={`https://t.me/${r.telegram_username.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline"><MessageCircle className="w-4 h-4" /> {r.telegram_username}</a>}
                <div className="border-t border-border pt-2 mt-2">
                  <p className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Biriktirilgan agent</p>
                  {r.agent_name ? (
                    <>
                      <p className="font-medium">{r.agent_name}</p>
                      {r.agent_phone && <a href={`tel:${r.agent_phone}`} className="flex items-center gap-2 text-primary hover:underline text-xs"><Phone className="w-3 h-3" /> {r.agent_phone}</a>}
                      {r.agent_telegram && <a href={`https://t.me/${r.agent_telegram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline text-xs"><MessageCircle className="w-3 h-3" /> {r.agent_telegram}</a>}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-xs">Agent biriktirilmagan</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
