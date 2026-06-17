import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { 
  Wallet, 
  TrendingUp, 
  Calendar,
  Download,
  Loader2,
  CheckCircle,
  Clock,
  ArrowUpRight,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Agent {
  id: string;
  commission_rate: number | null;
}

const AgentEarnings = () => {
  const { user } = useAuth();

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
    queryKey: ["agent-earnings", agent?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_referrals")
        .select(`
          *,
          booking:bookings(
            total_price,
            travel_date,
            status,
            tour:tours(title, destination)
          )
        `)
        .eq("agent_id", agent?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!agent?.id,
  });

  const paidEarnings = referrals
    .filter((r: any) => r.status === "paid" || r.status === "completed")
    .reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0);

  const pendingEarnings = referrals
    .filter((r: any) => r.status === "pending")
    .reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0);

  const thisMonth = referrals.filter((r: any) => {
    const date = new Date(r.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
  };

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
          <h1 className="text-2xl font-bold">Daromadlar</h1>
          <p className="text-muted-foreground">
            Sizning komissiya daromadlaringiz
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <Badge className="bg-green-100 text-green-700">To'langan</Badge>
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              {formatPrice(paidEarnings)}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Jami to'langan daromad
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/50">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <Badge className="bg-yellow-100 text-yellow-700">Kutilmoqda</Badge>
            </div>
            <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
              {formatPrice(pendingEarnings)}
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              To'lov kutilmoqda
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <Badge className="bg-blue-100 text-blue-700">Bu oy</Badge>
            </div>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {formatPrice(thisMonth.reduce((s: number, r: any) => s + (r.commission_amount || 0), 0))}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {thisMonth.length} ta yo'naltirish
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Rate */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-primary/10">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Komissiya stavkasi</h3>
                <p className="text-sm text-muted-foreground">
                  Har bir muvaffaqiyatli bron uchun
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-primary">
                {agent?.commission_rate || 10}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Earnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Oxirgi daromadlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length > 0 ? (
            <div className="space-y-4">
              {referrals.slice(0, 10).map((referral: any) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      referral.status === "paid" || referral.status === "completed"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-yellow-100 dark:bg-yellow-900/30"
                    }`}>
                      {referral.status === "paid" || referral.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{referral.booking?.tour?.title || "Noma'lum"}</p>
                      <p className="text-sm text-muted-foreground">
                        {referral.booking?.tour?.destination} • {new Date(referral.created_at).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 flex items-center gap-1">
                      <ArrowUpRight className="h-4 w-4" />
                      +{formatPrice(referral.commission_amount || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {referral.status === "paid" || referral.status === "completed" ? "To'langan" : "Kutilmoqda"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Hali daromadlar yo'q</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            To'lov usullari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs">
                  CLICK
                </div>
                <span className="font-medium">Click</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Click orqali to'lov qabul qilish
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-dashed border-muted">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-8 bg-cyan-500 rounded flex items-center justify-center text-white font-bold text-xs">
                  PAYME
                </div>
                <span className="font-medium">Payme</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Payme orqali to'lov qabul qilish
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentEarnings;
