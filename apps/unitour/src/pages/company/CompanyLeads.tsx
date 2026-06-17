import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, Mail, MessageSquare, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";
import { useBranch } from "@/hooks/useBranches";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  new: { label: "Yangi", tone: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  contacted: { label: "Bog'lanildi", tone: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  converted: { label: "Mijoz", tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  closed: { label: "Yopildi", tone: "bg-muted text-muted-foreground border-border" },
};

const FILTERS = [
  { k: "all", l: "Hammasi" },
  { k: "new", l: "Yangi" },
  { k: "contacted", l: "Bog'lanildi" },
  { k: "converted", l: "Mijoz" },
  { k: "closed", l: "Yopildi" },
];

const CompanyLeads = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const { currentBranchId, current } = useBranch();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["company-leads", company?.id, filter, currentBranchId],
    enabled: !!company?.id,
    queryFn: async () => {
      let q = (supabase as any).from("company_leads").select("*").eq("company_id", company!.id).order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      if (currentBranchId) q = q.eq("branch_id", currentBranchId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("company_leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Holat yangilandi");
      qc.invalidateQueries({ queryKey: ["company-leads"] });
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lidlar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {current ? `${current.name} mijoz murojaatlari` : "Mijozlardan kelgan murojaatlar"}
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              filter === f.k ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !leads?.length ? (
        <Card className="p-12 text-center rounded-2xl border-border/60">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Hali lidlar yo'q</p>
        </Card>
      ) : (
        <div className="grid gap-2.5">
          {leads.map((lead: any, i: number) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.25 }}
            >
              <Card className="p-4 rounded-2xl border-border/60 hover:shadow-sm transition">
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm truncate">{lead.full_name}</h3>
                      <Badge variant="outline" className={`text-[10px] font-normal ${STATUS_LABELS[lead.status]?.tone || ""}`}>
                        {STATUS_LABELS[lead.status]?.label ?? lead.status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{format(new Date(lead.created_at), "dd MMM HH:mm")}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-primary truncate"><Phone className="h-3 w-3" strokeWidth={1.75} />{lead.phone}</a>
                      {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-primary truncate"><Mail className="h-3 w-3" strokeWidth={1.75} />{lead.email}</a>}
                    </div>
                    {lead.message && <p className="text-xs bg-muted/50 p-2.5 rounded-lg leading-relaxed line-clamp-3">{lead.message}</p>}
                  </div>
                  <div className="flex md:flex-col gap-1.5 shrink-0">
                    {lead.status === "new" && (
                      <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs" onClick={() => updateStatus.mutate({ id: lead.id, status: "contacted" })}>
                        <Check className="h-3 w-3 mr-1" strokeWidth={1.75} /> Bog'landim
                      </Button>
                    )}
                    {lead.status !== "converted" && lead.status !== "closed" && (
                      <Button size="sm" className="rounded-lg h-7 text-xs" onClick={() => updateStatus.mutate({ id: lead.id, status: "converted" })}>
                        Mijoz
                      </Button>
                    )}
                    {lead.status !== "closed" && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus.mutate({ id: lead.id, status: "closed" })}>
                        <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyLeads;
