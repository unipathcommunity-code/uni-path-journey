import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FEATURES = [
  { key: "telegram_bot", label: "Telegram" },
  { key: "custom_domain", label: "Domen" },
  { key: "ai_assistant", label: "AI" },
  { key: "advanced_analytics", label: "Analitika+" },
  { key: "team_invites", label: "Jamoa" },
  { key: "custom_branding", label: "Brending" },
  { key: "homepage_featured", label: "Featured" },
];

const AdminFeatureMatrix = () => {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: companies } = useQuery({
    queryKey: ["fmatrix-companies"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("tour_companies")
        .select("id, name, slug, logo_url, primary_color").eq("status", "approved").order("name");
      return data || [];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["fmatrix-overrides"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("company_feature_overrides").select("*");
      return data || [];
    },
  });

  const map = useMemo(() => {
    const m = new Map<string, boolean>();
    (overrides || []).forEach((o: any) => m.set(`${o.company_id}::${o.feature_key}`, o.is_enabled));
    return m;
  }, [overrides]);

  const toggle = useMutation({
    mutationFn: async ({ companyId, key, val }: any) => {
      const { error } = await (supabase as any).from("company_feature_overrides").upsert(
        { company_id: companyId, feature_key: key, is_enabled: val },
        { onConflict: "company_id,feature_key" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fmatrix-overrides"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(
    () => (companies || []).filter((c: any) => !q.trim() || c.name.toLowerCase().includes(q.toLowerCase())),
    [companies, q]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Funksiyalar</h1>
          <p className="text-sm text-muted-foreground mt-1">Har bir kompaniyaga maxsus huquqlar</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kompaniya..." className="pl-9 h-9 rounded-xl" />
        </div>
      </div>

      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sticky left-0 bg-muted/40 z-10">
                  Kompaniya
                </th>
                {FEATURES.map((f) => (
                  <th key={f.key} className="text-center px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any, i: number) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-t border-border/60 hover:bg-muted/20"
                >
                  <td className="px-4 py-2.5 sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2.5">
                      {c.logo_url ? (
                        <img src={c.logo_url} className="h-7 w-7 rounded-lg object-cover" alt="" />
                      ) : (
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[11px] font-semibold"
                             style={{ background: c.primary_color || "#4B8BF5" }}>{c.name.charAt(0)}</div>
                      )}
                      <span className="font-medium text-sm truncate max-w-[180px]">{c.name}</span>
                    </div>
                  </td>
                  {FEATURES.map((f) => {
                    const k = `${c.id}::${f.key}`;
                    const enabled = map.get(k) ?? false;
                    return (
                      <td key={f.key} className="text-center px-3 py-2.5">
                        <Switch
                          checked={enabled}
                          onCheckedChange={(v) => {
                            map.set(k, v);
                            toggle.mutate({ companyId: c.id, key: f.key, val: v });
                          }}
                        />
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={FEATURES.length + 1} className="text-center py-12 text-sm text-muted-foreground">
                    Kompaniya topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminFeatureMatrix;
