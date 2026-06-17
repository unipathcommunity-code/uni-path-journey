import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, ExternalLink, Send, ShieldCheck, Type } from "lucide-react";
import { useMyCompany } from "@/hooks/useTourCompany";
import ChangeRequestDialog from "@/components/company/ChangeRequestDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const CompanyBranding = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const [open, setOpen] = useState(false);

  const { data: requests } = useQuery({
    queryKey: ["my-change-requests", company?.id, "branding"],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_change_requests")
        .select("*").eq("company_id", company!.id)
        .order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const items = useMemo(() => requests || [], [requests]);
  if (!company) return null;
  const siteUrl = `${window.location.origin}/${company.slug}`;

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brend</h1>
          <p className="text-sm text-muted-foreground mt-1">Dizayn — super admin orqali, so'rov yuboring</p>
        </div>
        <a href={siteUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="rounded-xl">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} /> Saytni ko'rish
          </Button>
        </a>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl overflow-hidden border border-border/60"
        style={{ fontFamily: company.font_family }}
      >
        <div
          className="relative h-48 flex items-end p-5 text-white"
          style={{
            background: company.banner_url
              ? `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55)), url(${company.banner_url}) center/cover`
              : `linear-gradient(135deg, ${company.primary_color}, ${company.secondary_color})`,
          }}
        >
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-12 w-12 rounded-xl object-cover bg-white/10 p-1" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-semibold">
                {company.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{company.name}</h3>
              {company.tagline && <p className="text-sm opacity-90">{company.tagline}</p>}
            </div>
          </div>
        </div>
        <div className="p-4 bg-background grid md:grid-cols-3 gap-3 text-sm">
          {[
            { label: "Asosiy", value: company.primary_color },
            { label: "Ikkilamchi", value: company.secondary_color },
            { label: "Aksent", value: company.accent_color },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-2.5 p-2 rounded-xl border border-border/60">
              <div className="h-8 w-8 rounded-lg shrink-0 border border-border/40" style={{ background: c.value }} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="font-mono text-xs truncate">{c.value}</p>
              </div>
            </div>
          ))}
          <div className="md:col-span-3 flex items-center gap-2 pt-2 mt-1 border-t border-border/60 text-xs">
            <Type className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
            <span className="text-muted-foreground">Shrift:</span>
            <span className="font-medium" style={{ fontFamily: company.font_family }}>{company.font_family}</span>
          </div>
        </div>
      </motion.div>

      <Card className="rounded-2xl border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Boshqa rang yoki logo kerakmi?</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Super adminga so'rov yuboring — qisqa vaqtda o'zgartiramiz.</p>
        </div>
        <Button size="sm" className="rounded-xl shrink-0" onClick={() => setOpen(true)}>
          <Send className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} /> So'rov
        </Button>
      </Card>

      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
            <h3 className="font-medium text-sm">Mening so'rovlarim</h3>
          </div>
          <Badge variant="secondary" className="text-[10px] font-normal">{items.length}</Badge>
        </div>
        <div className="p-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Hali so'rov yo'q</p>
          ) : (
            <div className="space-y-1">
              {items.map((r: any) => (
                <div key={r.id} className="flex items-start justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{r.title}</p>
                    {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{r.description}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(r.created_at), "dd MMM HH:mm")}</p>
                  </div>
                  <Badge
                    variant={r.status === "applied" || r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}
                    className="text-[10px] font-normal shrink-0"
                  >
                    {r.status === "pending" ? "Kutilmoqda" : r.status === "approved" ? "Tasdiq" : r.status === "applied" ? "Qo'llandi" : "Rad"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <ChangeRequestDialog
        open={open}
        onClose={() => setOpen(false)}
        companyId={company.id}
        requestType="branding"
        defaultTitle="Brend o'zgartirish so'rovi"
      />
    </div>
  );
};

export default CompanyBranding;
