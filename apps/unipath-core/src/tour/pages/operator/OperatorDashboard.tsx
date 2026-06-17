import { Package, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
};

const OperatorDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: tours = [] } = useQuery({
    queryKey: ["operator-tours-count", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tours")
        .select("id")
        .eq("operator_id", user?.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["operator-bookings-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select(`
          *,
          tours!inner(id, title, image, operator_id)
        `)
        .order("created_at", { ascending: false });
      return data?.filter((b: any) => b.tours?.operator_id === user?.id) || [];
    },
    enabled: !!user?.id,
  });

  const pendingBookings = bookings.filter((b: any) => b.status === "pending");
  const confirmedBookings = bookings.filter((b: any) => b.status === "confirmed");

  const totalRevenue = confirmedBookings.reduce(
    (acc: number, b: any) => acc + (b.total_price || 0),
    0
  );

  const stats = [
    { label: t("operator.totalTours"), value: tours.length, icon: Package, color: "bg-primary/10 text-primary" },
    { label: t("operator.activeBookings"), value: pendingBookings.length, icon: Calendar, color: "bg-info/10 text-info" },
    { label: t("operator.totalRevenue"), value: formatPrice(totalRevenue), icon: DollarSign, color: "bg-success/10 text-success" },
    { label: t("operator.confirmedCount"), value: confirmedBookings.length, icon: TrendingUp, color: "bg-accent/10 text-accent" },
  ];

  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("operator.dashboard")}</h1>
        <p className="text-muted-foreground">{t("operator.welcome")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="font-semibold text-lg">{t("operator.recentBookings")}</h2>
        </div>
        <div className="p-6">
          {recentBookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("operator.noBookingsYet")}
            </p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={booking.tours?.image || "/placeholder.svg"}
                      alt={booking.tours?.title}
                      className="w-12 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium">{booking.tours?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.travel_date), "dd.MM.yyyy")} •{" "}
                        {booking.people_count} kishi
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {formatPrice(booking.total_price)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === "confirmed"
                          ? "bg-success/10 text-success"
                          : booking.status === "cancelled"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {booking.status === "confirmed"
                        ? "Tasdiqlangan"
                        : booking.status === "cancelled"
                        ? "Bekor qilingan"
                        : "Kutilmoqda"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
