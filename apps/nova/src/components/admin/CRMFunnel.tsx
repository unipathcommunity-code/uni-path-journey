import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, Clock, TrendingUp, Plus, X, ChevronRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STAGES = [
  { key: "new", label: "Yangi", color: "from-primary/30 to-primary/10" },
  { key: "contacted", label: "Aloqa qilingan", color: "from-warning/30 to-warning/10" },
  { key: "demo", label: "Demo", color: "from-accent/30 to-accent/10" },
  { key: "contract", label: "Shartnoma", color: "from-secondary/30 to-secondary/10" },
  { key: "won", label: "Yutilgan", color: "from-success/30 to-success/10" },
  { key: "lost", label: "Yo'qotilgan", color: "from-muted to-muted/50" },
] as const;

interface Lead {
  id: string;
  org_name: string;
  contact_name: string;
  contact_phone: string | null;
  stage: string;
  priority: string | null;
  conversion_value: number | null;
  next_action_at: string | null;
  last_contacted_at: string | null;
}

interface Call {
  id: string;
  lead_id: string;
  caller_name: string | null;
  outcome: string;
  duration_seconds: number | null;
  notes: string | null;
  next_followup_at: string | null;
  created_at: string;
}

const CRMFunnel = ({ onChanged }: { onChanged?: () => void }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLead, setOpenLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [newCall, setNewCall] = useState({ outcome: "attempted", notes: "", duration_seconds: 0 });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id, org_name, contact_name, contact_phone, stage, priority, conversion_value, next_action_at, last_contacted_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setLeads((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const moveLead = async (id: string, stage: string) => {
    const patch: any = { stage };
    if (stage === "contacted") patch.last_contacted_at = new Date().toISOString();
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Bosqich: ${stage}`);
      load();
      onChanged?.();
    }
  };

  const openDetails = async (lead: Lead) => {
    setOpenLead(lead);
    const { data } = await supabase
      .from("lead_calls")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });
    setCalls((data as any) || []);
  };

  const logCall = async () => {
    if (!openLead) return;
    const { error } = await supabase.from("lead_calls").insert({
      lead_id: openLead.id,
      outcome: newCall.outcome,
      duration_seconds: newCall.duration_seconds,
      notes: newCall.notes,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", openLead.id);
    toast.success("Qo'ng'iroq saqlandi");
    setNewCall({ outcome: "attempted", notes: "", duration_seconds: 0 });
    openDetails(openLead);
    load();
  };

  // Conversion funnel stats
  const total = leads.length || 1;
  const won = leads.filter((l) => l.stage === "won").length;
  const conversion = ((won / total) * 100).toFixed(1);
  const totalValue = leads.filter((l) => l.stage === "won").reduce((s, l) => s + Number(l.conversion_value || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-muted-foreground">Jami leads</div>
          <div className="text-2xl font-bold font-heading">{leads.length}</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-muted-foreground">Yutilgan</div>
          <div className="text-2xl font-bold font-heading text-success">{won}</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-muted-foreground">Konversiya</div>
          <div className="text-2xl font-bold font-heading text-primary">{conversion}%</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-muted-foreground">Yopilgan qiymat</div>
          <div className="text-2xl font-bold font-heading">{totalValue.toLocaleString()} <span className="text-xs">so'm</span></div>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((stage) => {
            const items = leads.filter((l) => l.stage === stage.key);
            return (
              <div key={stage.key} className={`bg-gradient-to-b ${stage.color} rounded-xl p-3 min-h-[400px] border border-border/50`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">{stage.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((lead) => (
                    <motion.div
                      key={lead.id}
                      whileHover={{ scale: 1.02 }}
                      className="glass p-3 rounded-lg cursor-pointer"
                      onClick={() => openDetails(lead)}
                    >
                      <div className="font-semibold text-sm truncate">{lead.org_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{lead.contact_name}</div>
                      {lead.contact_phone && (
                        <div className="flex items-center gap-1 text-xs text-primary mt-1">
                          <Phone className="w-3 h-3" /> {lead.contact_phone}
                        </div>
                      )}
                      {lead.priority === "high" && (
                        <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                          <AlertCircle className="w-3 h-3" /> yuqori
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead detail modal */}
      {openLead && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpenLead(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-strong p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-heading font-bold">{openLead.org_name}</h3>
                <p className="text-sm text-muted-foreground">{openLead.contact_name} · {openLead.contact_phone}</p>
              </div>
              <button onClick={() => setOpenLead(null)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage transitions */}
            <div className="mb-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bosqichni o'zgartirish</label>
              <div className="flex flex-wrap gap-1 mt-2">
                {STAGES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => moveLead(openLead.id, s.key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${openLead.stage === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add call */}
            <div className="glass p-4 rounded-xl mb-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Qo'ng'iroq qo'shish</h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  value={newCall.outcome}
                  onChange={(e) => setNewCall({ ...newCall, outcome: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-background border border-border text-sm"
                >
                  <option value="attempted">Urinish</option>
                  <option value="connected">Bog'landi</option>
                  <option value="voicemail">Avtoxabar</option>
                  <option value="scheduled">Uchrashuv</option>
                  <option value="won">Yutuq</option>
                  <option value="lost">Yo'qotuv</option>
                </select>
                <input
                  type="number"
                  placeholder="Davomiyligi (sek)"
                  value={newCall.duration_seconds}
                  onChange={(e) => setNewCall({ ...newCall, duration_seconds: Number(e.target.value) })}
                  className="px-3 py-2 rounded-lg bg-background border border-border text-sm"
                />
              </div>
              <textarea
                placeholder="Eslatmalar..."
                value={newCall.notes}
                onChange={(e) => setNewCall({ ...newCall, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm mb-2"
                rows={2}
              />
              <button onClick={logCall} className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                Saqlash
              </button>
            </div>

            {/* Call history */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Qo'ng'iroqlar tarixi ({calls.length})</h4>
              {calls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Hali qo'ng'iroqlar yo'q</p>
              ) : (
                <div className="space-y-2">
                  {calls.map((c) => (
                    <div key={c.id} className="glass p-3 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold capitalize">{c.outcome}</span>
                        <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                      {c.duration_seconds ? <p className="text-xs mt-1">⏱ {c.duration_seconds}s</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CRMFunnel;
