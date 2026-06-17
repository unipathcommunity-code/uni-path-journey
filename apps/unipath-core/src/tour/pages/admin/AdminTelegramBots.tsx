import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Bot, Plus } from "lucide-react";

const AdminTelegramBots = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company_id: "", bot_username: "", bot_token: "", is_active: true });

  const { data: bots, isLoading } = useQuery({
    queryKey: ["admin-tg-bots"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_telegram_bots")
        .select("id, company_id, bot_username, webhook_url, is_active, configured_by, notes, created_at, updated_at, tour_companies(name, slug, logo_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-list-bots"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("tour_companies")
        .select("id, name, slug")
        .eq("status", "approved");
      return data || [];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("company_telegram_bots").upsert({
        company_id: form.company_id,
        bot_username: form.bot_username,
        bot_token: form.bot_token,
        is_active: form.is_active,
      }, { onConflict: "company_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bot saqlandi");
      qc.invalidateQueries({ queryKey: ["admin-tg-bots"] });
      setOpen(false);
      setForm({ company_id: "", bot_username: "", bot_token: "", is_active: true });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: any) => {
      const { error } = await (supabase as any).from("company_telegram_bots").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tg-bots"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Bot className="h-7 w-7" /> Telegram botlar</h1>
          <p className="text-muted-foreground mt-1">Har bir kompaniya uchun shaxsiy telegram bot ulang.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Yangi bot</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Telegram bot ulash</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Kompaniya</Label>
                <select className="w-full mt-1 h-10 rounded-md border bg-background px-3 text-sm" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
                  <option value="">Tanlang</option>
                  {companies?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><Label>Bot username</Label><Input placeholder="@dildoratour_bot" value={form.bot_username} onChange={(e) => setForm({ ...form, bot_username: e.target.value })} /></div>
              <div><Label>Bot token</Label><Textarea placeholder="123456:ABC..." value={form.bot_token} onChange={(e) => setForm({ ...form, bot_token: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Faol</Label></div>
              <Button onClick={() => upsert.mutate()} disabled={!form.company_id || upsert.isPending} className="w-full">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-3">
          {bots?.map((b: any) => (
            <Card key={b.id} className="p-4 flex items-center gap-4">
              <Bot className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">{b.tour_companies?.name}</div>
                <div className="text-xs text-muted-foreground">{b.bot_username || "—"}</div>
              </div>
              <Switch checked={b.is_active} onCheckedChange={(v) => toggle.mutate({ id: b.id, is_active: v })} />
            </Card>
          ))}
          {!bots?.length && <Card className="p-12 text-center text-muted-foreground">Hali botlar ulanmagan</Card>}
        </div>
      )}
    </div>
  );
};

export default AdminTelegramBots;
