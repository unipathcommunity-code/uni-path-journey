import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, ArrowDown, ArrowUp, Edit2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface AuditRow {
  id: string;
  organization_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: any;
  new_value: any;
  created_at: string;
}

const ACTION_META: Record<string, { icon: any; color: string; label: string }> = {
  plan_changed: { icon: ArrowUp, color: "text-primary bg-primary/15", label: "Tarif o'zgartirildi" },
  status_changed: { icon: ArrowDown, color: "text-warning bg-warning/15", label: "Status o'zgardi" },
  features_changed: { icon: Edit2, color: "text-accent bg-accent/15", label: "Modullar o'zgartirildi" },
  org_created: { icon: Building2, color: "text-success bg-success/15", label: "Markaz yaratildi" },
  plan_updated: { icon: Edit2, color: "text-primary bg-primary/15", label: "Tarif tahrirlandi" },
};

const AuditLogList = ({ organizationId }: { organizationId?: string }) => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [planNames, setPlanNames] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (organizationId) q = q.eq("organization_id", organizationId);
    const { data } = await q;
    setRows((data as AuditRow[]) || []);

    // Resolve plan ids → names for nicer rendering
    const ids = new Set<string>();
    (data || []).forEach((r: any) => {
      if (r.old_value?.plan_id) ids.add(r.old_value.plan_id);
      if (r.new_value?.plan_id) ids.add(r.new_value.plan_id);
    });
    if (ids.size > 0) {
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("id, name")
        .in("id", Array.from(ids));
      const map: Record<string, string> = {};
      (plans || []).forEach((p: any) => (map[p.id] = p.name));
      setPlanNames(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const renderDelta = (r: AuditRow) => {
    if (r.action === "plan_changed") {
      const oldName = r.old_value?.plan_id ? planNames[r.old_value.plan_id] || "—" : "—";
      const newName = r.new_value?.plan_id ? planNames[r.new_value.plan_id] || "—" : "—";
      return (
        <span>
          <span className="text-muted-foreground line-through">{oldName}</span>{" → "}
          <span className="text-primary font-semibold">{newName}</span>
        </span>
      );
    }
    if (r.action === "status_changed") {
      return (
        <span>
          <span className="text-muted-foreground line-through">{r.old_value?.status}</span>{" → "}
          <span className="text-warning font-semibold">{r.new_value?.status}</span>
        </span>
      );
    }
    if (r.action === "features_changed") {
      const oldKeys = Object.entries(r.old_value?.features || {}).filter(([, v]) => v).map(([k]) => k);
      const newKeys = Object.entries(r.new_value?.features || {}).filter(([, v]) => v).map(([k]) => k);
      const added = newKeys.filter((k) => !oldKeys.includes(k));
      const removed = oldKeys.filter((k) => !newKeys.includes(k));
      return (
        <span className="text-xs">
          {added.length > 0 && <span className="text-success mr-2">+{added.join(", ")}</span>}
          {removed.length > 0 && <span className="text-destructive">-{removed.join(", ")}</span>}
          {added.length === 0 && removed.length === 0 && <span className="text-muted-foreground">o'zgarish yo'q</span>}
        </span>
      );
    }
    if (r.action === "plan_updated") {
      const changes: string[] = [];
      if (r.old_value?.name !== r.new_value?.name) changes.push("nomi");
      if (r.old_value?.monthly_price !== r.new_value?.monthly_price)
        changes.push(`narx (${r.old_value?.monthly_price}→${r.new_value?.monthly_price})`);
      if (JSON.stringify(r.old_value?.features) !== JSON.stringify(r.new_value?.features)) changes.push("modullar");
      if (r.old_value?.is_active !== r.new_value?.is_active) changes.push("faollik");
      return <span className="text-xs text-muted-foreground">{changes.join(", ") || "minor"}</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <section className="glass-strong p-4 sm:p-6 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-success" />
        <h2 className="text-lg sm:text-xl font-heading font-bold">Audit jurnali</h2>
        <span className="text-xs text-muted-foreground ml-auto">Oxirgi {rows.length} ta hodisa</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Hozircha hodisalar yo'q</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const meta = ACTION_META[r.action] || { icon: Edit2, color: "text-muted-foreground bg-muted", label: r.action };
            const Icon = meta.icon;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="glass p-3 rounded-xl flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{meta.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.actor_email || "tizim"} · {r.entity_type}
                  </div>
                  <div className="text-sm mt-1">{renderDelta(r)}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AuditLogList;
