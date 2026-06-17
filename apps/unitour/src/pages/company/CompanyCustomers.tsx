import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, UserRound, Phone, Mail, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";
import { useBranch } from "@/hooks/useBranches";
import { format } from "date-fns";

type Customer = {
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  bookings: number;
  total_spent: number;
  last_at: string | null;
  branches: Set<string>;
};

const CompanyCustomers = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const { currentBranchId, current, branches } = useBranch();
  const [q, setQ] = useState("");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["company-customers", company?.id, currentBranchId],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data: tours } = await (supabase as any)
        .from("tours").select("id").eq("company_id", company!.id);
      const tourIds = (tours || []).map((t: any) => t.id);
      if (!tourIds.length) return [] as Customer[];
      let bq = (supabase as any)
        .from("bookings")
        .select("user_id, total_price, created_at, branch_id")
        .in("tour_id", tourIds)
        .order("created_at", { ascending: false });
      if (currentBranchId) bq = bq.eq("branch_id", currentBranchId);
      const { data: bks } = await bq;
      const ids = Array.from(new Set((bks || []).map((b: any) => b.user_id)));
      if (!ids.length) return [];
      const { data: profiles } = await (supabase as any)
        .from("profiles").select("user_id, full_name, phone, avatar_url").in("user_id", ids);
      const pmap = new Map<string, any>((profiles || []).map((p: any) => [p.user_id, p]));
      const acc = new Map<string, Customer>();
      for (const b of bks || []) {
        const cur = acc.get(b.user_id) || {
          user_id: b.user_id,
          full_name: pmap.get(b.user_id)?.full_name || "Foydalanuvchi",
          phone: pmap.get(b.user_id)?.phone || null,
          email: null,
          avatar_url: pmap.get(b.user_id)?.avatar_url || null,
          bookings: 0,
          total_spent: 0,
          last_at: null,
          branches: new Set<string>(),
        };
        cur.bookings += 1;
        cur.total_spent += Number(b.total_price || 0);
        if (!cur.last_at || cur.last_at < b.created_at) cur.last_at = b.created_at;
        if (b.branch_id) cur.branches.add(b.branch_id);
        acc.set(b.user_id, cur);
      }
      return Array.from(acc.values()).sort((a, b) => (b.last_at || "").localeCompare(a.last_at || ""));
    },
  });

  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches]);
  const filtered = useMemo(() => {
    if (!rows) return [];
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(
      (r) => r.full_name.toLowerCase().includes(s) || (r.phone || "").includes(s),
    );
  }, [rows, q]);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mijozlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {current ? `${current.name} mijozlari` : "Barcha buyurtma bergan mijozlar"}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ism yoki telefon"
            className="pl-9 rounded-xl h-9 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !filtered.length ? (
        <Card className="p-12 text-center rounded-2xl border-border/60">
          <UserRound className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Mijozlar topilmadi</p>
        </Card>
      ) : (
        <div className="grid gap-2.5">
          {filtered.map((c, i) => (
            <motion.div
              key={c.user_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.25 }}
            >
              <Card className="p-4 rounded-2xl border-border/60 hover:shadow-sm transition flex items-center gap-3">
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserRound className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm truncate">{c.full_name}</h3>
                    <Badge variant="secondary" className="text-[10px] font-normal">{c.bookings} ta buyurtma</Badge>
                    {Array.from(c.branches).slice(0, 2).map((bid) => (
                      <Badge key={bid} variant="outline" className="text-[10px] font-normal">
                        {branchMap.get(bid) || "—"}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                    {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" strokeWidth={1.75} />{c.phone}</a>}
                    {c.last_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" strokeWidth={1.75} />{format(new Date(c.last_at), "dd MMM yyyy")}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Jami</p>
                  <p className="font-semibold text-sm">${c.total_spent.toFixed(0)}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyCustomers;
