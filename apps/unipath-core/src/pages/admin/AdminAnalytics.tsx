import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Clock, MapPin, TrendingUp, Loader2, Eye, MousePointer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import PageTransition from "@/components/common/PageTransition";
import { motion } from "framer-motion";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--accent))"];

const AdminAnalytics = () => {
  // Page views analytics
  const { data: pageViews = [], isLoading } = useQuery({
    queryKey: ["admin-page-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_analytics")
        .select("page_path, time_spent_seconds, created_at, session_id")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  // Applications analytics
  const { data: applicationStats } = useQuery({
    queryKey: ["admin-application-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("created_at, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const uniqueSessions = new Set(pageViews.map((p) => p.session_id)).size;
  const totalPageViews = pageViews.length;
  const avgTimeOnSite = pageViews.length > 0
    ? Math.round(pageViews.reduce((a, b) => a + (b.time_spent_seconds || 0), 0) / pageViews.length)
    : 0;

  // Top pages
  const pageCountMap = new Map<string, number>();
  pageViews.forEach((p) => {
    pageCountMap.set(p.page_path, (pageCountMap.get(p.page_path) || 0) + 1);
  });
  const topPages = Array.from(pageCountMap.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Application funnel
  const totalVisits = uniqueSessions;
  const searchViews = pageViews.filter((p) => p.page_path.startsWith("/search")).length;
  const applicationStarts = pageViews.filter((p) => p.page_path.startsWith("/student/applications")).length;
  const submittedApplications = applicationStats?.filter((a) => a.status !== "cancelled").length || 0;
  const acceptedApplications = applicationStats?.filter((a) => a.status === "accepted").length || 0;
  const conversionRate = totalVisits > 0 ? ((submittedApplications / totalVisits) * 100).toFixed(1) : "0";

  const funnelData = [
    { name: "Sayt tashrifi", value: totalVisits },
    { name: "Universitet qidiruvi", value: searchViews },
    { name: "Ariza boshlash", value: applicationStarts },
    { name: "Yuborilgan ariza", value: submittedApplications },
    { name: "Qabul qilingan", value: acceptedApplications },
  ];

  // Daily applications chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const dailyApplications = last7Days.map((date) => ({
    date: new Date(date).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }),
    applications: applicationStats?.filter((a) => a.created_at.startsWith(date)).length || 0,
  }));

  // Application status distribution
  const statusDistribution = [
    { name: "Kutilmoqda", value: applicationStats?.filter((a) => a.status === "pending").length || 0 },
    { name: "Ko'rib chiqilmoqda", value: applicationStats?.filter((a) => a.status === "reviewing").length || 0 },
    { name: "Qabul qilingan", value: applicationStats?.filter((a) => a.status === "accepted").length || 0 },
    { name: "Rad etilgan", value: applicationStats?.filter((a) => a.status === "rejected").length || 0 },
  ].filter((d) => d.value > 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics
          </h1>
          <p className="text-muted-foreground">Sayt trafigi va konversiya ma'lumotlari</p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Sessiyalar", value: uniqueSessions, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "Sahifa ko'rishlar", value: totalPageViews, icon: Eye, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
            { label: "O'rtacha vaqt", value: `${avgTimeOnSite}s`, icon: Clock, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
            { label: "Konversiya", value: `${conversionRate}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kunlik arizalar (7 kun)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyApplications}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Konversiya qisqarishi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelData.map((step, i) => {
                  const maxVal = Math.max(...funnelData.map((d) => d.value), 1);
                  const pct = (step.value / maxVal) * 100;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{step.name}</span>
                        <span className="font-semibold">{step.value}</span>
                      </div>
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          className="h-full bg-primary/80 rounded-full flex items-center justify-end pr-2"
                        >
                          {pct > 20 && <span className="text-xs text-primary-foreground font-medium">{pct.toFixed(0)}%</span>}
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Top sahifalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Ma'lumotlar hali yo'q</p>
                ) : (
                  topPages.map((page, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[200px]">{page.path}</span>
                      <span className="font-medium">{page.count} ko'rish</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ariza holatlari</CardTitle>
            </CardHeader>
            <CardContent>
              {statusDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Ma'lumotlar yo'q</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                        {statusDistribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    {statusDistribution.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{d.name}: {d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminAnalytics;
