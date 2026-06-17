import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt } from "lucide-react";
import { format } from "date-fns";

const AdminBilling = () => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_billing_invoices")
        .select("*, tour_companies(name, slug)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const total = invoices?.reduce((s: number, i: any) => s + Number(i.amount_usd || 0), 0) || 0;
  const paid = invoices?.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.amount_usd || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Receipt className="h-7 w-7" /> Hisob-kitoblar</h1>
        <p className="text-muted-foreground mt-1">Tour kompaniyalar to'lovlari va daromad hisoboti.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5"><div className="text-sm text-muted-foreground">Jami invoice</div><div className="text-2xl font-bold mt-1">${total.toFixed(2)}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted-foreground">To'langan</div><div className="text-2xl font-bold mt-1 text-green-600">${paid.toFixed(2)}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted-foreground">Kutilmoqda</div><div className="text-2xl font-bold mt-1">${(total - paid).toFixed(2)}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted-foreground">Soni</div><div className="text-2xl font-bold mt-1">{invoices?.length || 0}</div></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <Card>
          <div className="divide-y">
            {invoices?.map((i: any) => (
              <div key={i.id} className="p-4 flex items-center gap-4">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{i.tour_companies?.name}</div>
                  <div className="text-xs text-muted-foreground">{i.invoice_number || i.id.slice(0, 8)} · {format(new Date(i.created_at), "yyyy-MM-dd")}</div>
                </div>
                <div className="font-semibold">${Number(i.amount_usd).toFixed(2)}</div>
                <Badge variant={i.status === "paid" ? "default" : i.status === "overdue" ? "destructive" : "secondary"}>{i.status}</Badge>
              </div>
            ))}
            {!invoices?.length && <div className="p-12 text-center text-muted-foreground">Hali invoice yo'q</div>}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminBilling;
