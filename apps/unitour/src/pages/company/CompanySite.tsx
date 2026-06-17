import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, Copy, ExternalLink, Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";

const CompanySite = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const qc = useQueryClient();
  const [newDomain, setNewDomain] = useState("");

  const { data: domains } = useQuery({
    queryKey: ["company-domains", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tour_company_domains").select("*").eq("company_id", company!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addDomain = useMutation({
    mutationFn: async () => {
      if (!company) throw new Error("Kompaniya topilmadi");
      const clean = newDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
      if (!clean.includes(".")) throw new Error("Domen noto'g'ri (masalan: mytour.uz)");
      const { error } = await (supabase as any).from("tour_company_domains").insert({
        company_id: company.id, domain: clean, is_subdomain: false,
        verification_token: `unitour-verify-${Math.random().toString(36).slice(2, 10)}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domen qo'shildi");
      setNewDomain("");
      qc.invalidateQueries({ queryKey: ["company-domains", company?.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDomain = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("tour_company_domains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domen o'chirildi");
      qc.invalidateQueries({ queryKey: ["company-domains", company?.id] });
    },
  });

  if (!company) return null;
  const siteUrl = `${window.location.origin}/${company.slug}`;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sayt</h1>
        <p className="text-sm text-muted-foreground mt-1">Subdomen va shaxsiy domen sozlamalari</p>
      </div>

      <Card className="p-5 rounded-2xl border-border/60 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h3 className="font-medium text-sm">UniTour subdomen</h3>
          <Badge variant="secondary" className="text-[10px] font-normal ml-auto">Bepul</Badge>
        </div>
        <div className="bg-muted/60 px-3 py-2.5 rounded-xl break-all text-xs font-mono">{siteUrl}</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { navigator.clipboard.writeText(siteUrl); toast.success("Nusxalandi"); }}>
            <Copy className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} /> Nusxalash
          </Button>
          <a href={siteUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="rounded-xl"><ExternalLink className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} /> Ochish</Button>
          </a>
        </div>
      </Card>

      <Card className="p-5 rounded-2xl border-border/60 space-y-3">
        <div>
          <h3 className="font-medium text-sm">Shaxsiy domen</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Pro va Premium tariflarda mavjud</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="mytour.uz"
            onKeyDown={(e) => e.key === "Enter" && addDomain.mutate()}
            className="rounded-xl"
          />
          <Button size="sm" className="rounded-xl" onClick={() => addDomain.mutate()} disabled={addDomain.isPending || !newDomain.trim()}>
            {addDomain.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" strokeWidth={2} />}
            Qo'shish
          </Button>
        </div>

        {!domains?.length ? (
          <p className="text-xs text-muted-foreground">Hali ulangan domenlar yo'q</p>
        ) : (
          <div className="space-y-2">
            {domains.map((d: any) => (
              <div key={d.id} className="border border-border/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="h-3.5 w-3.5 text-primary shrink-0" strokeWidth={1.75} />
                    <span className="font-mono text-xs truncate">{d.domain}</span>
                    {d.is_verified ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-normal" variant="outline">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" strokeWidth={1.75} /> Tasdiqlangan
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-normal"><AlertCircle className="h-3 w-3 mr-0.5" strokeWidth={1.75} /> Kutilmoqda</Badge>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteDomain.mutate(d.id)}>
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Button>
                </div>
                {!d.is_verified && (
                  <div className="text-[11px] space-y-2 bg-muted/50 p-3 rounded-lg">
                    <p className="font-medium">DNS sozlamalari:</p>
                    <div className="font-mono space-y-1.5">
                      <div><span className="text-muted-foreground">A:</span> @ → 185.158.133.1</div>
                      <div><span className="text-muted-foreground">A:</span> www → 185.158.133.1</div>
                      <div><span className="text-muted-foreground">TXT:</span> _unitour → {d.verification_token}</div>
                    </div>
                    <p className="text-muted-foreground text-[10px]">DNS 24-72 soat ichida tarqaladi. SSL avtomatik.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
export default CompanySite;
