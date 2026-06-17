import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Calendar, Search, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface Agent {
  id: string;
  name: string;
  user_id: string | null;
}

interface Referral {
  id: string;
  agent_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
  booking?: {
    tour?: {
      title: string;
      image: string | null;
      destination: string;
    };
  };
}

const AgentReferrals = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    queryKey: ["agent-referrals-all", agent?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_referrals")
        .select(`
          *,
          booking:bookings(
            *,
            tour:tours(title, image, destination)
          )
        `)
        .eq("agent_id", agent?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!agent?.id,
  });

  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch = r.booking?.tour?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusLabels: Record<string, string> = {
    pending: "Kutilmoqda",
    completed: "To'langan",
    cancelled: "Bekor qilingan",
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
      <div>
        <h1 className="text-2xl font-bold">Yo'naltirishlar</h1>
        <p className="text-muted-foreground">
          Siz orqali kelgan barcha buyurtmalar
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tur nomi bo'yicha qidirish..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="completed">To'langan</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{referrals.length}</p>
                <p className="text-sm text-muted-foreground">Jami yo'naltirishlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {referrals.filter((r) => r.status === "completed").length}
                </p>
                <p className="text-sm text-muted-foreground">Muvaffaqiyatli</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/30">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {referrals.filter((r) => r.status === "pending").length}
                </p>
                <p className="text-sm text-muted-foreground">Kutilmoqda</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Yo'naltirishlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReferrals.length > 0 ? (
            <div className="space-y-4">
              {filteredReferrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={referral.booking?.tour?.image || "/placeholder.svg"}
                      alt={referral.booking?.tour?.title || "Tour"}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium">
                        {referral.booking?.tour?.title || "Noma'lum tur"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {referral.booking?.tour?.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString("uz-UZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{referral.commission_amount?.toLocaleString()} so'm
                      </p>
                      <p className="text-xs text-muted-foreground">Komissiya</p>
                    </div>
                    <Badge className={statusColors[referral.status] || "bg-gray-100"}>
                      {statusLabels[referral.status] || referral.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Hech qanday yo'naltirish topilmadi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentReferrals;
