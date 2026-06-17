import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Globe, Shield, Plus, Trash2, History, ChevronDown, Loader2,
  GraduationCap, BookOpen, Eye, Wallet, Search, Mail, UserMinus, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Member {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  roles: AppRole[];
}

interface AuditEntry {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_email: string | null;
  old_value: any;
  new_value: any;
}

/* Roles owners are allowed to grant inside their own org. `owner` and
 * `superadmin` are deliberately excluded — only the platform team can
 * grant those. */
const GRANTABLE_ROLES: AppRole[] = ["admin", "teacher", "student", "parent", "accountant"];

const roleMeta: Record<AppRole, { icon: any; color: string; label: string }> = {
  superadmin: { icon: Shield, color: "destructive", label: "Super-admin" },
  owner: { icon: Shield, color: "primary", label: "Owner" },
  admin: { icon: Shield, color: "destructive", label: "Admin" },
  teacher: { icon: BookOpen, color: "primary", label: "Ustoz" },
  student: { icon: GraduationCap, color: "accent", label: "O'quvchi" },
  parent: { icon: Eye, color: "warning", label: "Ota-ona" },
  accountant: { icon: Wallet, color: "success", label: "Buxgalter" },
};

/**
 * MembersPanel — owner/admin tool to see exactly who belongs to the
 * organization, what roles they hold and which public site (slug) they
 * can log in through. Every grant/revoke flows through `user_roles`,
 * which a database trigger mirrors into `audit_logs`, so changes are
 * fully traceable from the History tab.
 */
const MembersPanel = () => {
  const { user, hasRole } = useAuth();
  const { org } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [siteSlug, setSiteSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);

  const orgId = org?.id;

  const removeMember = async (m: Member) => {
    if (!orgId) return;
    if (m.user_id === user?.id) {
      toast.error("O'zingizni o'chirib bo'lmaydi");
      return;
    }
    setBusyUserId(m.user_id);
    try {
      const { error } = await supabase.rpc("remove_user_from_org", { _target_user_id: m.user_id });
      if (error) throw error;
      toast.success(`${m.full_name || "Foydalanuvchi"} markazdan chiqarildi`);
      setConfirmRemove(null);
      load();
    } catch (e: any) {
      const msg = e.message || "Xatolik";
      const friendly =
        msg.includes("cannot_remove_owner_or_superadmin")
          ? "Owner yoki super-adminni o'chirib bo'lmaydi"
          : msg.includes("forbidden")
          ? "Sizda ruxsat yo'q"
          : msg.includes("target_not_in_org")
          ? "Bu foydalanuvchi sizning markazingizda emas"
          : msg;
      toast.error(friendly);
    } finally {
      setBusyUserId(null);
    }
  };

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [profRes, rolesRes, siteRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("organization_id", orgId)
        .order("full_name"),
      supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("organization_id", orgId),
      supabase
        .from("websites")
        .select("slug, is_published")
        .eq("organization_id", orgId)
        .maybeSingle(),
    ]);

    const rolesByUser = new Map<string, AppRole[]>();
    (rolesRes.data || []).forEach((r: any) => {
      if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, []);
      rolesByUser.get(r.user_id)!.push(r.role);
    });

    const list: Member[] = (profRes.data || []).map((p: any) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      roles: rolesByUser.get(p.user_id) || [],
    }));

    setMembers(list);
    setSiteSlug((siteRes.data as any)?.slug || null);
    setLoading(false);
  };

  const loadAudit = async () => {
    if (!orgId) return;
    setAuditLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("id, created_at, action, entity_type, entity_id, actor_email, old_value, new_value")
      .eq("organization_id", orgId)
      .in("action", ["role_assigned", "role_revoked"])
      .order("created_at", { ascending: false })
      .limit(50);
    setAudit((data as any) || []);
    setAuditLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [orgId]);
  useEffect(() => { if (showAudit) loadAudit(); /* eslint-disable-next-line */ }, [showAudit, orgId]);

  /* Realtime: when the trigger writes a new audit row, refresh — owners
   * sitting on this panel see other admins' grants live. */
  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`members-audit-${orgId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs", filter: `organization_id=eq.${orgId}` },
        () => { if (showAudit) loadAudit(); load(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, showAudit]);

  const toggleRole = async (m: Member, role: AppRole, has: boolean) => {
    if (!orgId) return;
    if (m.user_id === user?.id && role === "owner") {
      toast.error("O'zingizdan owner rolini olib tashlay olmaysiz");
      return;
    }
    setBusyUserId(m.user_id);
    try {
      if (has) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", m.user_id)
          .eq("role", role)
          .eq("organization_id", orgId);
        if (error) throw error;
        toast.success(`${roleMeta[role].label} olib tashlandi`);
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: m.user_id, role, organization_id: orgId });
        if (error) throw error;
        toast.success(`${roleMeta[role].label} berildi`);
      }
      load();
    } catch (e: any) {
      toast.error(e.message || "Saqlashda xatolik");
    } finally {
      setBusyUserId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        (m.full_name || "").toLowerCase().includes(q) ||
        m.roles.some((r) => r.toLowerCase().includes(q))
    );
  }, [members, search]);

  const loginUrl = siteSlug ? `${window.location.origin}/site/${siteSlug}/login` : null;

  if (!hasRole("owner") && !hasRole("admin") && !hasRole("superadmin")) return null;

  return (
    <section className="glass-strong p-4 sm:p-6 rounded-2xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold">Markaz a'zolari</h2>
            <p className="text-xs text-muted-foreground">
              {members.length} ta foydalanuvchi · rollarni boshqaring va tarixni ko'ring
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAudit((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
            showAudit
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <History className="w-3.5 h-3.5" /> O'zgarishlar tarixi
        </button>
      </div>

      {/* Site slug binding card */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-3 flex items-start gap-3">
        <Globe className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Markaz sayti (login manzili)
          </p>
          {loginUrl ? (
            <>
              <a
                href={loginUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-mono text-primary hover:underline break-all"
              >
                {loginUrl}
              </a>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Faqat shu yerda ro'yxatdan o'tgan yoki claim qilingan foydalanuvchilar bu markaz a'zolari sifatida belgilanadi. Ushbu ro'yxat aynan shularni ko'rsatmoqda.
              </p>
            </>
          ) : (
            <p className="text-xs text-warning">
              Sayt hali yaratilmagan yoki nashr qilinmagan. Avval Website Builder'da slug oching.
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki rol bo'yicha qidirish..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Members list */}
      {loading ? (
        <div className="text-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin inline" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? "Hech narsa topilmadi" : "Hali a'zolar yo'q"}
        </p>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {filtered.map((m) => {
            const isOpen = expanded === m.user_id;
            const initials = (m.full_name || "?")
              .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={m.user_id} className="rounded-xl border border-border bg-muted/15 overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : m.user_id)}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/30 transition"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    {m.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{m.full_name || "Nomsiz"}</p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {m.roles.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground">Rolsiz</span>
                      ) : (
                        m.roles.map((r) => {
                          const meta = roleMeta[r];
                          return (
                            <span
                              key={r}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold bg-${meta.color}/15 text-${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/60"
                    >
                      <div className="p-3 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          Rollarni boshqarish
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {GRANTABLE_ROLES.map((r) => {
                            const has = m.roles.includes(r);
                            const meta = roleMeta[r];
                            const Icon = meta.icon;
                            return (
                              <button
                                key={r}
                                disabled={busyUserId === m.user_id}
                                onClick={() => toggleRole(m, r, has)}
                                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition border ${
                                  has
                                    ? `bg-${meta.color}/15 text-${meta.color} border-${meta.color}/30`
                                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                                } ${busyUserId === m.user_id ? "opacity-50" : ""}`}
                              >
                                <Icon className="w-3 h-3" />
                                {has ? "✓ " : <Plus className="w-3 h-3" />}
                                {meta.label}
                              </button>
                            );
                          })}
                        </div>
                        {m.roles.includes("owner") && (
                          <p className="text-[11px] text-warning flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Owner roli faqat super-admin tomonidan o'zgartiriladi.
                          </p>
                        )}

                        {/* Danger zone: kick from org */}
                        {!m.roles.includes("owner") && !m.roles.includes("superadmin") && m.user_id !== user?.id && (
                          <div className="pt-2 mt-2 border-t border-destructive/20">
                            <button
                              onClick={() => setConfirmRemove(m)}
                              disabled={busyUserId === m.user_id}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition disabled:opacity-50"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Markazdan chiqarish
                            </button>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Barcha rollari olib tashlanadi. Hisob saqlanadi, lekin bu markazga kira olmaydi.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm remove dialog */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmRemove(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong rounded-2xl p-6 max-w-md w-full border border-destructive/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg">Markazdan chiqarishni tasdiqlang</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground">{confirmRemove.full_name || "Bu foydalanuvchi"}</span> markazingizdan butunlay olib tashlanadi.
                    Barcha rollari ({confirmRemove.roles.join(", ") || "yo'q"}) o'chiriladi.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmRemove(null)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-muted/40 hover:bg-muted transition"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => removeMember(confirmRemove)}
                  disabled={busyUserId === confirmRemove.user_id}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-destructive text-destructive-foreground hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {busyUserId === confirmRemove.user_id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <UserMinus className="w-3.5 h-3.5" /> Ha, chiqarish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit history */}
      <AnimatePresence>
        {showAudit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border pt-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">So'nggi rol o'zgarishlari</h3>
            </div>
            {auditLoading ? (
              <div className="text-center py-4"><Loader2 className="w-5 h-5 text-primary animate-spin inline" /></div>
            ) : audit.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Hozircha yozuvlar yo'q</p>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {audit.map((a) => {
                  const isGrant = a.action === "role_assigned";
                  const v = isGrant ? a.new_value : a.old_value;
                  const role = v?.role || "?";
                  const target = v?.target_email || a.entity_id?.slice(0, 8) || "?";
                  return (
                    <div
                      key={a.id}
                      className={`text-xs p-2.5 rounded-lg border flex items-start gap-2 ${
                        isGrant
                          ? "bg-success/5 border-success/20"
                          : "bg-destructive/5 border-destructive/20"
                      }`}
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isGrant ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      }`}>
                        {isGrant ? "+" : "−"} {role}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-[11px]">{target}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {a.actor_email || "tizim"} · {new Date(a.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default MembersPanel;
