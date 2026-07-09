import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/contexts/AppContext";
import TeacherDashboard from "../TeacherDashboard";
import { 
  Users, 
  MapPin, 
  Wallet, 
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageTransition from "@/components/common/PageTransition";
import AnimatedCard from "@/components/common/AnimatedCard";
import UniTourLoader from "@/components/common/UniTourLoader";
import { motion } from "framer-motion";

interface Agent {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  email: string | null;
  commission_rate: number | null;
  is_active: boolean;
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
    };
  };
}

const AgentDashboard = () => {
  const { user } = useAuth();
  const { activeTenant } = useApp();

  const impersonatedTenantRaw = localStorage.getItem('active_tenant');
  const impersonatedTenant = impersonatedTenantRaw ? JSON.parse(impersonatedTenantRaw) : null;
  const effectiveTenant = impersonatedTenant || activeTenant;
  const activeModules = (effectiveTenant?.config?.modules ?? {}) as Record<string, boolean>;

  const detectVertical = (modules: Record<string, boolean> = {}): string => {
    const VERTICALS = [
      'consulting', 'academy', 'hotel', 'pharmacy', 'restaurant', 'clinic',
      'gym', 'manufacturing', 'parking', 'auto_service', 'wholesale',
      'wedding_hall', 'kindergarten', 'library', 'cosmetics', 'stadium', 'tour',
    ];
    return VERTICALS.find(v => !!modules[v]) ?? 'consulting';
  };

  let vertical = effectiveTenant?.business_type || effectiveTenant?.config?.business_type || effectiveTenant?.vertical || detectVertical(activeModules) || 'consulting';
  if (vertical === 'nova' || vertical === 'edu') vertical = 'academy';
  if (vertical === 'unitour' || vertical === 'tour_farm' || vertical === 'travel') vertical = 'tour';

  const { data: agent, isLoading: agentLoading } = useQuery({
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

  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ["agent-referrals", agent?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_referrals")
        .select(`
          *,
          booking:bookings(
            *,
            tour:tours(title, image)
          )
        `)
        .eq("agent_id", agent?.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!agent?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["agent-stats", agent?.id],
    queryFn: async () => {
      const { data: allReferrals } = await (supabase as any)
        .from("agent_referrals")
        .select("commission_amount, status")
        .eq("agent_id", agent?.id);

      const refs = (allReferrals || []) as { commission_amount: number; status: string }[];
      const totalEarnings = refs.reduce((sum, r) => sum + (r.commission_amount || 0), 0);
      const pendingEarnings = refs.filter(r => r.status === "pending").reduce((sum, r) => sum + (r.commission_amount || 0), 0);
      const completedReferrals = refs.filter(r => r.status === "completed").length;

      return {
        totalEarnings,
        pendingEarnings,
        totalReferrals: refs.length,
        completedReferrals,
      };
    },
    enabled: !!agent?.id,
  });

  // Academy tenants use the teacher dashboard. This check MUST stay below all hooks
  // above — an early return before them broke the Rules of Hooks and crashed the page.
  if (vertical === 'academy') {
    return <TeacherDashboard />;
  }

  const statsCards = [
    {
      title: "Jami yo'naltirishlar",
      value: stats?.totalReferrals || 0,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Muvaffaqiyatli",
      value: stats?.completedReferrals || 0,
      icon: MapPin,
      trend: "+8%",
      trendUp: true,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Jami daromad",
      value: `${(stats?.totalEarnings || 0).toLocaleString()} so'm`,
      icon: Wallet,
      trend: "+23%",
      trendUp: true,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Kutilayotgan",
      value: `${(stats?.pendingEarnings || 0).toLocaleString()} so'm`,
      icon: TrendingUp,
      trend: "3 ta",
      trendUp: false,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  if (agentLoading) {
    return <UniTourLoader size="lg" text="Agent paneli yuklanmoqda..." />;
  }

  if (!agent) {
    return (
      <div className="text-center py-16">
        <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Agent topilmadi</h2>
        <p className="text-muted-foreground">
          Sizning hisobingiz hali agent sifatida ro'yxatdan o'tmagan.
          <br />
          Iltimos, administrator bilan bog'laning.
        </p>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold">Xush kelibsiz, {agent.name}!</h1>
        <p className="text-muted-foreground">{agent.company_name}</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <AnimatedCard key={index} index={index}>
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300">
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
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
          </AnimatedCard>
        ))}
      </div>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Oxirgi yo'naltirishlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referralsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : referrals.length > 0 ? (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={referral.booking?.tour?.image || "/placeholder.svg"}
                      alt={referral.booking?.tour?.title || "Tour"}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium">{referral.booking?.tour?.title || "Noma'lum tur"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{referral.commission_amount?.toLocaleString()} so'm
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        referral.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : referral.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {referral.status === "completed" ? "To'langan" : 
                       referral.status === "pending" ? "Kutilmoqda" : referral.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Hali yo'naltirishlar yo'q</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Info */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Sizning komissiya stavkangiz
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Har bir muvaffaqiyatli bron uchun
              </p>
            </div>
            <div className="text-4xl font-bold text-green-700 dark:text-green-300">
              {agent.commission_rate || 10}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
};

export default AgentDashboard;
