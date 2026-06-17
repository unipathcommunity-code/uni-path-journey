import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Users, Phone, Search, Plus, ChevronRight, Globe, MessageCircle,
  UserCheck, FileText, Plane, GraduationCap, Star, MoreHorizontal,
  RefreshCw, Loader2, ArrowRight, Clock, XCircle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type CrmStage = string;

interface CrmClient {
  id: string;           // profiles.id
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  telegram_username: string | null;
  stage: CrmStage;
  crm_stage_id: string | null;
  notes: string | null;
  assigned_at: string | null;
  selected_country: string | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminCRM() {
  const { language, activeTenant } = useApp();
  const t = useTranslation(language);
  const { tenantId } = useUserRole();

  const [clients, setClients] = useState<CrmClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<CrmClient | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  const tid = activeTenant?.id ?? tenantId;

  // Resolve current tenant vertical (guard parse so a stale/malformed
  // `active_tenant` can never crash the CRM page).
  let impersonatedTenant: any = null;
  try {
    const raw = localStorage.getItem('active_tenant');
    if (raw) impersonatedTenant = JSON.parse(raw);
  } catch {
    impersonatedTenant = null;
  }
  const effectiveTenant = impersonatedTenant || activeTenant;
  let vertical = effectiveTenant?.business_type || effectiveTenant?.config?.business_type || effectiveTenant?.vertical || 'consulting';
  if (vertical === 'tour_farm') vertical = 'tour';
  if (vertical === 'nova') vertical = 'academy';

  // Dynamic Stages based on Vertical
  const STAGES = (() => {
    if (vertical === 'tour') {
      return [
        { key: 'new',       labelUz: 'Yangi',          labelRu: 'Новый',         labelEn: 'New',          icon: Star,          color: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
        { key: 'contacted', labelUz: 'Bog\'lanildi',    labelRu: 'Связались',     labelEn: 'Contacted',    icon: Phone,         color: 'bg-violet-500/10 border-violet-500/30 text-violet-400' },
        { key: 'converted', labelUz: 'Mijoz',          labelRu: 'Клиент',        labelEn: 'Converted',    icon: UserCheck,     color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
        { key: 'closed',    labelUz: 'Yopildi',         labelRu: 'Закрыт',        labelEn: 'Closed',       icon: UserCheck,     color: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
      ];
    }
    if (vertical === 'academy') {
      return [
        { key: 'new',       labelUz: 'Yangi',          labelRu: 'Новый',         labelEn: 'New',          icon: Star,          color: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
        { key: 'contacted', labelUz: 'Aloqa qilingan',  labelRu: 'Связались',     labelEn: 'Contacted',    icon: Phone,         color: 'bg-violet-500/10 border-violet-500/30 text-violet-400' },
        { key: 'demo',      labelUz: 'Demo dars',      labelRu: 'Демо-урок',     labelEn: 'Demo Class',   icon: Clock,         color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
        { key: 'contract',  labelUz: 'Shartnoma',      labelRu: 'Договор',       labelEn: 'Contract',     icon: FileText,      color: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
        { key: 'won',       labelUz: 'Yutilgan',       labelRu: 'Выигран',       labelEn: 'Won',          icon: GraduationCap, color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
        { key: 'lost',      labelUz: 'Yo\'qotilgan',    labelRu: 'Проигран',      labelEn: 'Lost',         icon: XCircle,       color: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
      ];
    }
    // Default: consulting
    return [
      { key: 'lead',      labelUz: 'Yangi Lead',       labelRu: 'Новый лид',       labelEn: 'New Lead',       icon: Star,          color: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
      { key: 'contacted', labelUz: 'Aloqa O\'rnatildi', labelRu: 'Контакт',         labelEn: 'Contacted',      icon: Phone,         color: 'bg-violet-500/10 border-violet-500/30 text-violet-400' },
      { key: 'documents', labelUz: 'Hujjatlar',         labelRu: 'Документы',       labelEn: 'Documents',      icon: FileText,      color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
      { key: 'visa',      labelUz: 'Viza',              labelRu: 'Виза',            labelEn: 'Visa',           icon: Plane,         color: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
      { key: 'enrolled',  labelUz: 'O\'qishga Kirdi',   labelRu: 'Поступил',        labelEn: 'Enrolled',       icon: GraduationCap, color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
      { key: 'alumni',    labelUz: 'Bitiruvchi',         labelRu: 'Выпускник',       labelEn: 'Alumni',         icon: UserCheck,     color: 'bg-pink-500/10 border-pink-500/30 text-pink-400' },
    ];
  })();

  const stageLabel = (key: CrmStage) => {
    const s = STAGES.find(s => s.key === key);
    if (!s) return key;
    return language === 'ru' ? s.labelRu : language === 'uz' ? s.labelUz : s.labelEn;
  };

  // ── Fetch clients from profiles + crm_stages ──────────────────────────────
  const fetchClients = useCallback(async () => {
    if (!tid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Get all profiles in this tenant (any role — admins can see all)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, phone, email, telegram_username, selected_country')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false });

      // If error (e.g. RLS blocks access), show empty list gracefully
      if (error) {
        console.warn('CRM profiles fetch error (may be RLS):', error.message);
        setClients([]);
        setLoading(false);
        return;
      }

      // Get CRM pipeline stages (decoupled from agent_students so the
      // board never overwrites the agent-assignment status).
      const { data: crmRows } = await supabase
        .from('crm_stages')
        .select('id, user_id, stage, notes, created_at')
        .eq('tenant_id', tid);

      const stageMap = new Map<string, { id: string; stage: string; notes: string | null; created_at: string }>();
      crmRows?.forEach((r: any) => {
        stageMap.set(r.user_id, {
          id: r.id,
          stage: r.stage,
          notes: r.notes,
          created_at: r.created_at,
        });
      });

      const defaultStage = vertical === 'consulting' ? 'lead' : 'new';

      const mapped: CrmClient[] = (profiles ?? []).map(p => {
        const rec = stageMap.get(p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          phone: p.phone,
          email: p.email,
          telegram_username: p.telegram_username,
          selected_country: p.selected_country,
          stage: rec?.stage ?? defaultStage,
          crm_stage_id: rec?.id ?? null,
          notes: rec?.notes ?? null,
          assigned_at: rec?.created_at ?? null,
        };
      });

      setClients(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Ma\'lumotlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, [tid, vertical]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // ── Move client to next stage ────────────────────────────────────────────
  const moveToStage = async (client: CrmClient, newStage: CrmStage) => {
    setMovingId(client.id);
    try {
      const { error: stageError } = await supabase
        .from('crm_stages')
        .upsert(
          { tenant_id: tid, user_id: client.user_id, stage: newStage },
          { onConflict: 'tenant_id,user_id' }
        );
      if (stageError) throw stageError;

      // Automatically trigger telegram bot and SMS notifications
      const stageText = stageLabel(newStage);
      const message = `Hurmatli ${client.full_name || 'Mijoz'}, sizning arizangiz muvaffaqiyatli ravishda keyingi bosqichga o'tdi: "${stageText}". Tezkor va sifatli xizmat ko'rsatish - bizning bosh maqsadimizdir!`;

      if (client.phone) {
        await supabase
          .from('notification_queue')
          .insert({
            tenant_id: tid,
            type: 'sms',
            target: client.phone,
            payload: { message }
          });
      }

      if (client.telegram_username) {
        await supabase
          .from('notification_queue')
          .insert({
            tenant_id: tid,
            type: 'telegram',
            target: `@${client.telegram_username.replace(/^@/, '')}`,
            payload: { message }
          });
      }

      setClients(prev =>
        prev.map(c => c.id === client.id ? { ...c, stage: newStage } : c)
      );
      if (selectedClient?.id === client.id) {
        setSelectedClient({ ...client, stage: newStage });
      }
      toast.success(language === 'uz' ? 'Bosqich yangilandi va bildirishnoma yuborildi' : 'Этап обновлен и уведомление отправлено');
    } catch (err) {
      toast.error('Yangilash muvaffaqiyatsiz');
    } finally {
      setMovingId(null);
    }
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const clientsByStage = (stage: CrmStage) =>
    filtered.filter(c => c.stage === stage);


  // ── Stats ────────────────────────────────────────────────────────────────
  const total = clients.length;
  const enrolled = clients.filter(c => c.stage === 'enrolled' || c.stage === 'alumni').length;
  const convRate = total > 0 ? Math.round((enrolled / total) * 100) : 0;

  const headingText =
    language === 'ru' ? 'CRM — Воронка клиентов' :
    language === 'uz' ? 'CRM — Mijozlar Pipelayn'  : 'CRM — Client Pipeline';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{headingText}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {language === 'ru'
              ? `${total} клиентов · Конверсия ${convRate}%`
              : language === 'uz'
              ? `${total} ta mijoz · Konversiya ${convRate}%`
              : `${total} clients · ${convRate}% conversion`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={language === 'uz' ? 'Qidirish...' : language === 'ru' ? 'Поиск...' : 'Search...'}
              className="pl-9 w-48 h-9"
            />
          </div>
          <Button size="sm" onClick={fetchClients} variant="outline" className="gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {STAGES.map(s => {
          const count = clients.filter(c => c.stage === s.key).length;
          const StageIcon = s.icon;
          return (
            <div key={s.key} className={`rounded-xl border p-3 flex items-center gap-2 ${s.color}`}>
              <StageIcon className="w-4 h-4 shrink-0" />
              <div>
                <p className="text-xs font-medium leading-tight">
                  {language === 'ru' ? s.labelRu : language === 'uz' ? s.labelUz : s.labelEn}
                </p>
                <p className="text-lg font-bold leading-tight">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {STAGES.map(stage => {
          const stageClients = clientsByStage(stage.key);
          const StageIcon = stage.icon;
          const nextStageKey = STAGES[STAGES.findIndex(s => s.key === stage.key) + 1]?.key;

          return (
            <div key={stage.key} className="space-y-2">
              {/* Column header */}
              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${stage.color}`}>
                <StageIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold flex-1 truncate">
                  {language === 'ru' ? stage.labelRu : language === 'uz' ? stage.labelUz : stage.labelEn}
                </span>
                <span className="text-xs font-bold opacity-70">{stageClients.length}</span>
              </div>

              {/* Client cards */}
              <div className="space-y-2 min-h-[60px]">
                {stageClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="bg-card border border-border rounded-xl p-3 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate leading-tight">
                          {client.full_name || (language === 'uz' ? 'Nomsiz' : language === 'ru' ? 'Без имени' : 'No name')}
                        </p>
                        {client.phone && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{client.phone}</p>
                        )}
                        {client.selected_country && (
                          <div className="flex items-center gap-1 mt-1">
                            <Globe className="w-2.5 h-2.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground truncate">{client.selected_country}</span>
                          </div>
                        )}
                      </div>
                      <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
                    </div>

                    {/* Quick move button */}
                    {nextStageKey && (
                      <button
                        onClick={e => { e.stopPropagation(); moveToStage(client, nextStageKey); }}
                        disabled={movingId === client.id}
                        className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg py-1 transition-colors"
                      >
                        {movingId === client.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <><ArrowRight className="w-3 h-3" /><span>
                              {language === 'uz' ? 'Ko\'chirish' : language === 'ru' ? 'Перевести' : 'Move'}
                            </span></>
                        }
                      </button>
                    )}
                  </div>
                ))}

                {stageClients.length === 0 && (
                  <div className="border border-dashed border-border rounded-xl h-16 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground/40">—</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Client detail dialog */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {selectedClient.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                {selectedClient.full_name || (language === 'uz' ? 'Nomsiz mijoz' : 'Client')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Stage */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {language === 'uz' ? 'Bosqich' : language === 'ru' ? 'Этап' : 'Stage'}:
                </span>
                <Badge variant="outline" className="text-xs">{stageLabel(selectedClient.stage)}</Badge>
              </div>

              {/* Contact info */}
              <div className="space-y-2">
                {selectedClient.phone && (
                  <a href={`tel:${selectedClient.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {selectedClient.phone}
                  </a>
                )}
                {selectedClient.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                    {selectedClient.email}
                  </div>
                )}
                {selectedClient.telegram_username && (
                  <a href={`https://t.me/${selectedClient.telegram_username.replace(/^@/, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300">
                    <MessageCircle className="w-4 h-4" />
                    @{selectedClient.telegram_username}
                  </a>
                )}
                {selectedClient.selected_country && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    {selectedClient.selected_country}
                  </div>
                )}
              </div>

              {/* Move through stages */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {language === 'uz' ? 'Bosqichni o\'zgartirish' : language === 'ru' ? 'Изменить этап' : 'Change Stage'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(s => (
                    <button
                      key={s.key}
                      onClick={() => { moveToStage(selectedClient, s.key); setSelectedClient({ ...selectedClient, stage: s.key }); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
                        ${selectedClient.stage === s.key
                          ? s.color + ' font-bold'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                        }`}
                    >
                      {language === 'ru' ? s.labelRu : language === 'uz' ? s.labelUz : s.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedClient(null)}>
                {language === 'uz' ? 'Yopish' : language === 'ru' ? 'Закрыть' : 'Close'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
