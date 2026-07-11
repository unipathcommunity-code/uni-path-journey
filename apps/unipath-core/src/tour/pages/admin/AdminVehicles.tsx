import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit, Trash2, Car, Loader2, Bus, Users, Wifi, Tv, Wind, Bath } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/contexts/AppContext";

interface VehicleForm { name: string; vehicle_type: string; brand: string; model: string; color: string; capacity: number; plate_number: string; driver_name: string; driver_phone: string; price_per_day: number; description: string; image: string; has_air_conditioning: boolean; has_wifi: boolean; has_tv: boolean; has_toilet: boolean; is_available: boolean; }

const initialFormData: VehicleForm = { name: "", vehicle_type: "car", brand: "", model: "", color: "", capacity: 4, plate_number: "", driver_name: "", driver_phone: "", price_per_day: 0, description: "", image: "", has_air_conditioning: true, has_wifi: false, has_tv: false, has_toilet: false, is_available: true };

const AdminVehicles = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { activeTenant } = useApp();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VehicleForm>(initialFormData);

  const vehicleTypes = [
    { value: "car", label: t("admin.vehicles") === "Транспорт" ? "Автомобиль" : t("admin.vehicles") === "Vehicles" ? "Car" : "Avtomobil", icon: Car },
    { value: "minibus", label: t("admin.vehicles") === "Транспорт" ? "Микроавтобус" : t("admin.vehicles") === "Vehicles" ? "Minibus" : "Mikroavtobus", icon: Bus },
    { value: "bus", label: t("admin.vehicles") === "Транспорт" ? "Автобус" : t("admin.vehicles") === "Vehicles" ? "Bus" : "Avtobus", icon: Bus },
  ];

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["admin-vehicles", activeTenant?.id],
    enabled: !!activeTenant?.id,
    queryFn: async () => { const { data, error } = await (supabase as any).from("vehicles").select("*").eq("tenant_id", activeTenant!.id).order("vehicle_type"); if (error) throw error; return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (data: VehicleForm) => { const { error } = await (supabase as any).from("vehicles").insert({ ...data, tenant_id: activeTenant?.id, price_per_day: data.price_per_day || null }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] }); toast({ title: t("admin.success"), description: t("admin.vehicleAdded") }); resetForm(); },
    onError: () => { toast({ title: t("admin.error"), description: t("admin.error"), variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VehicleForm }) => { const { error } = await supabase.from("vehicles").update({ ...data, price_per_day: data.price_per_day || null }).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] }); toast({ title: t("admin.success"), description: t("admin.vehicleUpdated") }); resetForm(); },
    onError: () => { toast({ title: t("admin.error"), description: t("admin.error"), variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("vehicles").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] }); toast({ title: t("admin.success"), description: t("admin.vehicleDeleted") }); setDeleteId(null); },
    onError: () => { toast({ title: t("admin.error"), description: t("admin.error"), variant: "destructive" }); },
  });

  const resetForm = () => { setFormData(initialFormData); setEditingId(null); setIsDialogOpen(false); };

  const handleEdit = (vehicle: any) => { setEditingId(vehicle.id); setFormData({ name: vehicle.name, vehicle_type: vehicle.vehicle_type, brand: vehicle.brand || "", model: vehicle.model || "", color: vehicle.color || "", capacity: vehicle.capacity, plate_number: vehicle.plate_number || "", driver_name: vehicle.driver_name || "", driver_phone: vehicle.driver_phone || "", price_per_day: vehicle.price_per_day || 0, description: vehicle.description || "", image: vehicle.image || "", has_air_conditioning: vehicle.has_air_conditioning || false, has_wifi: vehicle.has_wifi || false, has_tv: vehicle.has_tv || false, has_toilet: vehicle.has_toilet || false, is_available: vehicle.is_available !== false }); setIsDialogOpen(true); };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.name || !formData.vehicle_type) { toast({ title: t("admin.error"), description: t("admin.fillRequired"), variant: "destructive" }); return; } if (editingId) { updateMutation.mutate({ id: editingId, data: formData }); } else { createMutation.mutate(formData); } };

  const formatPrice = (price: number) => new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
  const getVehicleTypeLabel = (type: string) => vehicleTypes.find(t => t.value === type)?.label || type;
  const getVehicleIcon = (type: string) => vehicleTypes.find(t => t.value === type)?.icon || Car;

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">{t("admin.vehicles")}</h1><p className="text-muted-foreground">{t("admin.vehiclesManagement")}</p></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2" onClick={() => { resetForm(); setIsDialogOpen(true); }}><Plus className="h-4 w-4" />{t("admin.newVehicle")}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader><DialogTitle>{editingId ? t("admin.editVehicle") : t("admin.addVehicle")}</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t("admin.name")} *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t("admin.type")} *</Label><Select value={formData.vehicle_type} onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{vehicleTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Brand</Label><Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Model</Label><Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Color</Label><Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t("tours.people")} *</Label><Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-2"><Label>Plate #</Label><Input value={formData.plate_number} onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Driver</Label><Input value={formData.driver_name} onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t("admin.phone")}</Label><Input value={formData.driver_phone} onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>{t("admin.price")}</Label><Input type="number" value={formData.price_per_day || ""} onChange={(e) => setFormData({ ...formData, price_per_day: parseInt(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>{t("admin.description")}</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
                <div className="space-y-2"><Label>{t("admin.imageUrl")}</Label><Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} /></div>
                <div className="space-y-3 pt-2"><div className="grid grid-cols-2 gap-3">
                  {[{ key: "has_air_conditioning", label: "A/C", icon: Wind }, { key: "has_wifi", label: "Wi-Fi", icon: Wifi }, { key: "has_tv", label: "TV", icon: Tv }, { key: "has_toilet", label: "WC", icon: Bath }].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{label}</span></div><Switch checked={formData[key as keyof VehicleForm] as boolean} onCheckedChange={(checked) => setFormData({ ...formData, [key]: checked })} /></div>
                  ))}
                </div></div>
                <div className="flex gap-2 pt-4"><Button type="button" variant="outline" onClick={resetForm} className="flex-1">{t("admin.cancel")}</Button><Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>{(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingId ? t("admin.save") : t("admin.add")}</Button></div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle: any) => {
          const VehicleIcon = getVehicleIcon(vehicle.vehicle_type);
          return (
            <div key={vehicle.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="aspect-video relative">
                <img src={vehicle.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800"} alt={vehicle.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2"><Badge className={vehicle.is_available ? "bg-success text-success-foreground" : "bg-destructive"}>{vehicle.is_available ? t("admin.active") : t("admin.inactive")}</Badge></div>
                <div className="absolute bottom-2 left-2"><Badge variant="secondary" className="gap-1"><VehicleIcon className="h-3 w-3" />{getVehicleTypeLabel(vehicle.vehicle_type)}</Badge></div>
              </div>
              <div className="p-4 space-y-3">
                <div><h3 className="font-semibold">{vehicle.name}</h3><p className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model} • {vehicle.color}</p></div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{vehicle.capacity} {t("tours.people")}</span>
                  {vehicle.plate_number && <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{vehicle.plate_number}</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {vehicle.has_air_conditioning && <Badge variant="secondary" className="text-xs"><Wind className="h-3 w-3 mr-1" />A/C</Badge>}
                  {vehicle.has_wifi && <Badge variant="secondary" className="text-xs"><Wifi className="h-3 w-3 mr-1" />WiFi</Badge>}
                  {vehicle.has_tv && <Badge variant="secondary" className="text-xs"><Tv className="h-3 w-3 mr-1" />TV</Badge>}
                </div>
                {vehicle.driver_name && <div className="text-sm text-muted-foreground">🚗 {vehicle.driver_name}</div>}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-semibold text-primary">{vehicle.price_per_day ? formatPrice(vehicle.price_per_day) : "-"}</span>
                  <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(vehicle.id)}><Trash2 className="h-4 w-4" /></Button></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("admin.deleteVehicle")}</AlertDialogTitle><AlertDialogDescription>{t("admin.deleteDestinationDesc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("admin.delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVehicles;
