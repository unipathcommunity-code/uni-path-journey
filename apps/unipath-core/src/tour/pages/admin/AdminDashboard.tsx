import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Package, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Ticket,
  MapPin,
  Loader2,
  ArrowUpRight,
  Eye,
  History,
  FileText,
  Bell,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { formatPrice } from "@/data/tours";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTranslation } from "react-i18next";
import PageTransition from "@/components/common/PageTransition";
import AnimatedCard from "@/components/common/AnimatedCard";
import StaggerContainer, { staggerItem } from "@/components/common/StaggerContainer";
import UniTourLoader from "@/components/common/UniTourLoader";
import { motion } from "framer-motion";

const AdminDashboard = () => {
  const { t } = useTranslation();
  // Fetch real stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      // Users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Tours count
      const { count: toursCount } = await supabase
        .from("tours")
        .select("*", { count: "exact", head: true });

      // Pending tours
      const { count: pendingToursCount } = await supabase
        .from("tours")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("total_price, status");

      const totalRevenue = bookings?.filter(b => b.status === "confirmed").reduce((sum, b) => sum + b.total_price, 0) || 0;
      const pendingBookings = bookings?.filter(b => b.status === "pending").length || 0;

      // Agents count
      const { count: agentsCount } = await (supabase as any)
        .from("agents")
        .select("*", { count: "exact", head: true });

      // Destinations count  
      const { count: destinationsCount } = await supabase
        .from("destinations")
        .select("*", { count: "exact", head: true });

      // Tour companies (multi-tenant)
      const { count: companiesCount } = await (supabase as any)
        .from("tour_companies")
        .select("*", { count: "exact", head: true });
      const { count: pendingCompaniesCount } = await (supabase as any)
        .from("tour_companies")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      return {
        users: usersCount || 0,
        tours: toursCount || 0,
        pendingTours: pendingToursCount || 0,
        bookings: bookings?.length || 0,
        pendingBookings,
        revenue: totalRevenue,
        agents: agentsCount || 0,
        destinations: destinationsCount || 0,
        companies: companiesCount || 0,
        pendingCompanies: pendingCompaniesCount || 0,
      };
    },
  });

  // Recent audit logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["admin-recent-logs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Mock chart data (replace with real data later)
  const chartData = [
    { name: "Yan", bookings: 4, revenue: 2400000 },
    { name: "Fev", bookings: 3, revenue: 1800000 },
    { name: "Mar", bookings: 7, revenue: 4200000 },
    { name: "Apr", bookings: 5, revenue: 3000000 },
    { name: "May", bookings: 8, revenue: 4800000 },
    { name: "Iyun", bookings: 12, revenue: 7200000 },
  ];

  const tourTypeData = [
    { name: t("admin.domesticTours"), value: 45 },
    { name: t("admin.internationalTours"), value: 30 },
    { name: t("admin.hajUmra"), value: 25 },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

  // Recent bookings
  const { data: recentBookings = [] } = useQuery({
    queryKey: ["admin-recent-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          tours (title, destination, image)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Pending tours
  const { data: pendingTours = [] } = useQuery({
    queryKey: ["admin-pending-tours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("id, title, destination, image, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const statCards = [
    { 
      label: t("admin.totalUsers"), 
      value: stats?.users || 0, 
      icon: Users, 
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      href: "/admin/users",
    },
    { 
      label: t("admin.totalTours"), 
      value: stats?.tours || 0, 
      icon: Package, 
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      href: "/admin/tours",
    },
    { 
      label: t("admin.agents"), 
      value: stats?.agents || 0, 
      icon: Building2, 
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      href: "/admin/agents",
    },
    { 
      label: t("admin.totalRevenue"), 
      value: formatPrice(stats?.revenue || 0), 
      icon: DollarSign, 
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      href: "/admin/bookings",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700">{t("admin.confirmed")}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">{t("admin.pending")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <UniTourLoader size="lg" />;
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
        <p className="text-muted-foreground">{t("admin.subtitle")}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <AnimatedCard key={i} index={i}>
          <Link to={stat.href}>
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
          </AnimatedCard>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">{t("admin.pendingTours")}</p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{stats?.pendingTours || 0}</p>
              </div>
              <Package className="h-10 w-10 text-yellow-600/50" />
            </div>
            <Link to="/admin/tours">
              <Button variant="link" className="px-0 text-yellow-700 dark:text-yellow-300">
                {t("admin.view")} →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 dark:text-blue-200 font-medium">{t("admin.newOrders")}</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats?.pendingBookings || 0}</p>
              </div>
              <Ticket className="h-10 w-10 text-blue-600/50" />
            </div>
            <Link to="/admin/bookings">
              <Button variant="link" className="px-0 text-blue-700 dark:text-blue-300">
                {t("admin.view")} →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 dark:text-green-200 font-medium">{t("admin.destinations")}</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats?.destinations || 0}</p>
              </div>
              <MapPin className="h-10 w-10 text-green-600/50" />
            </div>
            <Link to="/admin/destinations">
              <Button variant="link" className="px-0 text-green-700 dark:text-green-300">
                {t("admin.view")} →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("admin.revenueStats")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                  formatter={(value: number) => formatPrice(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tour Types Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("admin.tourTypes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={tourTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tourTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {tourTypeData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index] }} 
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              {t("admin.recentBookings")}
            </CardTitle>
            <Link to="/admin/bookings">
              <Button variant="ghost" size="sm">{t("admin.viewAll")}</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <img
                      src={booking.tours?.image || "/placeholder.svg"}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{booking.tours?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.created_at).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(booking.total_price)}</p>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Ticket className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>{t("admin.noBookings")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("admin.pendingApproval")}
            </CardTitle>
            <Link to="/admin/tours">
              <Button variant="ghost" size="sm">{t("admin.viewAll")}</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingTours.length > 0 ? (
              <div className="space-y-4">
                {pendingTours.map((tour: any) => (
                  <div key={tour.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <img
                      src={tour.image || "/placeholder.svg"}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tour.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {tour.destination}
                      </p>
                    </div>
                    <Link to={`/tours/${tour.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>{t("admin.noPendingTours")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/document-control">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>{t("admin.docControl")}</span>
              </Button>
            </Link>
            <Link to="/admin/notifications">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Bell className="h-6 w-6" />
                <span>{t("admin.sendNotification")}</span>
              </Button>
            </Link>
            <Link to="/admin/audit-log">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <History className="h-6 w-6" />
                <span>{t("admin.actionHistory")}</span>
              </Button>
            </Link>
            <Link to="/admin/tours/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Package className="h-6 w-6" />
                <span>{t("admin.newTour")}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
};

export default AdminDashboard;
