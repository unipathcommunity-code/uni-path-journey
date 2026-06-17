import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
};

const OperatorBookings = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["operator-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          tours!inner(id, title, image, operator_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data?.filter((b: any) => b.tours?.operator_id === user?.id) || [];
    },
    enabled: !!user?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator-bookings"] });
      toast.success(t("operator.bookingUpdated"));
      setSelectedBooking(null);
    },
    onError: () => {
      toast.error(t("operator.bookingError"));
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-success/10 text-success">{t("admin.confirmed")}</Badge>;
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive">{t("admin.cancelled")}</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning">{t("admin.pending")}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("operator.bookings")}</h1>
        <p className="text-muted-foreground">{t("operator.allBookingsDesc")}</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  {t("admin.tour")}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  {t("admin.date")}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  {t("tours.people")}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  {t("admin.price")}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  {t("admin.status")}
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                  {t("admin.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    {t("operator.noBookingsYet")}
                  </td>
                </tr>
              ) : (
                bookings.map((booking: any) => (
                  <tr key={booking.id} className="border-t border-border">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={booking.tours?.image || "/placeholder.svg"}
                          alt={booking.tours?.title}
                          className="w-12 h-10 rounded-lg object-cover"
                        />
                        <span className="font-medium">{booking.tours?.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {format(new Date(booking.travel_date), "dd.MM.yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm">{booking.people_count} {t("tours.people")}</td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {formatPrice(booking.total_price)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("operator.bookingDetails")}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedBooking.tours?.image || "/placeholder.svg"}
                  alt={selectedBooking.tours?.title}
                  className="w-20 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold">{selectedBooking.tours?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedBooking.travel_date), "dd.MM.yyyy")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("operator.peopleCount")}</p>
                  <p className="font-medium">{selectedBooking.people_count} {t("tours.people")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("operator.totalPrice")}</p>
                  <p className="font-semibold text-primary">
                    {formatPrice(selectedBooking.total_price)}
                  </p>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("operator.notes")}</p>
                  <p className="text-sm">{selectedBooking.notes}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">{t("admin.status")}</p>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1 gap-2"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: selectedBooking.id,
                      status: "confirmed",
                    })
                  }
                  disabled={selectedBooking.status === "confirmed"}
                >
                  <CheckCircle className="h-4 w-4" />
                  {t("operator.confirm")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: selectedBooking.id,
                      status: "pending",
                    })
                  }
                  disabled={selectedBooking.status === "pending"}
                >
                  <Clock className="h-4 w-4" />
                  {t("operator.wait")}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: selectedBooking.id,
                      status: "cancelled",
                    })
                  }
                  disabled={selectedBooking.status === "cancelled"}
                >
                  <XCircle className="h-4 w-4" />
                  {t("operator.cancelBooking")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperatorBookings;
