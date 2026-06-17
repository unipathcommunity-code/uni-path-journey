import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, ToggleLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const FEATURES = [
  { key: "telegram_bot", label: "Telegram bot", desc: "Buyurtmalar telegram'ga keladi" },
  { key: "custom_domain", label: "Custom domen", desc: "O'z domeni (dildora.com)" },
  { key: "ai_assistant", label: "AI yordamchi", desc: "Chat va planner" },
  { key: "advanced_analytics", label: "Kengaytirilgan analitika", desc: "Detalli hisobotlar" },
  { key: "team_invites", label: "Jamoa taklif", desc: "Staff a'zo qo'shish" },
  { key: "custom_branding", label: "To'liq brending", desc: "Logo, ranglar, font" },
  { key: "homepage_featured", label: "Asosiy sahifada tavsiya", desc: "Showcase'da ko'rinadi" },
];

const AdminFeatureOverrides = () => {
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState<string>("");

  const { data: companies } = useQuery({
    queryKey: ["companies-for-override"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("tour_companies").select("id, name, slug").eq("status", "approved").order("name");
      return data || [];
    },
  });

  const { data: overrides, isLoading } = useQuery({
    queryKey: ["overrides", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase as any).from("company_feature_overrides").select("*").eq("company_id", companyId);
      return data || [];
    },
  });

  const setFeature = useMutation({
    mutationFn: async ({ key, enabled }: any) => {
      const { error } = await (supabase as any).from("company_feature_overrides").upsert({
        company_id: companyId, feature_key: key, is_enabled: enabled,
      }, { onConflict: "company_id,feature_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Yangilandi");
      qc.invalidateQueries({ queryKey: ["overrides", companyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isEnabled = (k: string) => overrides?.find((o: any) => o.feature_key === k)?.is_enabled ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ToggleLeft className="h-7 w-7" /> Funksiya boshqaruvi</h1>
        <p className="text-muted-foreground mt-1">Har bir kompaniya uchun alohida funksiyalarni yoqing/o'chiring.</p>
      </div>

      <Card className="p-5">
        <label className="text-sm font-medium mb-2 block">Kompaniyani tanlang</label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger><SelectValue placeholder="Kompaniya tanlang..." /></SelectTrigger>
          <SelectContent>{companies?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </Card>

      {companyId && (
        isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="grid gap-3">
            {FEATURES.map((f) => (
              <Card key={f.key} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
                <Switch checked={isEnabled(f.key)} onCheckedChange={(v) => setFeature.mutate({ key: f.key, enabled: v })} />
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default AdminFeatureOverrides;
