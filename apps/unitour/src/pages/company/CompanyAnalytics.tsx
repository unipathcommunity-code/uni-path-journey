import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { BarChart3, Eye, Package, Calendar, MessageSquare, FileText, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";
import { useBranch } from "@/hooks/useBranches";

const Stat = ({ icon: Icon, label, value, accent, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
  >
    <Card className="p-4 rounded-2xl border-border/60 hover:shadow-md transition">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2.5 ${accent}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-0.5 tracking-tight">{value}</p>
    </Card>
  </motion.div>
);

const CompanyAnalytics = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const { currentBranchId, current } = useBranch();

  const { data: stats } = useQuery({
    queryKey: ["company-analytics", company?.id, currentBranchId],
    enabled: !!company?.id,
    queryFn: async () => {
      let toursQ = (supabase as any).from("tours").select("id, status", { count: "exact" }).eq("company_id", company!.id);
      let leadsQ = (supabase as any).from("company_leads").select("id, status", { count: "exact" }).eq("company_id", company!.id);
      if (currentBranchId) {
        toursQ = toursQ.eq("branch_id", currentBranchId);
        leadsQ = leadsQ.eq("branch_id", currentBranchId);
      }
      const [tours, posts, leads, postsViewsRes] = await Promise.all([
        toursQ,
        (supabase as any).from("company_posts").select("id, view_count", { count: "exact" }).eq("company_id", company!.id),
        leadsQ,
        (supabase as any).from("company_posts").select("view_count").eq("company_id", company!.id),
      ]);
      const tourIds = (tours.data || []).map((t: any) => t.id);
      let bookingCount = 0;
      let totalRevenue = 0;
      if (tourIds.length) {
        let bq = (supabase as any).from("bookings").select("total_price").in("tour_id", tourIds);
        if (currentBranchId) bq = bq.eq("branch_id", currentBranchId);
        const { data: bks } = await bq;
        bookingCount = bks?.length || 0;
        totalRevenue = (bks || []).reduce((s: number, b: any) => s + Number(b.total_price || 0), 0);
      }
      const totalViews = (postsViewsRes.data || []).reduce((s: number, p: any) => s + (p.view_count || 0), 0);
      const approvedTours = (tours.data || []).filter((t: any) => t.status === "approved").length;
      const newLeads = (leads.data || []).filter((l: any) => l.status === "new").length;
      return {
        tours: tours.count || 0,
        approvedTours,
        bookings: bookingCount,
        revenue: totalRevenue,
        leads: leads.count || 0,
        newLeads,
        posts: posts.count || 0,
        views: totalViews,
      };
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Statistika</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {current ? `${current.name} bo'yicha tahlil` : "Sayt va turlar tahlili"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat icon={Package} label="Turlar" value={`${stats?.approvedTours ?? 0} / ${stats?.tours ?? 0}`} accent="bg-primary/10 text-primary" delay={0.05} />
        <Stat icon={Calendar} label="Buyurtma" value={stats?.bookings ?? 0} accent="bg-emerald-500/10 text-emerald-600" delay={0.08} />
        <Stat icon={MessageSquare} label="Lid" value={`${stats?.newLeads ?? 0} / ${stats?.leads ?? 0}`} accent="bg-amber-500/10 text-amber-600" delay={0.11} />
        <Stat icon={FileText} label="Postlar" value={stats?.posts ?? 0} accent="bg-violet-500/10 text-violet-600" delay={0.14} />
        <Stat icon={Eye} label="Ko'rishlar" value={stats?.views ?? 0} accent="bg-pink-500/10 text-pink-600" delay={0.17} />
        <Stat icon={DollarSign} label="Daromad" value={`$${(stats?.revenue ?? 0).toLocaleString()}`} accent="bg-emerald-500/10 text-emerald-600" delay={0.2} />
      </div>

      <Card className="p-6 rounded-2xl border-border/60">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <h3 className="font-medium text-sm">Batafsil grafiklar</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Vizual tahlillar tez orada qo'shiladi. Hozircha asosiy ko'rsatkichlar real vaqt rejimida.
        </p>
      </Card>
    </div>
  );
};
export default CompanyAnalytics;
