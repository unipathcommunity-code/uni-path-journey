import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";
import { useBranch } from "@/hooks/useBranches";
import { format } from "date-fns";

const statusColor = (s: string) =>
  s === "confirmed" ? "default" : s === "pending" ? "secondary" : s === "cancelled" ? "destructive" : "outline";

const CompanyBookings = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const { currentBranchId, current } = useBranch();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["company-bookings", company?.id, currentBranchId],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data: tours } = await (supabase as any).from("tours").select("id, title").eq("company_id", company!.id);
      const tourIds = (tours || []).map((t: any) => t.id);
      if (!tourIds.length) return [];
      let q = (supabase as any).from("bookings").select("*").in("tour_id", tourIds).order("created_at", { ascending: false });
      if (currentBranchId) q = q.eq("branch_id", currentBranchId);
      const { data: bks, error } = await q;
      if (error) throw error;
      const tourMap = new Map((tours || []).map((t: any) => [t.id, t.title]));
      return (bks || []).map((b: any) => ({ ...b, tour_title: tourMap.get(b.tour_id) || "—" }));
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buyurtmalar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {current ? `${current.name} bo'yicha` : "Barcha mijoz buyurtmalari"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !bookings?.length ? (
        <Card className="p-12 text-center rounded-2xl border-border/60">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Hozircha buyurtmalar yo'q</p>
        </Card>
      ) : (
        <div className="grid gap-2.5">
          {bookings.map((b: any, i: number) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}
            >
              <Card className="p-4 rounded-2xl border-border/60 hover:shadow-sm transition flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm truncate">{b.tour_title}</h3>
                    <Badge variant={statusColor(b.status) as any} className="text-[10px] font-normal capitalize">{b.status}</Badge>
                    <Badge variant="outline" className="text-[10px] font-normal capitalize">{b.payment_status}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" strokeWidth={1.75} />{format(new Date(b.travel_date), "dd MMM yyyy")}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" strokeWidth={1.75} />{b.people_count} kishi</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" strokeWidth={1.75} />${b.total_price}</span>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0">{format(new Date(b.created_at), "dd MMM, HH:mm")}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
export default CompanyBookings;
