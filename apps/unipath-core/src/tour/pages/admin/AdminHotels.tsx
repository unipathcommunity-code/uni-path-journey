import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit, Trash2, Hotel, Loader2, Star, Wifi, Car, Waves, Dumbbell, Sparkles, Wind, Utensils } from "lucide-react";
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

interface HotelForm { name: string; destination_id: string; address: string; description: string; star_rating: number; room_count: number; price_per_night: number; image: string; phone: string; email: string; has_restaurant: boolean; has_wifi: boolean; has_parking: boolean; has_pool: boolean; has_gym: boolean; has_spa: boolean; has_air_conditioning: boolean; breakfast_included: boolean; lunch_included: boolean; dinner_included: boolean; is_partner: boolean; }

const initialFormData: HotelForm = { name: "", destination_id: "", address: "", description: "", star_rating: 3, room_count: 0, price_per_night: 0, image: "", phone: "", email: "", has_restaurant: false, has_wifi: true, has_parking: false, has_pool: false, has_gym: false, has_spa: false, has_air_conditioning: true, breakfast_included: false, lunch_included: false, dinner_included: false, is_partner: true };

const AdminHotels = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { activeTenant } = useApp();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HotelForm>(initialFormData);

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ["admin-hotels", activeTenant?.id],
    enabled: !!activeTenant?.id,
    queryFn: async () => { const { data, error } = await (supabase as any).from("hotels").select("*, destinations(name)").eq("tenant_id", activeTenant!.id).order("star_rating", { ascending: false }); if (error) throw error; return data; },
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ["destinations-list", activeTenant?.id],
    enabled: !!activeTenant?.id,
    queryFn: async () => { const { data, error } = await (supabase as any).from("destinations").select("id, name").eq("tenant_id", activeTenant!.id).order("name"); if (error) throw error; return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (data: HotelForm) => { const { error } = await (supabase as any).from("hotels").insert({ ...data, tenant_id: activeTenant?.id, destination_id: data.destination_id || null, price_per_night: data.price_per_night || null, room_count: data.room_count || null }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-hotels"] }); toast({ title: t("admin.success"), description: t("admin.hotelAdded") }); resetForm(); },
    onError: () => { toast({ title: t("admin.error"), description: t("admin.error"), variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: HotelForm }) => { const { error } = await supabase.from("hotels").update({ ...data, destination_id: data.destination_id || null, price_per_night: data.price_per_night || null, room_count: data.room_count || null }).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-hotels"] }); toast({ title: t("admin.success"), description: t("admin.hotelUpdated") }); resetForm(); },
    onError: () => { toast({ title: t("admin.error"), description: t("admin.error"), variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hotels").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-hotels"] }); toast({ title: t("admin.success"), description: t("admin.hotelDeleted") }); setDeleteId(null); },
    onError: () => { toast({ title: t("admin.error"), description: t("admin.error"), variant: "destructive" }); },
  });

  const resetForm = () => { setFormData(initialFormData); setEditingId(null); setIsDialogOpen(false); };

  const handleEdit = (hotel: any) => {
    setEditingId(hotel.id);
    setFormData({ name: hotel.name, destination_id: hotel.destination_id || "", address: hotel.address || "", description: hotel.description || "", star_rating: hotel.star_rating || 3, room_count: hotel.room_count || 0, price_per_night: hotel.price_per_night || 0, image: hotel.image || "", phone: hotel.phone || "", email: hotel.email || "", has_restaurant: hotel.has_restaurant || false, has_wifi: hotel.has_wifi || false, has_parking: hotel.has_parking || false, has_pool: hotel.has_pool || false, has_gym: hotel.has_gym || false, has_spa: hotel.has_spa || false, has_air_conditioning: hotel.has_air_conditioning || false, breakfast_included: hotel.breakfast_included || false, lunch_included: hotel.lunch_included || false, dinner_included: hotel.dinner_included || false, is_partner: hotel.is_partner || false });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.name) { toast({ title: t("admin.error"), description: t("admin.fillRequired"), variant: "destructive" }); return; } if (editingId) { updateMutation.mutate({ id: editingId, data: formData }); } else { createMutation.mutate(formData); } };

  const formatPrice = (price: number) => new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">{t("admin.hotelsMenu")}</h1><p className="text-muted-foreground">{t("admin.hotelsManagement")}</p></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2" onClick={() => { resetForm(); setIsDialogOpen(true); }}><Plus className="h-4 w-4" />{t("admin.newHotel")}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader><DialogTitle>{editingId ? t("admin.editHotel") : t("admin.addHotel")}</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t("admin.name")} *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t("admin.destinations")}</Label><Select value={formData.destination_id} onValueChange={(v) => setFormData({ ...formData, destination_id: v })}><SelectTrigger><SelectValue placeholder={t("admin.selectTour")} /></SelectTrigger><SelectContent>{destinations.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>{t("admin.address")}</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("admin.description")}</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>⭐</Label><Select value={formData.star_rating.toString()} onValueChange={(v) => setFormData({ ...formData, star_rating: parseInt(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>🛏️</Label><Input type="number" value={formData.room_count || ""} onChange={(e) => setFormData({ ...formData, room_count: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-2"><Label>{t("admin.price")}</Label><Input type="number" value={formData.price_per_night || ""} onChange={(e) => setFormData({ ...formData, price_per_night: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t("admin.phone")}</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>{t("admin.imageUrl")}</Label><Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} /></div>
                <div className="space-y-3 pt-2"><Label className="text-base font-semibold">Wi-Fi / Parking / Pool</Label><div className="grid grid-cols-2 gap-3">
                  {[{ key: "has_wifi", label: "Wi-Fi", icon: Wifi }, { key: "has_parking", label: "Parking", icon: Car }, { key: "has_pool", label: "Pool", icon: Waves }, { key: "has_gym", label: "Gym", icon: Dumbbell }, { key: "has_spa", label: "SPA", icon: Sparkles }, { key: "has_air_conditioning", label: "A/C", icon: Wind }, { key: "has_restaurant", label: "Restaurant", icon: Utensils }].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{label}</span></div><Switch checked={formData[key as keyof HotelForm] as boolean} onCheckedChange={(checked) => setFormData({ ...formData, [key]: checked })} /></div>
                  ))}
                </div></div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg"><span className="font-medium">Partner</span><Switch checked={formData.is_partner} onCheckedChange={(checked) => setFormData({ ...formData, is_partner: checked })} /></div>
                <div className="flex gap-2 pt-4"><Button type="button" variant="outline" onClick={resetForm} className="flex-1">{t("admin.cancel")}</Button><Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>{(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingId ? t("admin.save") : t("admin.add")}</Button></div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotels.map((hotel: any) => (
          <div key={hotel.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="aspect-video relative">
              <img src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"} alt={hotel.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-1">{hotel.is_partner && <Badge className="bg-primary text-primary-foreground">Partner</Badge>}</div>
              <div className="absolute bottom-2 left-2 flex gap-0.5">{Array.from({ length: hotel.star_rating || 0 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
            </div>
            <div className="p-4 space-y-3">
              <div><h3 className="font-semibold">{hotel.name}</h3><p className="text-sm text-muted-foreground">{hotel.address || t("admin.notProvided")}</p></div>
              <div className="flex flex-wrap gap-1">
                {hotel.has_wifi && <Badge variant="secondary" className="text-xs"><Wifi className="h-3 w-3 mr-1" />WiFi</Badge>}
                {hotel.has_pool && <Badge variant="secondary" className="text-xs"><Waves className="h-3 w-3 mr-1" />Pool</Badge>}
                {hotel.has_restaurant && <Badge variant="secondary" className="text-xs"><Utensils className="h-3 w-3 mr-1" />Rest.</Badge>}
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold text-primary">{hotel.price_per_night ? formatPrice(hotel.price_per_night) : "-"}</span>
                <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(hotel)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(hotel.id)}><Trash2 className="h-4 w-4" /></Button></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("admin.deleteHotel")}</AlertDialogTitle><AlertDialogDescription>{t("admin.deleteDestinationDesc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("admin.delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHotels;
