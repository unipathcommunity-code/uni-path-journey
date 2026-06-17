import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Users, GraduationCap, MapPin, Phone, Loader2, Trash2, Pencil, Check, X, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useBranch } from "@/hooks/useBranch";
import { toast } from "sonner";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/admin/StatCard";
import BranchInsights from "@/components/admin/BranchInsights";
import EdgeHealthPanel from "@/components/owner/EdgeHealthPanel";
import MembersPanel from "@/components/owner/MembersPanel";
import TuitionPlansPanel from "@/components/owner/TuitionPlansPanel";
import TeacherContractsPanel from "@/components/owner/TeacherContractsPanel";
import TeacherEarningsBreakdown from "@/components/admin/TeacherEarningsBreakdown";
import { useOrgTerminology } from "@/hooks/useOrgTerminology";

interface Branch {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_main: boolean;
  is_active: boolean;
}

interface StaffRow {
  user_id: string;
  full_name: string | null;
  roles: string[];
  branch_ids: string[];
}

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const { org } = useOrganization();
  const { activeBranchId, activeBranch } = useBranch();
  const T = useOrgTerminology();

  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [editing, setEditing] = useState<Partial<Branch> | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", address: "", phone: "" });
  // When ON, only show staff/data for the currently selected branch
  const [filterByActive, setFilterByActive] = useState(true);

  const orgId = org?.id;

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [bRes, profRes, rolesRes, baRes] = await Promise.all([
      supabase.from("branches").select("*").eq("organization_id", orgId).order("is_main", { ascending: false }).order("name"),
      supabase.from("profiles").select("user_id, full_name").eq("organization_id", orgId),
      supabase.from("user_roles").select("user_id, role").eq("organization_id", orgId),
      supabase.from("branch_assignments").select("user_id, branch_id").eq("organization_id", orgId),
    ]);
    setBranches((bRes.data as Branch[]) || []);

    // Build staff list = anyone with admin/teacher/accountant role
    const staffRoles = new Set(["admin", "teacher", "accountant"]);
    const rolesByUser = new Map<string, string[]>();
    (rolesRes.data || []).forEach((r: any) => {
      if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, []);
      rolesByUser.get(r.user_id)!.push(r.role);
    });
    const branchesByUser = new Map<string, string[]>();
    (baRes.data || []).forEach((a: any) => {
      if (!branchesByUser.has(a.user_id)) branchesByUser.set(a.user_id, []);
      branchesByUser.get(a.user_id)!.push(a.branch_id);
    });
    const rows: StaffRow[] = (profRes.data || [])
      .map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        roles: rolesByUser.get(p.user_id) || [],
        branch_ids: branchesByUser.get(p.user_id) || [],
      }))
      .filter((s) => s.roles.some((r) => staffRoles.has(r)));
    setStaff(rows);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [orgId]);

  if (!user) return null;
  if (!hasRole("owner") && !hasRole("superadmin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-strong p-8 text-center max-w-sm">
          <Building2 className="w-12 h-12 mx-auto text-warning mb-3" />
          <h2 className="text-xl font-heading font-bold mb-2">Owner Only</h2>
          <p className="text-sm text-muted-foreground">Bu sahifaga faqat markaz egasi kira oladi.</p>
        </div>
      </div>
    );
  }

  const createBranch = async () => {
    if (!form.name.trim() || !orgId) return toast.error("Filial nomi shart");
    const { error } = await supabase.from("branches").insert({
      organization_id: orgId,
      name: form.name.trim(),
      city: form.city.trim() || null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Filial yaratildi");
    setCreating(false);
    setForm({ name: "", city: "", address: "", phone: "" });
    window.dispatchEvent(new Event("nova:branches-updated"));
    load();
  };

  const saveBranch = async () => {
    if (!editing?.id) return;
    const { error } = await supabase
      .from("branches")
      .update({
        name: editing.name || "",
        city: editing.city || null,
        address: editing.address || null,
        phone: editing.phone || null,
        is_active: editing.is_active ?? true,
      })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Saqlandi");
    setEditing(null);
    window.dispatchEvent(new Event("nova:branches-updated"));
    load();
  };

  const deleteBranch = async (b: Branch) => {
    if (b.is_main) return toast.error("Asosiy filialni o'chirib bo'lmaydi");
    if (!confirm(`${b.name} filialini o'chirasizmi?`)) return;
    const { error } = await supabase.from("branches").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success("O'chirildi");
    window.dispatchEvent(new Event("nova:branches-updated"));
    load();
  };

  const toggleAssignment = async (userId: string, branchId: string, has: boolean) => {
    if (!orgId) return;
    if (has) {
      await supabase.from("branch_assignments").delete().eq("user_id", userId).eq("branch_id", branchId);
    } else {
      await supabase.from("branch_assignments").insert({ user_id: userId, branch_id: branchId, organization_id: orgId });
    }
    load();
  };

  // When filter is on, only count staff assigned to the active branch
  const visibleStaff = filterByActive && activeBranchId
    ? staff.filter((s) => s.branch_ids.includes(activeBranchId))
    : staff;
  const totalStaff = visibleStaff.length;
  const activeBranches = branches.filter((b) => b.is_active).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-warning animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-3 sm:p-6 pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-warning/5 blur-[200px] pointer-events-none" />

      <DashboardHeader
        layer="owner"
        title={org?.name || T.institution}
        subtitle={
          filterByActive && activeBranch
            ? `${activeBranch.name} · ${totalStaff} xodim`
            : `${T.ownerLabel} · ${T.branchPlural.toLowerCase()} va xodimlar`
        }
        actions={
          hasRole("admin") || hasRole("superadmin") ? (
            <button onClick={() => navigate("/admin")}
              className="glass p-2 rounded-xl border border-primary/40 hover:bg-primary/10 transition"
              title="Admin paneliga o'tish">
              <Users className="w-4 h-4 text-primary" />
            </button>
          ) : undefined
        }
      />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Branch filter toggle */}
        {branches.length > 1 && (
          <div className="flex items-center justify-between glass rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-warning" />
              <span className="text-muted-foreground">Ko'rinish:</span>
              <span className="font-semibold">
                {filterByActive && activeBranch ? activeBranch.name : `Barcha ${T.branchPlural.toLowerCase()}`}
              </span>
            </div>
            <button
              onClick={() => setFilterByActive((v) => !v)}
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition ${
                filterByActive
                  ? "bg-warning/15 text-warning border border-warning/30"
                  : "bg-muted text-muted-foreground border border-border hover:bg-muted/70"
              }`}
            >
              {filterByActive ? `Faol ${T.branch.toLowerCase()}` : "Barchasi"}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatCard icon={Building2} label={T.branchPlural} value={branches.length} sublabel={`${activeBranches} faol`} color="warning" delay={0.05} />
          <StatCard icon={Users} label="Xodimlar" value={totalStaff} color="primary" delay={0.1} />
          <StatCard icon={Users} label="Adminlar" value={visibleStaff.filter(s => s.roles.includes("admin")).length} color="accent" delay={0.15} />
          <StatCard icon={GraduationCap} label="Ustozlar" value={visibleStaff.filter(s => s.roles.includes("teacher")).length} color="success" delay={0.2} />
        </div>

        {/* Edge function health */}
        <EdgeHealthPanel />

        {/* Members + roles + site slug + audit history */}
        <MembersPanel />

        {/* To'lovlar moduli — fan narxlari + o'qituvchi kelishuvlari (faqat direktor) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TuitionPlansPanel />
          <TeacherContractsPanel />
        </div>

        {/* O'qituvchi daromadi parchalanishi (Asos · Foiz · Dars · Bonus) */}
        <TeacherEarningsBreakdown />

        {/* Branches */}
        <section className="glass-strong p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-heading font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-warning" /> {T.branchPlural}
            </h2>
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-3 py-2 bg-warning text-warning-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition active:scale-95">
              <Plus className="w-4 h-4" /> Yangi {T.branch.toLowerCase()}
            </button>
          </div>

          {creating && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="mb-4 p-4 rounded-xl bg-warning/5 border border-warning/30 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className="px-3 py-2 rounded-lg bg-card border border-border text-sm" placeholder="Filial nomi *"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className="px-3 py-2 rounded-lg bg-card border border-border text-sm" placeholder="Shahar"
                  value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <input className="px-3 py-2 rounded-lg bg-card border border-border text-sm" placeholder="Manzil"
                  value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <input className="px-3 py-2 rounded-lg bg-card border border-border text-sm" placeholder="Telefon"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setCreating(false); setForm({ name: "", city: "", address: "", phone: "" }); }}
                  className="px-3 py-1.5 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-muted/70">Bekor</button>
                <button onClick={createBranch} className="px-3 py-1.5 rounded-lg text-sm bg-warning text-warning-foreground font-semibold hover:opacity-90">Yaratish</button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {branches.map((b) => {
              const isEdit = editing?.id === b.id;
              const isActiveBr = b.id === activeBranchId;
              const openTimeline = () => {
                if (isEdit) return;
                navigate(`/admin?branch=${b.id}`);
              };
              return (
                <div
                  key={b.id}
                  onClick={openTimeline}
                  role={isEdit ? undefined : "button"}
                  tabIndex={isEdit ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!isEdit && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      openTimeline();
                    }
                  }}
                  className={`glass p-4 rounded-xl space-y-2 border transition ${
                    isEdit
                      ? "border-border"
                      : isActiveBr
                      ? "border-warning/60 bg-warning/5 ring-1 ring-warning/30 cursor-pointer"
                      : "border-border cursor-pointer hover:border-warning/50 hover:bg-warning/5 focus:outline-none focus:ring-2 focus:ring-warning/40"
                  }`}
                >
                  {isEdit ? (
                    <>
                      <input className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm font-semibold"
                        value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                      <input className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-xs"
                        placeholder="Shahar" value={editing.city || ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
                      <input className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-xs"
                        placeholder="Manzil" value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
                      <input className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-xs"
                        placeholder="Telefon" value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => setEditing(null)} className="p-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/70"><X className="w-3.5 h-3.5" /></button>
                        <button onClick={saveBranch} className="p-1.5 rounded bg-success text-success-foreground"><Check className="w-3.5 h-3.5" /></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm truncate">{b.name}</h3>
                            {b.is_main && <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-bold">MAIN</span>}
                            {isActiveBr && <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/20 text-success font-bold">FAOL</span>}
                          </div>
                          {b.city && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{b.city}</p>}
                          {b.phone && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{b.phone}</p>}
                          {b.address && <p className="text-[11px] text-muted-foreground truncate">{b.address}</p>}
                        </div>
                        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setEditing(b)} className="p-1.5 rounded bg-muted/40 hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          {!b.is_main && (
                            <button onClick={() => deleteBranch(b)} className="p-1.5 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                        {staff.filter(s => s.branch_ids.includes(b.id)).length} ta xodim biriktirilgan · <span className="text-warning font-semibold">batafsil →</span>
                      </div>
                      <BranchInsights
                        branchId={b.id}
                        branchName={b.name}
                        staffCount={staff.filter((s) => s.branch_ids.includes(b.id)).length}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Staff assignments matrix */}
        <section className="glass-strong p-4 sm:p-6 rounded-2xl">
          <h2 className="text-lg font-heading font-bold flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" /> Xodimlarni {T.branch.toLowerCase()}ga biriktirish
          </h2>
          {visibleStaff.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {filterByActive && activeBranch
                ? `${activeBranch.name} ${T.branch.toLowerCase()}iga biriktirilgan xodim yo'q.`
                : "Hali xodim yo'q. Avval admin/ustoz qo'shing."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="pb-2 pr-4">Xodim</th>
                    <th className="pb-2 pr-4">Roli</th>
                    {branches.map((b) => (
                      <th key={b.id} className="pb-2 px-2 text-center text-[10px] font-semibold">
                        {b.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleStaff.map((s) => (
                    <tr key={s.user_id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-2 pr-4 font-medium">{s.full_name || "—"}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-1 flex-wrap">
                          {s.roles.map((r) => (
                            <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">{r}</span>
                          ))}
                        </div>
                      </td>
                      {branches.map((b) => {
                        const has = s.branch_ids.includes(b.id);
                        return (
                          <td key={b.id} className="py-2 px-2 text-center">
                            <button
                              onClick={() => toggleAssignment(s.user_id, b.id, has)}
                              className={`w-6 h-6 rounded transition ${has ? "bg-success text-success-foreground" : "bg-muted/40 hover:bg-muted text-muted-foreground"}`}
                              title={has ? "Biriktirilgan — bosib olib tashlang" : "Biriktirish"}
                            >
                              {has ? <Check className="w-3.5 h-3.5 mx-auto" /> : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OwnerDashboard;
