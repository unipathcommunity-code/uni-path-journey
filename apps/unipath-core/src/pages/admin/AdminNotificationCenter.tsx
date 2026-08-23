/**
 * AdminNotificationCenter — Yagona bildirishnomalar markazi
 * Agentlikning barcha murojaat va tizim xabarlari bitta joyda.
 * Manbalar: contact_requests, notification_queue
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Bell, BellOff, MessageSquare, Phone, User, Clock,
  CheckCheck, Trash2, Search, Filter, RefreshCw,
  Plane, GraduationCap, Building, Stethoscope, UtensilsCrossed,
  Dumbbell, FileText, Send, CircleDot, CheckCircle2, X
} from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';

interface Notification {
  id: string;
  type: 'contact' | 'system' | 'telegram';
  title: string;
  body: string;
  from_name?: string;
  from_phone?: string;
  source?: string;
  created_at: string;
  read: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  contact: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  system: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  telegram: 'bg-[#229ED9]/10 text-[#229ED9] border-[#229ED9]/20',
};

const TYPE_LABELS: Record<string, string> = {
  contact: 'Murojaat',
  system: 'Tizim',
  telegram: 'Telegram',
  all: 'Barchasi',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Hozir';
  if (m < 60) return `${m} daqiqa oldin`;
  if (h < 24) return `${h} soat oldin`;
  return `${d} kun oldin`;
}

const READ_KEY = (tenantId: string) => `notif_read_${tenantId}`;

export default function AdminNotificationCenter() {
  const { activeTenant } = useApp();
  const tid = activeTenant?.id;
  const VertIcon = Building;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'contact' | 'system' | 'telegram'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Load read IDs from localStorage
  useEffect(() => {
    if (!tid) return;
    try {
      const stored = JSON.parse(localStorage.getItem(READ_KEY(tid)) || '[]');
      setReadIds(new Set(stored));
    } catch { setReadIds(new Set()); }
  }, [tid]);

  const saveReadIds = useCallback((ids: Set<string>) => {
    if (!tid) return;
    localStorage.setItem(READ_KEY(tid), JSON.stringify([...ids]));
  }, [tid]);

  const fetchNotifications = useCallback(async () => {
    if (!tid) { setLoading(false); return; }
    setLoading(true);
    try {
      const all: Notification[] = [];

      // 1. Contact requests
      const { data: contacts } = await supabase
        .from('contact_requests')
        .select('id, full_name, phone, message, source_page, created_at, status')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false })
        .limit(50);

      (contacts || []).forEach((c: any) => {
        all.push({
          id: `contact_${c.id}`,
          type: 'contact',
          title: `📩 Yangi murojaat — ${c.full_name || 'Noma\'lum'}`,
          body: c.message || 'Aloqa so\'rovi yuborildi',
          from_name: c.full_name,
          from_phone: c.phone,
          source: c.source_page || 'sayt',
          created_at: c.created_at,
          read: false,
        });
      });

      // 2. Notification queue (Telegram/system)
      const { data: queue } = await supabase
        .from('notification_queue')
        .select('id, type, payload, created_at')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false })
        .limit(50);

      (queue || []).forEach((q: any) => {
        const msg = q.payload?.message || q.payload?.body || 'Tizim xabari';
        all.push({
          id: `queue_${q.id}`,
          type: q.type === 'telegram' ? 'telegram' : 'system',
          title: q.type === 'telegram' ? '📱 Telegram xabar' : '⚙️ Tizim xabari',
          body: msg,
          created_at: q.created_at,
          read: false,
        });
      });

      // Sort by date, apply read state
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(all.map(n => ({ ...n, read: readIds.has(n.id) })));
    } catch (err) {
      console.error('Notification fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tid, readIds]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = (id: string) => {
    const next = new Set([...readIds, id]);
    setReadIds(next);
    saveReadIds(next);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    const next = new Set([...readIds, ...notifications.map(n => n.id)]);
    setReadIds(next);
    saveReadIds(next);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('Barchasi o\'qilgan deb belgilandi');
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('O\'chirildi');
  };

  const filtered = notifications.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (filterRead === 'unread' && n.read) return false;
    if (search && !`${n.title} ${n.body} ${n.from_name} ${n.from_phone}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                Bildirishnomalar
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Barcha murojaatlar, bronlar va tizim xabarlari
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchNotifications} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Yangilash
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
                  <CheckCheck className="h-3.5 w-3.5" /> Barchasi o'qildi
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'contact', 'system', 'telegram'] as const).map(t => (
                  <Button
                    key={t}
                    size="sm"
                    variant={filterType === t ? 'default' : 'outline'}
                    onClick={() => setFilterType(t)}
                    className="h-9 text-xs"
                  >
                    {TYPE_LABELS[t]}
                    {t !== 'all' && (
                      <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                        {notifications.filter(n => n.type === t).length}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                variant={filterRead === 'unread' ? 'default' : 'outline'}
                onClick={() => setFilterRead(p => p === 'unread' ? 'all' : 'unread')}
                className="h-9 text-xs gap-1.5"
              >
                <CircleDot className="h-3.5 w-3.5" />
                Faqat o'qilmaganlar
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-muted-foreground"
          >
            <BellOff className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Bildirishnomalar yo'q</p>
            <p className="text-sm mt-1">Yangi murojaatlar va bronlar bu yerda ko'rinadi</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((n, idx) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${n.read ? 'opacity-70' : 'border-primary/30 shadow-sm'}`}
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Unread dot */}
                        <div className="mt-1.5 flex-shrink-0">
                          {n.read ? (
                            <div className="w-2 h-2 rounded-full bg-muted" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <p className={`text-sm font-semibold leading-tight ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {n.title}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[n.type]}`}>
                                {TYPE_LABELS[n.type]}
                              </span>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {timeAgo(n.created_at)}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.body}</p>

                          {(n.from_name || n.from_phone) && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {n.from_name && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" /> {n.from_name}
                                </span>
                              )}
                              {n.from_phone && (
                                <a
                                  href={`tel:${n.from_phone}`}
                                  className="flex items-center gap-1 text-primary hover:underline"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Phone className="h-3 w-3" /> {n.from_phone}
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!n.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                              onClick={e => { e.stopPropagation(); markRead(n.id); }}
                              title="O'qildi deb belgilash"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                            onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                            title="O'chirish"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Stats footer */}
        {notifications.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Jami: {notifications.length} · O'qilmagan: {unreadCount}</span>
              <span>So'nggi yangilanish: {new Date().toLocaleTimeString('uz-UZ')}</span>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
