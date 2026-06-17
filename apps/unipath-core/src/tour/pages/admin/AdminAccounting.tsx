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

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["admin-bookings-accounting"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select(`*, tours (title, destination, price)`).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ["admin-referrals-accounting"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_referrals").select(`*, agents (name, company_name), booking:bookings (total_price, tour:tours(title))`).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalRevenue = bookings.filter((b: any) => b.status === "confirmed").reduce((sum: number, b: any) => sum + (b.total_price || 0), 0);
  const pendingRevenue = bookings.filter((b: any) => b.status === "pending").reduce((sum: number, b: any) => sum + (b.total_price || 0), 0);
  const totalCommissions = referrals.reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0);
  const paidCommissions = referrals.filter((r: any) => r.status === "paid" || r.status === "completed").reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0);
  const pendingCommissions = referrals.filter((r: any) => r.status === "pending").reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0);
  const netRevenue = totalRevenue - paidCommissions;

  const thisMonth = bookings.filter((b: any) => {
    const date = new Date(b.created_at); const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonth.filter((b: any) => b.status === "confirmed").reduce((sum: number, b: any) => sum + (b.total_price || 0), 0);

  const formatPrice = (price: number) => new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

  const stats = [
    { title: t("admin.totalRevenue"), value: formatPrice(totalRevenue), icon: Wallet, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30", trend: "+18%", trendUp: true },
    { title: t("admin.thisMonth"), value: formatPrice(thisMonthRevenue), icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", trend: `${thisMonth.length} ta`, trendUp: true },
    { title: t("admin.agentCommissions"), value: formatPrice(totalCommissions), icon: Users, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30", trend: `${referrals.length} ta`, trendUp: false },
    { title: t("admin.netRevenue"), value: formatPrice(netRevenue), icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", trend: "+15%", trendUp: true },
  ];

  if (bookingsLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">{t("admin.accountingTitle")}</h1><p className="text-muted-foreground">{t("admin.accountingDesc")}</p></div>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />{t("admin.downloadReport")}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm"><CardContent className="p-6">
            <div className="flex items-start justify-between"><div className={`p-3 rounded-xl ${stat.bgColor}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div><div className={`flex items-center gap-1 text-xs ${stat.trendUp ? "text-green-600" : "text-muted-foreground"}`}>{stat.trend}{stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}</div></div>
            <div className="mt-4"><p className="text-xl font-bold">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.title}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />{t("admin.income")}</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30"><span>{t("admin.confirmedOrders")}</span><span className="font-bold text-green-600">{formatPrice(totalRevenue)}</span></div>
          <div className="flex justify-between items-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30"><span>{t("admin.pendingOrders")}</span><span className="font-bold text-yellow-600">{formatPrice(pendingRevenue)}</span></div>
          <div className="flex justify-between items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30"><span>{t("admin.total")}</span><span className="font-bold text-blue-600">{formatPrice(totalRevenue + pendingRevenue)}</span></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><PiggyBank className="h-5 w-5" />{t("admin.agentCommissions")}</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30"><span>{t("admin.paid")}</span><span className="font-bold text-green-600">{formatPrice(paidCommissions)}</span></div>
          <div className="flex justify-between items-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30"><span>{t("admin.pendingPayment")}</span><span className="font-bold text-yellow-600">{formatPrice(pendingCommissions)}</span></div>
          <div className="flex justify-between items-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30"><span>{t("admin.totalCommission")}</span><span className="font-bold text-purple-600">{formatPrice(totalCommissions)}</span></div>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />{t("admin.recentTransactions")}</CardTitle></CardHeader><CardContent>
        {bookings.length > 0 ? (
          <Table><TableHeader><TableRow>
            <TableHead>{t("admin.date")}</TableHead><TableHead>{t("admin.tour")}</TableHead><TableHead>{t("admin.type")}</TableHead><TableHead>{t("admin.amount")}</TableHead><TableHead>{t("admin.status")}</TableHead>
          </TableRow></TableHeader><TableBody>
            {bookings.slice(0, 10).map((booking: any) => (
              <TableRow key={booking.id}>
                <TableCell>{new Date(booking.created_at).toLocaleDateString("uz-UZ")}</TableCell>
                <TableCell className="font-medium">{booking.tours?.title || t("admin.unknown")}</TableCell>
                <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">{t("admin.inflow")}</Badge></TableCell>
                <TableCell className="font-semibold text-green-600">+{formatPrice(booking.total_price || 0)}</TableCell>
                <TableCell><Badge className={booking.status === "confirmed" ? "bg-green-100 text-green-700" : booking.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>{booking.status === "confirmed" ? t("admin.confirmed") : booking.status === "pending" ? t("admin.pending") : t("admin.cancelled")}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground"><Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{t("admin.noTransactions")}</p></div>
        )}
      </CardContent></Card>
    </div>
  );
};

export default AdminAccounting;
