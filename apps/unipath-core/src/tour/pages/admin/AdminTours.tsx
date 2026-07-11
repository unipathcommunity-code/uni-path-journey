import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Eye, MoreHorizontal, Plus, Edit, Loader2, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createNotification } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/contexts/AppContext";

type StatusFilter = "all" | "approved" | "pending" | "rejected";

const AdminTours = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { activeTenant } = useApp();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tours = [], isLoading } = useQuery({
    queryKey: ["admin-tours", statusFilter, activeTenant?.id],
    enabled: !!activeTenant?.id,
    queryFn: async () => {
      let query = (supabase as any)
        .from("tours")
        .select("*")
        .eq("tenant_id", activeTenant!.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tours").update({ status }).eq("id", id);
      if (error) throw error;

      // Find the tour to get operator_id
      const tour = tours.find(t => t.id === id);
      if (tour?.operator_id) {
        const statusLabel = status === "approved" ? "tasdiqlandi" : "rad etildi";
        await createNotification({
          userId: tour.operator_id,
          title: `Tur ${statusLabel}`,
          message: `"${tour.title}" turi admin tomonidan ${statusLabel}.`,
          type: status === "approved" ? "success" : "warning",
          category: "tour",
          relatedEntityType: "tour",
          relatedEntityId: id,
        }).catch(console.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
      toast({ title: t("admin.success"), description: t("admin.statusUpdated") });
    },
    onError: () => {
      toast({ title: t("admin.error"), description: t("admin.statusError"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete related data
      await supabase.from("tour_itineraries").delete().eq("tour_id", id);
      await supabase.from("tour_inclusions").delete().eq("tour_id", id);
      await supabase.from("tour_hotels").delete().eq("tour_id", id);
      await supabase.from("tour_vehicles").delete().eq("tour_id", id);
      
      const { error } = await supabase.from("tours").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
      toast({ title: t("admin.success"), description: t("admin.tourDeleted") });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: t("admin.error"), description: t("admin.tourDeleteError"), variant: "destructive" });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success">{t("admin.approved")}</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning">{t("admin.pending")}</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive">{t("admin.rejected")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.tourManagement")}</h1>
          <p className="text-muted-foreground">{t("admin.tourManagementDesc")}</p>
        </div>
        <Link to="/admin/tours/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("admin.newTour")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: t("admin.allStatus") },
          { value: "approved", label: t("admin.approved") },
          { value: "pending", label: t("admin.pending") },
          { value: "rejected", label: t("admin.rejected") },
        ].map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(filter.value as StatusFilter)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {tours.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.tours")}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.duration")}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.price")}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.status")}</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {tours.map((tour) => (
                  <tr key={tour.id} className="border-t border-border">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={tour.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"}
                          alt={tour.title}
                          className="w-16 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{tour.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {tour.destination}, {tour.country}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {tour.duration_days} {t("admin.day")} / {tour.duration_nights} {t("admin.night")}
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {formatPrice(tour.price)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tour.status || "pending")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/tours/${tour.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/admin/tours/${tour.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem
                              className="text-success cursor-pointer"
                              onClick={() => updateStatusMutation.mutate({ id: tour.id, status: "approved" })}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              {t("admin.approve")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={() => updateStatusMutation.mutate({ id: tour.id, status: "rejected" })}
                            >
                              <X className="h-4 w-4 mr-2" />
                              {t("admin.reject")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={() => setDeleteId(tour.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              {t("admin.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("admin.noToursYet")}</p>
          <Link to="/admin/tours/new">
            <Button className="mt-4">{t("admin.createTour")}</Button>
          </Link>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.deleteTour")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.deleteTourDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTours;
