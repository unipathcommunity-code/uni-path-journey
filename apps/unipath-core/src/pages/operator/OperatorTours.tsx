import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
};

const OperatorTours = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: tours = [], isLoading } = useQuery({
    queryKey: ["operator-tours", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("operator_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (tourId: string) => {
      // Delete related data first
      await supabase.from("tour_itineraries").delete().eq("tour_id", tourId);
      await supabase.from("tour_inclusions").delete().eq("tour_id", tourId);
      await supabase.from("tour_hotels").delete().eq("tour_id", tourId);
      await supabase.from("tour_vehicles").delete().eq("tour_id", tourId);

      const { error } = await supabase.from("tours").delete().eq("id", tourId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator-tours"] });
      toast.success("Tur o'chirildi");
    },
    onError: () => {
      toast.error("Turni o'chirishda xatolik");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success">{t("operator.approved")}</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive">{t("operator.rejected")}</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning">{t("operator.pendingStatus")}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("operator.myTours")}</h1>
          <p className="text-muted-foreground">{t("operator.manageTours")}</p>
        </div>
        <Link to="/operator/tours/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("operator.addNewTour")}
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Tur
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Davomiylik
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Narx
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Holat
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody>
              {tours.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Hozircha turlar yo'q. Yangi tur qo'shing!
                  </td>
                </tr>
              ) : (
                tours.map((tour: any) => (
                  <tr key={tour.id} className="border-t border-border">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={tour.image || "/placeholder.svg"}
                          alt={tour.title}
                          className="w-16 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{tour.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {tour.destination}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {tour.duration_days} kun / {tour.duration_nights} tun
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {formatPrice(tour.price)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(tour.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {tour.status === "approved" && (
                          <Link to={`/tours/${tour.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Link to={`/operator/tours/${tour.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Turni o'chirish</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{tour.title}" turini o'chirmoqchimisiz? Bu amalni
                                bekor qilib bo'lmaydi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(tour.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                O'chirish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperatorTours;
