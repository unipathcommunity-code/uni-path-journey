import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User, Calendar, MapPin, Package, Heart, Settings, LogOut, ChevronRight,
  Ticket, Edit, Save, X, Loader2, Phone, Mail, Camera, Shield, Bell,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/tours";
// Layout removed — clean customer dashboard
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DocumentUpload from "@/components/booking/DocumentUpload";
import BookingTimeline from "@/components/booking/BookingTimeline";
import PageTransition from "@/components/common/PageTransition";
import AnimatedCard from "@/components/common/AnimatedCard";
import UniTourLoader from "@/components/common/UniTourLoader";
import { motion } from "framer-motion";

interface Booking {
  id: string;
  tour_id: string;
  travel_date: string;
  people_count: number;
  total_price: number;
  status: string;
  created_at: string;
  deposit_amount?: number;
  payment_status?: string;
  remaining_amount?: number;
  manager_name?: string;
  manager_phone?: string;
  guide_name?: string;
  driver_name?: string;
  pickup_location?: string;
  flight_info?: string;
  hotel_info?: string;
  tours?: {
    title: string;
    destination: string;
    image: string;
    duration_days: number;
    country: string;
  };
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Tour {
  id: string;
  title: string;
  destination: string;
  country: string;
  image: string | null;
  price: number;
  duration_days: number;
  duration_nights: number;
}

interface BookingAssignment {
  booking_id: string;
  agent_name: string;
  agent_company: string;
  assigned_at: string;
}

const getPaymentStatusBadge = (status?: string) => {
  switch (status) {
    case "deposit_paid": return { label: "Deposit to'langan", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    case "fully_paid": return { label: "To'liq to'langan", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    default: return { label: "To'lanmagan", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
  }
};

const UserDashboard = () => {
  const { t } = useTranslation();
  const { user, signOut, userRole } = useAuth();
  const { wishlist, toggleWishlist } = useWishlist();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["user-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, tours (title, destination, country, image, duration_days)`)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!user?.id,
  });

  // Fetch agent assignments for user's bookings
  const { data: assignments = [] } = useQuery({
    queryKey: ["user-booking-assignments", bookings.map(b => b.id)],
    queryFn: async () => {
      if (bookings.length === 0) return [];
      const bookingIds = bookings.map(b => b.id);
      const { data, error } = await (supabase as any)
        .from("booking_agent_assignments")
        .select("booking_id, assigned_at, agent:agents(name, company_name)")
        .in("booking_id", bookingIds);
      if (error) return [];
      return (data || []).map((a: any) => ({
        booking_id: a.booking_id,
        agent_name: a.agent?.name || "",
        agent_company: a.agent?.company_name || "",
        assigned_at: a.assigned_at,
      })) as BookingAssignment[];
    },
    enabled: bookings.length > 0,
  });

  const assignmentMap = new Map(assignments.map(a => [a.booking_id, a]));

  const { data: wishlistTours = [] } = useQuery({
    queryKey: ["wishlist-tours", wishlist],
    queryFn: async () => {
      if (wishlist.length === 0) return [];
      const { data, error } = await supabase
        .from("tours")
        .select("id, title, destination, country, image, price, duration_days, duration_nights")
        .in("id", wishlist);
      if (error) throw error;
      return data as Tour[];
    },
    enabled: wishlist.length > 0,
  });

  useEffect(() => {
    if (profile) {
      setEditedProfile({ full_name: profile.full_name || "", phone: profile.phone || "" });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        const { error } = await supabase
          .from("profiles")
          .update({ full_name: editedProfile.full_name, phone: editedProfile.phone })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({ user_id: user.id, full_name: editedProfile.full_name, phone: editedProfile.phone });
        if (error) throw error;
      }

      await refetchProfile();
      setIsEditing(false);
      toast.success(t("dashboard.profileUpdated"));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("dashboard.profileError"));
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "reserved": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "paid": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return t("dashboard.statusConfirmed");
      case "reserved": return "Band qilingan";
      case "pending": return t("dashboard.statusPending");
      case "cancelled": return t("dashboard.statusCancelled");
      case "paid": return "To'liq to'langan";
      default: return status;
    }
  };

  const getRoleText = () => {
    if (userRole === "admin") return t("dashboard.admin");
    if (userRole === "moderator") return t("dashboard.moderator");
    return t("dashboard.user");
  };

  const stats = [
    { label: t("dashboard.totalOrders"), value: bookings.length, icon: Ticket },
    { label: t("dashboard.confirmed"), value: bookings.filter((b) => b.status === "confirmed").length, icon: Package },
    { label: t("dashboard.favorites"), value: wishlist.length, icon: Heart },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/30">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white py-12"
        >
          <div className="container-custom">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-white" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg text-primary hover:bg-gray-100 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile?.full_name || user?.email?.split("@")[0] || t("dashboard.user")}
                </h1>
                <p className="text-white/80">{user?.email}</p>
              </div>

              <div className="md:ml-auto flex flex-wrap gap-2">
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />{t("dashboard.logout")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-white/70 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="container-custom py-8">
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="w-full max-w-lg grid grid-cols-4 mb-8">
              <TabsTrigger value="bookings" className="gap-2">
                <Ticket className="h-4 w-4" />{t("dashboard.bookings")}
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="h-4 w-4" />Hujjatlar
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-2">
                <Heart className="h-4 w-4" />{t("dashboard.wishlist")}
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />{t("dashboard.settings")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <h2 className="text-xl font-bold mb-4">{t("dashboard.bookingHistory")}</h2>
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : bookings.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t("dashboard.noBookings")}</h3>
                    <p className="text-muted-foreground mb-6">{t("dashboard.noBookingsDesc")}</p>
                    <Button asChild><Link to="/tours">{t("dashboard.viewTours")}</Link></Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => {
                    const assignment = assignmentMap.get(booking.id);
                    return (
                      <Card key={booking.id} className="overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                          <div className="w-full sm:w-40 h-32 sm:h-auto flex-shrink-0">
                            <img src={booking.tours?.image || "/placeholder.svg"} alt={booking.tours?.title} className="w-full h-full object-cover" />
                          </div>
                          <CardContent className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-lg">{booking.tours?.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{booking.tours?.destination}, {booking.tours?.country}</span>
                                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(booking.travel_date).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" })}</span>
                                  <span className="flex items-center gap-1"><User className="h-4 w-4" />{booking.people_count} {t("tours.people")}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={getStatusColor(booking.status || "pending")}>{getStatusText(booking.status || "pending")}</Badge>
                                {booking.payment_status && (
                                  <Badge className={getPaymentStatusBadge(booking.payment_status).className}>
                                    {getPaymentStatusBadge(booking.payment_status).label}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Manager info */}
                            {booking.manager_name && (
                              <div className="mt-3 p-3 bg-primary/5 rounded-lg flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Manager: {booking.manager_name}</p>
                                  {booking.manager_phone && (
                                    <a href={`tel:${booking.manager_phone}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                      <Phone className="h-3 w-3" />{booking.manager_phone}
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Payment info */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <div>
                                <p className="text-sm text-muted-foreground">{t("dashboard.totalPrice")}</p>
                                <p className="font-bold text-xl">{formatPrice(booking.total_price)}</p>
                                {booking.deposit_amount && booking.deposit_amount > 0 && (
                                  <div className="flex gap-3 mt-1">
                                    <span className="text-xs text-primary">Deposit: {formatPrice(booking.deposit_amount)}</span>
                                    {booking.remaining_amount && booking.remaining_amount > 0 && (
                                      <span className="text-xs text-muted-foreground">Qoldiq: {formatPrice(booking.remaining_amount)}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/tours/${booking.tour_id}`}>{t("dashboard.details")}<ChevronRight className="h-4 w-4 ml-1" /></Link>
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents">
              <h2 className="text-xl font-bold mb-4">Hujjatlarim</h2>
              {bookings.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Hujjatlar yo'q</h3>
                    <p className="text-muted-foreground">Buyurtma berganingizdan so'ng hujjatlarni yuklashingiz mumkin</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {bookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {booking.tours?.title} — {new Date(booking.travel_date).toLocaleDateString("uz-UZ")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DocumentUpload bookingId={booking.id} userId={user?.id || ""} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="wishlist">
              <h2 className="text-xl font-bold mb-4">{t("dashboard.favoriteTours")}</h2>
              {wishlistTours.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t("dashboard.noFavorites")}</h3>
                    <p className="text-muted-foreground mb-6">{t("dashboard.noFavoritesDesc")}</p>
                    <Button asChild><Link to="/tours">{t("dashboard.viewTours")}</Link></Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistTours.map((tour) => (
                    <Card key={tour.id} className="overflow-hidden group">
                      <div className="aspect-video relative">
                        <img src={tour.image || "/placeholder.svg"} alt={tour.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <button onClick={() => toggleWishlist(tour.id, tour.title)} className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg text-red-500 hover:bg-red-50 transition-colors">
                          <Heart className="h-5 w-5 fill-current" />
                        </button>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-1">{tour.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4" /><span>{tour.destination}, {tour.country}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{tour.duration_days} {t("tours.days")} / {tour.duration_nights} {t("tours.nights")}</p>
                            <p className="font-bold text-lg">{formatPrice(tour.price)}</p>
                          </div>
                          <Button size="sm" asChild><Link to={`/tours/${tour.id}`}>{t("dashboard.view")}</Link></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />{t("dashboard.profileInfo")}</CardTitle>
                      {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-2" />{t("dashboard.edit")}</Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
                          <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />{t("dashboard.save")}</>}
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">{t("dashboard.fullName")}</Label>
                          {isEditing ? (
                            <Input id="full_name" value={editedProfile.full_name} onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })} placeholder={t("auth.namePlaceholder")} />
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg"><User className="h-4 w-4 text-muted-foreground" /><span>{profile?.full_name || t("dashboard.notProvided")}</span></div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t("dashboard.phoneNumber")}</Label>
                          {isEditing ? (
                            <Input id="phone" value={editedProfile.phone} onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })} placeholder="+998 90 123 45 67" />
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg"><Phone className="h-4 w-4 text-muted-foreground" /><span>{profile?.phone || t("dashboard.notProvided")}</span></div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("auth.email")}</Label>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <Mail className="h-4 w-4 text-muted-foreground" /><span>{user?.email}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">{t("dashboard.emailVerified")}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />{t("dashboard.notifications")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div><p className="font-medium">{t("dashboard.emailNotifications")}</p><p className="text-sm text-muted-foreground">{t("dashboard.emailNotificationsDesc")}</p></div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div><p className="font-medium">{t("dashboard.orderStatus")}</p><p className="text-sm text-muted-foreground">{t("dashboard.orderStatusDesc")}</p></div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5" />{t("dashboard.security")}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">{t("dashboard.changePassword")}</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
};

export default UserDashboard;
