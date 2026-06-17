import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Loader2,
  DollarSign,
  PiggyBank,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Agent {
  id: string;
  commission_rate: number | null;
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending";
}

const AgentAccounting = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("all");
  const { data: agent } = useQuery({
    queryKey: ["agent-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agents")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data as Agent;
    },
    enabled: !!user?.id,
  });

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["agent-accounting", agent?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_referrals")
        .select(`
          *,
          booking:bookings(
            total_price,
            travel_date,
            tour:tours(title)
          )
        `)
        .eq("agent_id", agent?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!agent?.id,
  });

  // Filter by period
  const filterByPeriod = (data: any[]) => {
    const now = new Date();
    return data.filter((r: any) => {
      const date = new Date(r.created_at);
      switch (period) {
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        case "month":
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        case "year":
          return date.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  const filteredReferrals = filterByPeriod(referrals);

  // Calculate statistics
  const totalIncome = filteredReferrals
    .filter((r: any) => r.status === "completed" || r.status === "paid")
    .reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0);

  const pendingIncome = filteredReferrals
    .filter((r: any) => r.status === "pending")
    .reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0);

  const totalBookings = filteredReferrals.reduce(
    (sum: number, r: any) => sum + (r.booking?.total_price || 0), 
    0
  );

  const thisMonth = referrals.filter((r: any) => {
    const date = new Date(r.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const thisMonthIncome = thisMonth.reduce(
    (sum: number, r: any) => sum + (r.commission_amount || 0), 
    0
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
  };

  const exportReport = () => {
    if (filteredReferrals.length === 0) {
      toast.error("Export qilish uchun ma'lumot yo'q");
      return;
    }

    const periodLabel = period === "all" ? "Hammasi" : 
                       period === "week" ? "Oxirgi hafta" :
                       period === "month" ? "Bu oy" : "Bu yil";

    const headers = ["Sana", "Tur", "Buyurtma summasi", "Komissiya", "Status"];
    const rows = filteredReferrals.map((r: any) => [
      new Date(r.created_at).toLocaleDateString("uz-UZ"),
      r.booking?.tour?.title || "Noma'lum",
      r.booking?.total_price || 0,
      r.commission_amount || 0,
      r.status === "paid" || r.status === "completed" ? "To'langan" : 
       r.status === "pending" ? "Kutilmoqda" : r.status
    ]);

    // Summary
    rows.push([]);
    rows.push(["", "", "Jami savdo:", totalBookings, ""]);
    rows.push(["", "", "Jami komissiya:", totalIncome + pendingIncome, ""]);
    rows.push(["", "", "To'langan:", totalIncome, ""]);
    rows.push(["", "", "Kutilmoqda:", pendingIncome, ""]);

    const csvContent = [
      [`Hisobot: ${periodLabel}`],
      [`Sana: ${new Date().toLocaleDateString("uz-UZ")}`],
      [],
      headers,
      ...rows
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `buxgalteriya_${period}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Hisobot yuklandi!");
  };

  const stats = [
    {
      title: "Jami daromad",
      value: formatPrice(totalIncome),
      icon: Wallet,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Kutilayotgan to'lov",
      value: formatPrice(pendingIncome),
      icon: PiggyBank,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      trend: `${referrals.filter((r: any) => r.status === "pending").length} ta`,
      trendUp: false,
    },
    {
      title: "Bu oy",
      value: formatPrice(thisMonthIncome),
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      trend: `${thisMonth.length} ta buyurtma`,
      trendUp: true,
    },
    {
      title: "Umumiy savdo",
      value: formatPrice(totalBookings),
      icon: Receipt,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      trend: `${referrals.length} ta`,
      trendUp: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Buxgalteriya</h1>
          <p className="text-muted-foreground">
            Moliyaviy hisobotlar va daromadlar
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hammasi</SelectItem>
              <SelectItem value="week">Oxirgi hafta</SelectItem>
              <SelectItem value="month">Bu oy</SelectItem>
              <SelectItem value="year">Bu yil</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={exportReport}>
            <Download className="h-4 w-4" />
            Hisobotni yuklab olish
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs ${stat.trendUp ? "text-green-600" : "text-muted-foreground"}`}>
                  {stat.trend}
                  {stat.trendUp ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Commission Rate */}
      <Card className="bg-gradient-to-br from-primary/10 to-green-500/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Sizning komissiya stavkangiz</h3>
              <p className="text-sm text-muted-foreground">
                Har bir tasdiqlangan buyurtma uchun olinadi
              </p>
            </div>
            <div className="text-5xl font-bold text-primary">
              {agent?.commission_rate || 10}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Tranzaksiyalar tarixi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReferrals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead>Buyurtma summasi</TableHead>
                  <TableHead>Komissiya</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.map((referral: any) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      {new Date(referral.created_at).toLocaleDateString("uz-UZ", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {referral.booking?.tour?.title || "Noma'lum"}
                    </TableCell>
                    <TableCell>
                      {formatPrice(referral.booking?.total_price || 0)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      +{formatPrice(referral.commission_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          referral.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : referral.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {referral.status === "completed" ? "To'langan" : 
                         referral.status === "pending" ? "Kutilmoqda" : 
                         referral.status === "paid" ? "To'langan" : referral.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Hali tranzaksiyalar yo'q</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/50">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                To'lov haqida
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Komissiyalar har oyning oxirida to'lanadi. Minimal to'lov miqdori 100,000 so'm.
                To'lov bank kartangizga yoki naqd pulda amalga oshiriladi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentAccounting;
