import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";

const PLAN_PRICES: Record<string, number> = { free: 0, pro: 29, premium: 99, enterprise: 299 };

const AdminSubscriptions = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Record<string, { plan: string; price: number }>>({});

  const { data: subs, isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tour_company_subscriptions")
        .select("*, tour_companies(id, name, slug, logo_url)")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateSub = useMutation({
    mutationFn: async ({ id, plan, monthly_price_usd }: any) => {
      const { error } = await (supabase as any)
        .from("tour_company_subscriptions")
        .update({ plan, monthly_price_usd, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Obuna yangilandi");
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      setEditing({});
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><CreditCard className="h-7 w-7" /> Obunalarni boshqarish</h1>
        <p className="text-muted-foreground mt-1">Har bir tour kompaniyasining obuna rejasi va narxini boshqaring.</p>
      </div>

      <div className="grid gap-4">
        {subs?.map((s: any) => {
          const e = editing[s.id] || { plan: s.plan, price: Number(s.monthly_price_usd) };
          return (
            <Card key={s.id} className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {s.tour_companies?.logo_url ? <img src={s.tour_companies.logo_url} className="w-full h-full object-cover" /> : <CreditCard className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{s.tour_companies?.name}</div>
                <div className="text-xs text-muted-foreground">/{s.tour_companies?.slug}</div>
              </div>
              <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
              <Select
                value={e.plan}
                onValueChange={(v) => setEditing({ ...editing, [s.id]: { plan: v, price: PLAN_PRICES[v] ?? e.price } })}
              >
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={e.price}
                onChange={(ev) => setEditing({ ...editing, [s.id]: { ...e, price: Number(ev.target.value) } })}
                className="w-24"
              />
              <Button
                size="sm"
                disabled={updateSub.isPending}
                onClick={() => updateSub.mutate({ id: s.id, plan: e.plan, monthly_price_usd: e.price })}
              >
                Saqlash
              </Button>
            </Card>
          );
        })}
        {!subs?.length && <Card className="p-12 text-center text-muted-foreground">Hali obunalar yo'q</Card>}
      </div>
    </div>
  );
};

export default AdminSubscriptions;
