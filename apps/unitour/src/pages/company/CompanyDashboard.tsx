import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package, Calendar, MessageSquare, FileText, Plus, ArrowRight,
  ExternalLink, GitBranch, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";
import { useBranch } from "@/hooks/useBranches";

const Stat = ({ icon: Icon, label, value, delay }: any) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}>
    <Card className="p-4 rounded-2xl border-border/60 hover:shadow-md transition group">
      <div className="flex items-center justify-between mb-2.5">
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-foreground/70">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" strokeWidth={1.75} />
      </div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-0.5 tracking-tight">{value}</p>
    </Card>
  </motion.div>
);

const CompanyDashboard = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const { current, currentBranchId } = useBranch();

  const { data: stats } = useQuery({
    queryKey: ["company-stats", company?.id, currentBranchId],
    enabled: !!company?.id,
    queryFn: async () => {
      let toursQ = (supabase as any).from("tours").select("id", { count: "exact" }).eq("company_id", company!.id);
      let leadsQ = (supabase as any).from("company_leads").select("id", { count: "exact", head: true }).eq("company_id", company!.id).eq("status", "new");
      let postsQ = (supabase as any).from("company_posts").select("id", { count: "exact", head: true }).eq("company_id", company!.id).eq("is_published", true);
      if (currentBranchId) {
        toursQ = toursQ.eq("branch_id", currentBranchId);
        leadsQ = leadsQ.eq("branch_id", currentBranchId);
      }
      const [toursRes, leads, posts] = await Promise.all([toursQ, leadsQ, postsQ]);
      const tourIds = (toursRes.data || []).map((t: any) => t.id);
      let bookingCount = 0;
      if (tourIds.length) {
        let bq = (supabase as any).from("bookings").select("id", { count: "exact", head: true }).in("tour_id", tourIds);
        if (currentBranchId) bq = bq.eq("branch_id", currentBranchId);
        const { count } = await bq;
        bookingCount = count || 0;
      }
      return {
        tours: toursRes.count ?? 0,
        bookings: bookingCount,
        leads: leads.count ?? 0,
        posts: posts.count ?? 0,
      };
    },
  });

  if (!company) return null;
  const siteUrl = `${window.location.origin}/${company.slug}`;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl p-5 md:p-6 border border-border/60 bg-card"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0">
            <Badge variant="secondary" className="text-[10px] font-normal mb-2.5">
              {company.status === "approved" ? "Faol" : "Tasdiqlanmoqda"}
            </Badge>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
              {company.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" strokeWidth={1.75} />
              {current ? current.name : "Hamma filiallar"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="rounded-xl">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} /> Saytim
              </Button>
            </a>
            <Link to="/company/tours/new">
              <Button size="sm" className="rounded-xl">
                <Plus className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} /> Yangi tur
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Package} label="Turlar" value={stats?.tours ?? "—"} delay={0.05} />
        <Stat icon={Calendar} label="Buyurtma" value={stats?.bookings ?? "—"} delay={0.1} />
        <Stat icon={MessageSquare} label="Yangi lid" value={stats?.leads ?? "—"} delay={0.15} />
        <Stat icon={FileText} label="Postlar" value={stats?.posts ?? "—"} delay={0.2} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card className="p-5 rounded-2xl border-border/60">
          <h3 className="font-semibold text-sm tracking-tight">Saytingiz</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1 mb-3">
            Brendni sozlang va saytni mijozlarga ulashing.
          </p>
          <div className="flex gap-2 mb-3">
            <Link to="/company/branding" className="flex-1">
              <Button size="sm" variant="outline" className="w-full rounded-xl">Brend</Button>
            </Link>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button size="sm" className="w-full rounded-xl">Ochish <ArrowRight className="h-3.5 w-3.5 ml-1" strokeWidth={2} /></Button>
            </a>
          </div>
          <div className="text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-lg break-all font-mono">
            {siteUrl}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-border/60">
          <h3 className="font-semibold text-sm tracking-tight mb-3">Ishni boshlash</h3>
          <div className="space-y-1">
            {[
              { label: "Logo va banner", href: "/company/branding", done: !!company.logo_url },
              { label: "Birinchi tur", href: "/company/tours/new", done: (stats?.tours ?? 0) > 0 },
              { label: "Aloqa ma'lumotlari", href: "/company/settings", done: !!company.phone },
              { label: "Filial qo'shish", href: "/company/branches", done: false },
            ].map((step, i) => (
              <Link
                key={i}
                to={step.href}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition text-sm"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border ${
                    step.done ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground"
                  }`}>
                    {step.done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : <span className="text-[10px]">{i + 1}</span>}
                  </span>
                  <span className="truncate">{step.label}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" strokeWidth={1.75} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDashboard;
