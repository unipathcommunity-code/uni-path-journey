import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";
import { useBranch } from "@/hooks/useTourBranches";

const CompanyTours = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const { currentBranchId, current } = useBranch();

  const { data: tours, isLoading } = useQuery({
    queryKey: ["company-tours", company?.id, currentBranchId],
    enabled: !!company?.id,
    queryFn: async () => {
      let q = (supabase as any).from("tours").select("*").eq("company_id", company!.id).order("created_at", { ascending: false });
      if (currentBranchId) q = q.eq("branch_id", currentBranchId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Turlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {current ? `${current.name} filialining sayohat paketlari` : "Barcha sayohat paketlari"}
          </p>
        </div>
        <Link to="/company/tours/new">
          <Button size="sm" className="rounded-xl">
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Yangi tur
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !tours?.length ? (
        <Card className="p-12 text-center rounded-2xl border-border/60">
          <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" strokeWidth={1.5} />
          <h3 className="font-semibold text-sm">Hali turlar yo'q</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Birinchi turingizni qo'shing</p>
          <Link to="/company/tours/new">
            <Button size="sm" className="rounded-xl"><Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Yangi tur</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tours.map((tour: any, i: number) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="overflow-hidden rounded-2xl border-border/60 hover:shadow-md hover:-translate-y-0.5 transition group">
                <div className="aspect-video relative bg-muted overflow-hidden">
                  {tour.image && <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />}
                  <Badge
                    className="absolute top-2 right-2 text-[10px] font-normal"
                    variant={tour.status === "approved" ? "default" : "secondary"}
                  >
                    {tour.status === "approved" ? "Faol" : tour.status === "pending" ? "Kutilmoqda" : "Rad"}
                  </Badge>
                </div>
                <div className="p-3.5">
                  <h3 className="font-medium text-sm truncate">{tour.title}</h3>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{tour.destination}</p>
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border/60">
                    <p className="font-semibold text-primary text-sm">${tour.price}</p>
                    <Link to={`/company/tours/${tour.id}/edit`}>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /></Button>
                    </Link>
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

export default CompanyTours;
