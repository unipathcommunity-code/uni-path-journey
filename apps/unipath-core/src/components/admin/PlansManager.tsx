import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Check, X, Edit2, Save, Loader2 } from "lucide-react";
import { usePlans, type SubscriptionPlan } from "@/hooks/usePlans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ALL_FEATURES: { key: string; label: string }[] = [
  { key: "payments", label: "To'lovlar" },
  { key: "crm", label: "CRM" },
  { key: "website_builder", label: "Veb-sayt builder" },
  { key: "telegram_bot", label: "Telegram bot" },
  { key: "advanced_analytics", label: "Kengaytirilgan analitika" },
  { key: "white_label", label: "White-label" },
  { key: "custom_domain", label: "O'z domen" },
  { key: "priority_support", label: "Ustuvor qo'llab-quvvatlash" },
  { key: "api_access", label: "API kirish" },
];

const TIER_COLORS: Record<string, string> = {
  starter: "bg-muted text-muted-foreground",
  basic: "bg-muted text-muted-foreground",
  pro: "bg-primary/15 text-primary",
  premium: "bg-accent/15 text-accent",
  enterprise: "bg-warning/15 text-warning",
};

const PlansManager = () => {
  const { plans, loading, refresh } = usePlans();
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleFeature = (key: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      features: { ...editing.features, [key]: !editing.features[key] },
    });
  };

  const savePlan = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("subscription_plans")
      .update({
        name: editing.name,
        monthly_price: editing.monthly_price,
        yearly_price: editing.yearly_price,
        max_students: editing.max_students,
        max_teachers: editing.max_teachers,
        features: editing.features,
        description: editing.description,
        highlight: editing.highlight,
        is_active: editing.is_active,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Tarif yangilandi");
      setEditing(null);
      refresh();
      window.dispatchEvent(new Event("unipath:plan-updated"));
    }
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg sm:text-xl font-heading font-bold flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Tariflar boshqaruvi ({plans.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {plans.map((p) => {
          const enabledCount = Object.values(p.features).filter(Boolean).length;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-4 rounded-xl border border-border space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold truncate">{p.name}</h3>
                    {p.highlight && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-bold uppercase">
                        Top
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {p.org_type} ·{" "}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase ${TIER_COLORS[p.tier] || ""}`}>
                      {p.tier}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setEditing(p)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition"
                  title="Tahrirlash"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-2xl font-heading font-black">
                {p.monthly_price.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground"> {p.currency}/oy</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-card/50 rounded-lg p-2">
                  <div className="text-sm font-bold">
                    {p.max_students >= 999999 ? "∞" : p.max_students}
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase">O'quvchi</div>
                </div>
                <div className="bg-card/50 rounded-lg p-2">
                  <div className="text-sm font-bold">
                    {p.max_teachers >= 999999 ? "∞" : p.max_teachers}
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase">Ustoz</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{enabledCount}</span> / {ALL_FEATURES.length} modul yoqilgan
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-xl">Tarif tahrirlash</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-muted/50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Nom</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Kod</label>
                <input
                  value={editing.code}
                  disabled
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm opacity-60"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Oylik narx (UZS)</label>
                <input
                  type="number"
                  value={editing.monthly_price}
                  onChange={(e) => setEditing({ ...editing, monthly_price: Number(e.target.value) })}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Yillik narx (UZS)</label>
                <input
                  type="number"
                  value={editing.yearly_price ?? 0}
                  onChange={(e) => setEditing({ ...editing, yearly_price: Number(e.target.value) })}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Max o'quvchi</label>
                <input
                  type="number"
                  value={editing.max_students}
                  onChange={(e) => setEditing({ ...editing, max_students: Number(e.target.value) })}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Max ustoz</label>
                <input
                  type="number"
                  value={editing.max_teachers}
                  onChange={(e) => setEditing({ ...editing, max_teachers: Number(e.target.value) })}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Tavsif</label>
              <textarea
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={2}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.highlight}
                  onChange={(e) => setEditing({ ...editing, highlight: e.target.checked })}
                />
                Eng mashhur (highlight)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                Faol
              </label>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Modullar</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ALL_FEATURES.map((f) => {
                  const on = Boolean(editing.features[f.key]);
                  return (
                    <button
                      key={f.key}
                      onClick={() => toggleFeature(f.key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                        on
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {on ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/50"
              >
                Bekor qilish
              </button>
              <button
                onClick={savePlan}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Saqlash
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default PlansManager;
