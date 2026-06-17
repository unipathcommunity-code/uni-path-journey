import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Crown, Building2, Users, DollarSign, TrendingUp, Mail, Loader2, Plus, Filter,
  ChevronRight, Phone, MapPin, ExternalLink, Globe, Send, Settings, Power,
  Trash2, AlertTriangle, Fingerprint, Presentation, BookOpenCheck, LineChart, Tag, Link2,
  Headphones, Code2, QrCode, MessageSquareText, ClipboardList, Radio, ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import { useSuperAdminData, type LeadRow, type TenantRow } from "@/hooks/useSuperAdminData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/admin/StatCard";
import PlansManager from "@/components/admin/PlansManager";
import AuditLogList from "@/components/admin/AuditLogList";
import TelegramBind from "@/components/TelegramBind";
import { usePlans } from "@/hooks/usePlans";
import NovaLogo from "@/components/brand/NovaLogo";

const STAGES = ["new", "contacted", "demo", "contract", "won", "lost"] as const;
const STAGE_COLORS: Record<string, string> = {
  new: "bg-primary/15 text-primary border-primary/30",
  contacted: "bg-warning/15 text-warning border-warning/30",
  demo: "bg-accent/15 text-accent border-accent/30",
  contract: "bg-secondary/15 text-secondary-foreground border-secondary/30",
  won: "bg-success/15 text-success border-success/30",
  lost: "bg-muted text-muted-foreground border-border",
};
const TIER_COLORS: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  pro: "bg-primary/15 text-primary",
  enterprise: "bg-accent/15 text-accent",
};

/** Per-tenant overridable feature toggles (the ones admins can ON/OFF for an org) */
const TENANT_TOGGLES = [
  { key: "qr_attendance", label: "QR davomat", icon: QrCode },
  { key: "website_builder", label: "Veb-sayt", icon: Globe },
  { key: "telegram_bot", label: "Telegram bot", icon: Send },
  { key: "payments", label: "To'lovlar", icon: DollarSign },
  { key: "ai_tutor", label: "Yordamchi (24/7)", icon: MessageSquareText },
  { key: "homework", label: "Uy vazifalar", icon: ClipboardList },
  { key: "live_classes", label: "Jonli darslar", icon: Radio },
  { key: "parent_mirror", label: "Ota-ona oynasi", icon: Users },
  { key: "nova_store", label: "Nova-Store", icon: ShoppingBag },
  { key: "biometric", label: "Biometrik", icon: Fingerprint },
  { key: "ai_presentation", label: "Taqdimot generator", icon: Presentation },
  { key: "ai_lesson_planner", label: "Dars rejalashtirish", icon: BookOpenCheck },
  { key: "crm", label: "CRM", icon: TrendingUp },
  { key: "advanced_analytics", label: "Keng analitika", icon: LineChart },
  { key: "white_label", label: "White-label", icon: Tag },
  { key: "custom_domain", label: "O'z domen", icon: Link2 },
  { key: "priority_support", label: "Ustuvor yordam", icon: Headphones },
  { key: "api_access", label: "API kirish", icon: Code2 },
];

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { data, isLoading, refetch } = useSuperAdminData();
  const { plans } = usePlans();
  const [filterStage, setFilterStage] = useState<string>("all");
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [provisioningLead, setProvisioningLead] = useState<LeadRow | null>(null);
  const [settingsOrg, setSettingsOrg] = useState<TenantRow | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<TenantRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const performDeleteOrg = async () => {
    if (!deleteOrg) return;
    if (deleteConfirm.trim() !== deleteOrg.name) {
      toast.error("Tasdiqlash matni mos emas");
      return;
    }
    setDeleting(true);
    try {
      const { error } = await (supabase as any).rpc("delete_organization", { _org_id: deleteOrg.id });
      if (error) throw error;
      toast.success(`"${deleteOrg.name}" markazi va barcha ma'lumotlari o'chirildi`);
      setDeleteOrg(null);
      setDeleteConfirm("");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;
  if (!hasRole("superadmin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-strong p-8 text-center max-w-sm">
          <Crown className="w-12 h-12 mx-auto text-destructive mb-3" />
          <h2 className="text-xl font-heading font-bold mb-2">SuperAdmin Only</h2>
          <p className="text-sm text-muted-foreground">Bu sahifaga faqat platforma egasi kira oladi.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const { orgs = [], leads = [], statsByOrg = {}, global } = data || ({} as any);
  const filteredLeads = filterStage === "all" ? leads : leads.filter((l: LeadRow) => l.stage === filterStage);

  const updateLeadStage = async (id: string, stage: string) => {
    const { error } = await supabase.from("leads").update({ stage }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Bosqich yangilandi"); refetch(); }
  };

  const toggleOrgStatus = async (org: TenantRow) => {
    const newStatus = org.status === "active" ? "suspended" : "active";
    const { error } = await supabase.from("organizations").update({ status: newStatus }).eq("id", org.id);
    if (error) toast.error(error.message); else { toast.success(`${org.name}: ${newStatus}`); refetch(); }
  };

  const assignPlan = async (orgId: string, planId: string) => {
    const { error } = await supabase
      .from("organizations")
      .update({ plan_id: planId || null })
      .eq("id", orgId);
    if (error) toast.error(error.message);
    else { toast.success("Tarif tayinlandi"); refetch(); window.dispatchEvent(new Event("nova:plan-updated")); }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-3 sm:p-6 pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/5 blur-[200px] pointer-events-none" />

      <DashboardHeader
        layer="superadmin"
        title="NOVA Platform"
        subtitle="Platforma egasi · barcha markazlarni boshqarish"
      />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Global stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          <StatCard icon={Building2} label="Markazlar" value={global.totalOrgs} delay={0.05} />
          <StatCard icon={CheckCircle2} label="Faol" value={global.activeOrgs} color="success" delay={0.1} />
          <StatCard icon={Users} label="O'quvchilar" value={global.totalStudents} color="accent" delay={0.15} />
          <StatCard icon={Users} label="Ustozlar" value={global.totalTeachers} color="primary" delay={0.2} />
          <StatCard icon={DollarSign} label="Daromad" value={Math.round(global.totalRevenue).toLocaleString()} color="warning" delay={0.25} />
          <StatCard icon={Mail} label="Murojaatlar" value={global.totalLeads} delay={0.3} />
          <StatCard icon={TrendingUp} label="Yangi" value={global.newLeads} color="primary" delay={0.35} />
          <StatCard icon={Crown} label="Yutdik" value={global.wonLeads} color="success" delay={0.4} />
        </div>

        {/* My Quick-actions: SuperAdmin tools */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction icon={Globe} label="Veb-sayt" desc="Markazlar uchun sahifa" onClick={() => navigate("/website-builder")} color="primary" />
          <QuickAction icon={Send} label="Telegram" desc="Bot bog'lash" onClick={() => scrollToSection("telegram")} color="accent" />
          <QuickAction icon={DollarSign} label="Buxgalter" desc="Moliya nazorati" onClick={() => navigate("/accountant")} color="success" />
          <QuickAction icon={Crown} label="Tariflar" desc="Plans menejmenti" onClick={() => scrollToSection("plans")} color="warning" />
        </div>

        {/* Tenants grid */}
        <section className="glass-strong p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg sm:text-xl font-heading font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              O'quv markazlari ({orgs.length})
            </h2>
            <button onClick={() => setShowCreateOrg(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition active:scale-95">
              <Plus className="w-4 h-4" /> Yangi markaz + admin
            </button>
          </div>

          {orgs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Hozircha markaz yo'q. "Yangi markaz" tugmasi orqali qo'shing.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {orgs.map((org: TenantRow) => {
                const s = statsByOrg[org.id] || { students: 0, teachers: 0, revenue: 0, attendance_rate: 0, lessons: 0 };
                return (
                  <motion.div key={org.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-xl space-y-3 border border-border hover:border-primary/40 transition-colors">
                    <div className="flex items-start gap-3">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <NovaLogo size="lg" showWordmark={false} className="flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{org.name}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">/{org.slug} · {org.org_type}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase ${TIER_COLORS[org.billing_tier] || ""}`}>
                        {org.billing_tier}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-card/50 rounded-lg p-2">
                        <div className="text-sm font-bold">{s.students}</div>
                        <div className="text-[9px] text-muted-foreground uppercase">O'quv</div>
                      </div>
                      <div className="bg-card/50 rounded-lg p-2">
                        <div className="text-sm font-bold">{s.teachers}</div>
                        <div className="text-[9px] text-muted-foreground uppercase">Ustoz</div>
                      </div>
                      <div className="bg-card/50 rounded-lg p-2">
                        <div className="text-sm font-bold">{s.attendance_rate}%</div>
                        <div className="text-[9px] text-muted-foreground uppercase">Davomat</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {Math.round(s.revenue).toLocaleString()} {org.currency || "UZS"}
                      </span>
                      <button onClick={() => toggleOrgStatus(org)}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold ${
                          org.status === "active" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                        }`}>
                        {org.status}
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">Tarif</label>
                      <select
                        value={(org as any).plan_id || ""}
                        onChange={(e) => assignPlan(org.id, e.target.value)}
                        className="w-full bg-card border border-border rounded-md px-2 py-1.5 text-xs"
                      >
                        <option value="">— Tarif tanlanmagan —</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.monthly_price.toLocaleString()} {p.currency})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Settings + Delete row */}
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <button onClick={() => setSettingsOrg(org)}
                        className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition flex items-center justify-center gap-2">
                        <Settings className="w-3.5 h-3.5" /> Sozlamalar
                      </button>
                      <button onClick={() => { setDeleteOrg(org); setDeleteConfirm(""); }}
                        title="Markazni butunlay o'chirish"
                        className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Telegram bot binding (SuperAdmin's own) */}
        <div id="telegram" className="scroll-mt-24"><TelegramBind /></div>

        {/* Plans management */}
        <div id="plans" className="scroll-mt-24"><PlansManager /></div>

        {/* Audit log (collapsible) */}
        <details className="glass-strong rounded-2xl overflow-hidden group">
          <summary className="cursor-pointer px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition list-none">
            <span className="font-heading font-bold text-lg flex items-center gap-2">
              📋 Audit jurnali
            </span>
            <span className="text-xs text-muted-foreground group-open:hidden">Ko'rsatish ▼</span>
            <span className="text-xs text-muted-foreground hidden group-open:inline">Yashirish ▲</span>
          </summary>
          <div className="px-4 sm:px-6 pb-4">
            <AuditLogList />
          </div>
        </details>

        {/* CRM Lead Pipeline */}
        <section className="glass-strong p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg sm:text-xl font-heading font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-accent" />
              Sotuv voronkasi ({leads.length})
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm">
                <option value="all">Barchasi</option>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Hozircha murojaat yo'q. <a href="/demo" className="text-primary underline">Demo formasini ko'rish</a>
            </p>
          ) : (
            <div className="space-y-2">
              {filteredLeads.map((lead: LeadRow) => (
                <motion.div key={lead.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="glass p-3 rounded-xl flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{lead.org_name}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{lead.org_type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{lead.contact_name} · {lead.contact_email}</p>
                    {lead.contact_phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{lead.contact_phone}</p>}
                    {lead.city && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city} · ~{lead.expected_students || "?"} o'quvchi</p>}
                    {lead.message && <p className="text-xs text-muted-foreground mt-1 italic">"{lead.message}"</p>}
                  </div>
                  <select value={lead.stage} onChange={(e) => updateLeadStage(lead.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-md border font-semibold ${STAGE_COLORS[lead.stage]}`}>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {lead.stage !== "won" && (
                    <button onClick={() => setProvisioningLead(lead)}
                      className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md font-semibold hover:opacity-90">
                      Markazga aylantirish <ChevronRight className="w-3 h-3 inline" />
                    </button>
                  )}
                  {lead.created_org_id && (
                    <span className="text-[10px] text-success flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Yaratilgan
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {(showCreateOrg || provisioningLead) && (
        <CreateOrgModal
          lead={provisioningLead}
          onClose={() => { setShowCreateOrg(false); setProvisioningLead(null); }}
          onCreated={() => { setShowCreateOrg(false); setProvisioningLead(null); refetch(); }}
        />
      )}

      {settingsOrg && (
        <OrgSettingsModal org={settingsOrg} onClose={() => setSettingsOrg(null)} onSaved={() => { setSettingsOrg(null); refetch(); }} />
      )}

      {deleteOrg && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !deleting && setDeleteOrg(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass-strong rounded-2xl p-6 max-w-md w-full border-2 border-destructive/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">Markazni butunlay o'chirish</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Bu amalni qaytarib bo'lmaydi. <span className="font-bold text-foreground">{deleteOrg.name}</span> markaziga tegishli barcha
                  ma'lumotlar (filiallar, darslar, to'lovlar, davomat, sayt va h.k.) butunlay o'chiriladi.
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Tasdiqlash uchun markaz nomini yozing:
              </label>
              <div className="text-xs font-mono text-destructive bg-destructive/5 border border-destructive/20 rounded px-2 py-1.5">
                {deleteOrg.name}
              </div>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Markaz nomini xuddi shunday yozing"
                className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-destructive/40 text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteOrg(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-muted/40 hover:bg-muted transition disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={performDeleteOrg}
                disabled={deleting || deleteConfirm.trim() !== deleteOrg.name}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-destructive text-destructive-foreground hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Markazni o'chirish
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

/* ----------------------- Quick action card ------------------------ */
const QuickAction = ({ icon: Icon, label, desc, onClick, color }: {
  icon: any; label: string; desc: string; onClick: () => void; color: string;
}) => {
  const colorMap: Record<string, { border: string; hover: string; bg: string; text: string }> = {
    primary: { border: "border-primary/20", hover: "hover:border-primary/40", bg: "bg-primary/15", text: "text-primary" },
    accent: { border: "border-accent/20", hover: "hover:border-accent/40", bg: "bg-accent/15", text: "text-accent" },
    success: { border: "border-success/20", hover: "hover:border-success/40", bg: "bg-success/15", text: "text-success" },
    warning: { border: "border-warning/20", hover: "hover:border-warning/40", bg: "bg-warning/15", text: "text-warning" },
  };
  const c = colorMap[color] || colorMap.primary;
  return (
  <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
    className={`glass-strong p-4 rounded-2xl text-left hover:bg-muted/30 transition flex items-center gap-3 border ${c.border} ${c.hover}`}>
    <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-5 h-5 ${c.text}`} />
    </div>
    <div className="min-w-0">
      <div className="font-semibold text-sm truncate">{label}</div>
      <div className="text-[11px] text-muted-foreground truncate">{desc}</div>
    </div>
  </motion.button>
  );
};

/* ----------------------- Per-tenant settings modal ------------------------ */
const OrgSettingsModal = ({ org, onClose, onSaved }: { org: TenantRow; onClose: () => void; onSaved: () => void }) => {
  const [features, setFeatures] = useState<Record<string, boolean>>(
    (org.features as Record<string, boolean>) || {}
  );
  const [name, setName] = useState(org.name);
  const [primary, setPrimary] = useState(org.primary_color);
  const [accent, setAccent] = useState(org.accent_color);
  const [saving, setSaving] = useState(false);

  const toggle = (k: string) => setFeatures({ ...features, [k]: !features[k] });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({ features: features as any, name, primary_color: primary, accent_color: accent })
      .eq("id", org.id);
    if (error) toast.error(error.message);
    else { toast.success("Saqlandi ✓"); window.dispatchEvent(new Event("nova:org-updated")); onSaved(); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-2xl p-6 max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground font-bold flex-shrink-0"
            style={{ background: `hsl(${org.primary_color})` }}>
            {org.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-heading font-bold">{org.name}</h3>
            <p className="text-xs text-muted-foreground">/{org.slug} · {org.org_type}</p>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Branding override */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Brending</h4>
            <Field label="Markaz nomi" value={name} onChange={setName} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Primary HSL" value={primary} onChange={setPrimary} />
              <Field label="Accent HSL" value={accent} onChange={setAccent} />
            </div>
          </div>

          {/* Feature toggles */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold flex items-center gap-2"><Power className="w-4 h-4 text-primary" /> Funksiyalar</h4>
            <p className="text-xs text-muted-foreground">Bu markaz uchun qaysi funksiyalar yoqilgan bo'lishi kerak. Tarif standartini bekor qiladi.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TENANT_TOGGLES.map((t) => {
                const on = !!features[t.key];
                return (
                  <button key={t.key} onClick={() => toggle(t.key)}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-2 ${on ? 'border-success/40 bg-success/5' : 'border-border/30 bg-muted/20 hover:border-border'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <t.icon className={`w-4 h-4 ${on ? 'text-success' : 'text-muted-foreground'} flex-shrink-0`} />
                      <span className="text-sm font-medium truncate">{t.label}</span>
                    </div>
                    <div className={`w-9 h-5 rounded-full p-0.5 transition ${on ? 'bg-success' : 'bg-muted-foreground/30'}`}>
                      <div className={`w-4 h-4 rounded-full bg-background transition-transform ${on ? 'translate-x-4' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-muted rounded-xl font-semibold text-sm hover:bg-muted/70 transition">
            Bekor qilish
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Saqlash"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ----------------------- Create org modal (existing) ------------------------ */
const CreateOrgModal = ({
  lead, onClose, onCreated,
}: { lead: LeadRow | null; onClose: () => void; onCreated: () => void }) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: lead?.org_name || "",
    slug: lead?.org_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "",
    org_type: lead?.org_type || "center",
    admin_email: lead?.contact_email || "",
    admin_name: lead?.contact_name || "",
    primary_color: "262 83% 58%",
    accent_color: "180 70% 50%",
    billing_tier: "basic",
    monthly_price: 0,
    max_students: 100,
    city: lead?.city || "",
    contact_phone: lead?.contact_phone || "",
  });

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("provision-tenant", {
        body: { ...form, lead_id: lead?.id },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || "Xatolik");
      toast.success(`${form.name} yaratildi! ${data.temp_password ? `Admin parol: ${data.temp_password}` : "Mavjud foydalanuvchi tayinlandi."}`,
        { duration: 20000 });
      onCreated();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-2xl p-6 max-w-lg w-full my-8" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-heading font-bold mb-4">
          {lead ? "Murojaatdan markaz yaratish" : "Yangi markaz + admin akkaunt"}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Markaz va uning admin akkauntini bir vaqtda yaratamiz. Admin parol avtomatik generatsiya qilinadi.
        </p>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          <Field label="Markaz nomi" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Slug (URL: inkluone.info/c/...)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v.toLowerCase() })} />
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Markaz turi</label>
            <select value={form.org_type} onChange={(e) => setForm({ ...form, org_type: e.target.value })}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm">
              <option value="center">O'quv markazi</option>
              <option value="school">Xususiy maktab</option>
              <option value="tutor">Repetitor</option>
            </select>
          </div>
          <Field label="Admin email (kirish uchun)" value={form.admin_email} onChange={(v) => setForm({ ...form, admin_email: v })} type="email" />
          <Field label="Admin to'liq ism" value={form.admin_name} onChange={(v) => setForm({ ...form, admin_name: v })} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Boshlang'ich tarif</label>
              <select value={form.billing_tier} onChange={(e) => setForm({ ...form, billing_tier: e.target.value })}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm">
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <Field label="Oylik narx (UZS)" value={String(form.monthly_price)}
              onChange={(v) => setForm({ ...form, monthly_price: Number(v) || 0 })} type="number" />
          </div>
          <Field label="Max o'quvchi" value={String(form.max_students)}
            onChange={(v) => setForm({ ...form, max_students: Number(v) || 0 })} type="number" />
          <Field label="Shahar" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="Telefon" value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-muted rounded-xl font-semibold text-sm">Bekor</button>
          <button onClick={submit} disabled={submitting || !form.name || !form.slug || !form.admin_email}
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Yaratish"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="text-xs text-muted-foreground block mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
  </div>
);

export default SuperAdminDashboard;
