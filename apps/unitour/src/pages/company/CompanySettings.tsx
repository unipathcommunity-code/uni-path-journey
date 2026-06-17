import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, Mail, MapPin, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";

const Field = ({ label, ...p }: any) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Input className="rounded-xl" {...p} />
  </div>
);

const CompanySettings = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: "", phone: "", whatsapp: "", telegram: "", instagram: "", facebook: "", address: "", city: "" });

  useEffect(() => {
    if (company) setForm({
      email: company.email ?? "", phone: company.phone ?? "", whatsapp: company.whatsapp ?? "",
      telegram: company.telegram ?? "", instagram: company.instagram ?? "", facebook: company.facebook ?? "",
      address: company.address ?? "", city: company.city ?? "",
    });
  }, [company]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("tour_companies").update(form).eq("id", company!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saqlandi"); qc.invalidateQueries({ queryKey: ["my-company"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!company) return null;
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sozlamalar</h1>
        <p className="text-sm text-muted-foreground mt-1">Aloqa va ijtimoiy tarmoqlar</p>
      </div>

      <Card className="p-5 rounded-2xl border-border/60 space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h3 className="font-medium text-sm">Aloqa</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} />
          <Field label="Telefon" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} />
          <Field label="WhatsApp" value={form.whatsapp} onChange={(e: any) => setForm({ ...form, whatsapp: e.target.value })} />
          <Field label="Telegram" value={form.telegram} onChange={(e: any) => setForm({ ...form, telegram: e.target.value })} placeholder="@username" />
          <Field label="Instagram" value={form.instagram} onChange={(e: any) => setForm({ ...form, instagram: e.target.value })} />
          <Field label="Facebook" value={form.facebook} onChange={(e: any) => setForm({ ...form, facebook: e.target.value })} />
        </div>
      </Card>

      <Card className="p-5 rounded-2xl border-border/60 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h3 className="font-medium text-sm">Manzil</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Manzil" value={form.address} onChange={(e: any) => setForm({ ...form, address: e.target.value })} />
          <Field label="Shahar" value={form.city} onChange={(e: any) => setForm({ ...form, city: e.target.value })} />
        </div>
      </Card>

      <Button size="lg" className="rounded-xl" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" strokeWidth={1.75} />}
        Saqlash
      </Button>
    </div>
  );
};
export default CompanySettings;
