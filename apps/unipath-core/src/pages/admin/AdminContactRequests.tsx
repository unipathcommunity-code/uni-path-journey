import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Phone, MessageSquare, Loader2, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

interface ContactRequest {
  id: string;
  full_name: string;
  phone: string;
  message: string | null;
  source_page: string;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ['new', 'in_progress', 'done'] as const;

export default function AdminContactRequests() {
  const [items, setItems] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_requests')
      .select('id, full_name, phone, message, source_page, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      toast.error('Failed to load contact requests');
    } else {
      setItems((data as ContactRequest[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('contact_requests_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_requests' },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase
      .from('contact_requests')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    setUpdating(null);
    if (error) {
      toast.error('Update failed');
    } else {
      toast.success('Updated');
      setItems(prev => prev.map(it => (it.id === id ? { ...it, status } : it)));
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'done') return <Badge className="bg-success/15 text-success border-0 gap-1"><CheckCircle2 className="w-3 h-3" /> Done</Badge>;
    if (status === 'in_progress') return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> In progress</Badge>;
    return <Badge className="bg-primary/15 text-primary border-0">New</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact Requests</h1>
          <p className="text-muted-foreground text-sm">
            Foydalanuvchilarning landing’dan yuborgan so‘rovlari
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            Hozircha so‘rov yo‘q
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map(item => (
              <div key={item.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{item.full_name}</p>
                    {statusBadge(item.status)}
                    <Badge variant="outline" className="text-[10px] uppercase">{item.source_page}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <a href={`tel:${item.phone}`} className="flex items-center gap-1 hover:text-primary">
                      <Phone className="w-3.5 h-3.5" /> {item.phone}
                    </a>
                    <span>·</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  {item.message && (
                    <p className="mt-2 text-sm text-foreground bg-muted/50 rounded-xl p-3 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span className="whitespace-pre-wrap break-words">{item.message}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUS_OPTIONS.map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={item.status === s ? 'default' : 'outline'}
                      disabled={updating === item.id || item.status === s}
                      onClick={() => updateStatus(item.id, s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
