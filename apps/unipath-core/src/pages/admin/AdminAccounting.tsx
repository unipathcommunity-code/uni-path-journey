import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { TrendingUp, Calendar, Download, Loader2, Wallet, Receipt, Users, CreditCard, ArrowUpRight, ArrowDownRight, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminAccounting = () => {
  const { t } = useTranslation();
  
  const { data: transactions = [], isLoading: transLoading } = useQuery({
    queryKey: ["admin-accounting"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("payment_transactions").select(`*`).order("created_at", { ascending: false });
        if (error) {
          console.warn("payment_transactions query failed", error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.error("Accounting query error", err);
        return [];
      }
    },
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ["admin-referrals-accounting"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("agent_referrals").select(`*`).order("created_at", { ascending: false });
        if (error) return [];
        return data || [];
      } catch (err) {
        return [];
      }
    },
  });

  const totalRevenue = transactions.filter((b: any) => b.status === "confirmed" || b.status === "paid" || b.status === "completed").reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
  const pendingRevenue = transactions.filter((b: any) => b.status === "pending").reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
  
  const totalCommissions = referrals.reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0);
  const paidCommissions = referrals.filter((r: any) => r.status === "paid" || r.status === "completed").reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0);
  const pendingCommissions = referrals.filter((r: any) => r.status === "pending").reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0);
  
  const netRevenue = totalRevenue - paidCommissions;

  const thisMonth = transactions.filter((b: any) => {
    const date = new Date(b.created_at || b.payment_date); 
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonth.filter((b: any) => b.status === "confirmed" || b.status === "paid" || b.status === "completed").reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

  const formatPrice = (price: number) => new Intl.NumberFormat("uz-UZ").format(price) + " UZS";

  const stats = [
    { title: "Umumiy Tushumlar", value: formatPrice(totalRevenue), icon: Wallet, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30", trend: "+18%", trendUp: true },
    { title: "Shu Oy (Kirim)", value: formatPrice(thisMonthRevenue), icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", trend: `${thisMonth.length} ta`, trendUp: true },
    { title: "Agent Komissiyalari", value: formatPrice(totalCommissions), icon: Users, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30", trend: `${referrals.length} ta`, trendUp: false },
    { title: "Sof Foyda (Net)", value: formatPrice(netRevenue), icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", trend: "+15%", trendUp: true },
  ];

  if (transLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kirim-Chiqim (Moliya)</h1>
          <p className="text-muted-foreground">Kompaniyangizning barcha moliyaviy aylanmalari va tushumlari nazorati.</p>
        </div>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Hisobotni Yuklab Olish</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                <div className={`flex items-center gap-1 text-xs ${stat.trendUp ? "text-green-600" : "text-muted-foreground"}`}>
                  {stat.trend}{stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                </div>
              </div>
              <div className="mt-4"><p className="text-xl font-bold">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.title}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Kirim (Tushumlar)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30"><span>Tasdiqlangan to'lovlar</span><span className="font-bold text-green-600">{formatPrice(totalRevenue)}</span></div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30"><span>Kutilayotgan to'lovlar</span><span className="font-bold text-yellow-600">{formatPrice(pendingRevenue)}</span></div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30"><span>Jami hisoblangan</span><span className="font-bold text-blue-600">{formatPrice(totalRevenue + pendingRevenue)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PiggyBank className="h-5 w-5" />Chiqim (Xarajat & Komissiya)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30"><span>To'langan komissiyalar</span><span className="font-bold text-green-600">{formatPrice(paidCommissions)}</span></div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30"><span>To'lanishi kerak (Qarz)</span><span className="font-bold text-yellow-600">{formatPrice(pendingCommissions)}</span></div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30"><span>Jami komissiya xarajatlari</span><span className="font-bold text-purple-600">{formatPrice(totalCommissions)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />So'nggi Tranzaksiyalar</CardTitle></CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Maqsad / Mahsulot</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Summa</TableHead>
                  <TableHead>Holati</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.created_at || transaction.payment_date).toLocaleDateString("uz-UZ")}</TableCell>
                    <TableCell className="font-medium">
                      {transaction.description || transaction.payment_method || "Umumiy To'lov"}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Kirim</Badge></TableCell>
                    <TableCell className="font-semibold text-green-600">+{formatPrice(transaction.amount || 0)}</TableCell>
                    <TableCell>
                      <Badge className={(transaction.status === "confirmed" || transaction.status === "paid" || transaction.status === "completed") ? "bg-green-100 text-green-700" : transaction.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                        {(transaction.status === "confirmed" || transaction.status === "paid" || transaction.status === "completed") ? "Tasdiqlangan" : transaction.status === "pending" ? "Kutilmoqda" : "Bekor qilingan"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tranzaksiyalar topilmadi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAccounting;
