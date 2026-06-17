import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Loader2, ArrowLeft, MapPin, Route, ListChecks, Image, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ItineraryDay {
  id?: string;
  day: number;
  title: string;
  description: string;
  activities: string[];
}

interface InclusionItem {
  id?: string;
  item: string;
  included: boolean;
}

interface TourForm {
  title: string;
  destination: string;
  destination_id: string;
  country: string;
  duration_days: number;
  duration_nights: number;
  price: number;
  original_price: number;
  image: string;
  gallery: string[];
  description: string;
  tour_type: string;
  max_people: number;
  featured: boolean;
  status: string;
}

const tourTypes = [
  { value: "group", label: "Guruhli" },
  { value: "family", label: "Oilaviy" },
  { value: "luxury", label: "Hashamatli" },
  { value: "budget", label: "Byudjet" },
  { value: "adventure", label: "Sarguzasht" },
];

const AdminTourEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TourForm>({
    title: "", destination: "", destination_id: "", country: "",
    duration_days: 3, duration_nights: 2, price: 0, original_price: 0,
    image: "", gallery: [], description: "", tour_type: "group",
    max_people: 20, featured: false, status: "pending",
  });
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [inclusions, setInclusions] = useState<InclusionItem[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: tour, isLoading: tourLoading } = useQuery({
    queryKey: ["admin-tour-edit", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tourItinerary = [] } = useQuery({
    queryKey: ["tour-itinerary", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_itineraries").select("*").eq("tour_id", id!).order("day");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tourInclusions = [] } = useQuery({
    queryKey: ["tour-inclusions", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tour_inclusions").select("*").eq("tour_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ["destinations-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("destinations").select("id, name, country").order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (tour) {
      setFormData({
        title: tour.title, destination: tour.destination, destination_id: tour.destination_id || "",
        country: tour.country, duration_days: tour.duration_days, duration_nights: tour.duration_nights,
        price: tour.price, original_price: tour.original_price || 0, image: tour.image || "",
        gallery: tour.gallery || [], description: tour.description || "", tour_type: tour.tour_type || "group",
        max_people: tour.max_people || 20, featured: tour.featured || false, status: tour.status || "pending",
      });
    }
  }, [tour]);

  useEffect(() => {
    if (tourItinerary.length > 0) {
      setItinerary(tourItinerary.map(i => ({
        id: i.id, day: i.day, title: i.title, description: i.description || "", activities: i.activities || [],
      })));
    }
  }, [tourItinerary]);

  useEffect(() => {
    if (tourInclusions.length > 0) {
      setInclusions(tourInclusions.map(i => ({ id: i.id, item: i.item, included: i.included })));
    }
  }, [tourInclusions]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${id || "new"}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("tour-images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("tour-images").getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image: publicUrl }));
      toast({ title: "Muvaffaqiyatli", description: "Rasm yuklandi" });
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `gallery-${id || "new"}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("tour-images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("tour-images").getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, gallery: [...prev.gallery, publicUrl] }));
      toast({ title: "Muvaffaqiyatli", description: "Rasm galereyaga qo'shildi" });
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const updateTourMutation = useMutation({
    mutationFn: async () => {
      const { error: tourError } = await supabase.from("tours").update({
        title: formData.title, destination: formData.destination,
        destination_id: formData.destination_id || null, country: formData.country,
        duration_days: formData.duration_days, duration_nights: formData.duration_nights,
        price: formData.price, original_price: formData.original_price || null,
        image: formData.image || null, gallery: formData.gallery.length > 0 ? formData.gallery : null,
        description: formData.description || null, tour_type: formData.tour_type,
        max_people: formData.max_people, featured: formData.featured, status: formData.status,
      }).eq("id", id!);
      if (tourError) throw tourError;

      // Update itineraries - delete old, insert new
      await supabase.from("tour_itineraries").delete().eq("tour_id", id!);
      const validItineraries = itinerary.filter(i => i.title.trim());
      if (validItineraries.length > 0) {
        const { error: itinError } = await supabase.from("tour_itineraries").insert(
          validItineraries.map(i => ({
            tour_id: id!, day: i.day, title: i.title,
            description: i.description || null,
            activities: i.activities.filter(a => a.trim()).length > 0 ? i.activities.filter(a => a.trim()) : null,
          }))
        );
        if (itinError) throw itinError;
      }

      // Update inclusions
      await supabase.from("tour_inclusions").delete().eq("tour_id", id!);
      const validInclusions = inclusions.filter(i => i.item.trim());
      if (validInclusions.length > 0) {
        const { error: incError } = await supabase.from("tour_inclusions").insert(
          validInclusions.map(i => ({ tour_id: id!, item: i.item, included: i.included }))
        );
        if (incError) throw incError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tours"] });
      toast({ title: "Muvaffaqiyatli", description: "Tur yangilandi" });
      navigate("/admin/tours");
    },
    onError: (error) => {
      console.error(error);
      toast({ title: "Xatolik", description: "Tur yangilashda xatolik", variant: "destructive" });
    },
  });

  const handleDestinationChange = (destId: string) => {
    const dest = destinations.find(d => d.id === destId);
    if (dest) {
      setFormData({ ...formData, destination_id: destId, destination: dest.name, country: dest.country });
    }
  };

  const addItineraryDay = () => {
    setItinerary([...itinerary, { day: itinerary.length + 1, title: "", description: "", activities: [] }]);
  };

  const updateItinerary = (index: number, field: keyof ItineraryDay, value: any) => {
    const updated = [...itinerary];
    updated[index] = { ...updated[index], [field]: value };
    setItinerary(updated);
  };

  const removeItineraryDay = (index: number) => {
    setItinerary(itinerary.filter((_, i) => i !== index).map((item, i) => ({ ...item, day: i + 1 })));
  };

  const addInclusion = () => setInclusions([...inclusions, { item: "", included: true }]);

  const updateInclusion = (index: number, field: keyof InclusionItem, value: any) => {
    const updated = [...inclusions];
    updated[index] = { ...updated[index], [field]: value };
    setInclusions(updated);
  };

  const removeInclusion = (index: number) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const removeGalleryImage = (index: number) => {
    setFormData({ ...formData, gallery: formData.gallery.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.destination || !formData.country || !formData.price) {
      toast({ title: "Xatolik", description: "Majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    updateTourMutation.mutate();
  };

  if (tourLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tours")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Turni tahrirlash</h1>
          <p className="text-muted-foreground">{formData.title || "Tur ma'lumotlarini yangilang"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="basic" className="gap-2"><MapPin className="h-4 w-4" />Asosiy</TabsTrigger>
            <TabsTrigger value="itinerary" className="gap-2"><Route className="h-4 w-4" />Dastur</TabsTrigger>
            <TabsTrigger value="inclusions" className="gap-2"><ListChecks className="h-4 w-4" />Xizmatlar</TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2"><Image className="h-4 w-4" />Rasmlar</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader><CardTitle>Asosiy ma'lumotlar</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tur nomi *</Label>
                  <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Yo'nalish *</Label>
                    <Select value={formData.destination_id} onValueChange={handleDestinationChange}>
                      <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                      <SelectContent>
                        {destinations.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name} - {d.country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tur turi</Label>
                    <Select value={formData.tour_type} onValueChange={v => setFormData({ ...formData, tour_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {tourTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Kunlar</Label>
                    <Input type="number" min={1} value={formData.duration_days} onChange={e => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tunlar</Label>
                    <Input type="number" min={0} value={formData.duration_nights} onChange={e => setFormData({ ...formData, duration_nights: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max kishilar</Label>
                    <Input type="number" min={1} value={formData.max_people} onChange={e => setFormData({ ...formData, max_people: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Narx (so'm) *</Label>
                    <Input type="number" value={formData.price || ""} onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Asl narx (chegirma uchun)</Label>
                    <Input type="number" value={formData.original_price || ""} onChange={e => setFormData({ ...formData, original_price: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Asosiy rasm</Label>
                  <div className="flex gap-2">
                    <Input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="URL yoki rasm yuklang" className="flex-1" />
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <Button type="button" variant="outline" size="icon" asChild disabled={uploading}>
                        <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                      </Button>
                    </label>
                  </div>
                  {formData.image && <img src={formData.image} alt="Preview" className="w-32 h-20 rounded-lg object-cover mt-2" />}
                </div>
                <div className="space-y-2">
                  <Label>Tavsif</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <span className="font-medium">Mashhur tur</span>
                    <Switch checked={formData.featured} onCheckedChange={checked => setFormData({ ...formData, featured: checked })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Holat</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Kutilmoqda</SelectItem>
                        <SelectItem value="approved">Tasdiqlangan</SelectItem>
                        <SelectItem value="rejected">Rad etilgan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="itinerary">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sayohat dasturi</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItineraryDay}>
                  <Plus className="h-4 w-4 mr-2" />Kun qo'shish
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-4">
                    {itinerary.map((day, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">{day.day}-kun</span>
                          <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeItineraryDay(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input placeholder="Kun sarlavhasi" value={day.title} onChange={e => updateItinerary(index, "title", e.target.value)} />
                        <Textarea placeholder="Kun tavsifi..." value={day.description} onChange={e => updateItinerary(index, "description", e.target.value)} rows={2} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inclusions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Xizmatlar va cheklovlar</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addInclusion}>
                  <Plus className="h-4 w-4 mr-2" />Qo'shish
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {inclusions.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Switch checked={item.included} onCheckedChange={v => updateInclusion(index, "included", v)} />
                        <Input value={item.item} onChange={e => updateInclusion(index, "item", e.target.value)} placeholder={item.included ? "Kiritilgan xizmat..." : "Kiritilmagan..."} className="flex-1" />
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeInclusion(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery">
            <Card>
              <CardHeader><CardTitle>Rasm galereyasi</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={newGalleryUrl} onChange={e => setNewGalleryUrl(e.target.value)} placeholder="Rasm URL..." className="flex-1" />
                  <Button type="button" variant="outline" onClick={() => { if (newGalleryUrl.trim()) { setFormData({ ...formData, gallery: [...formData.gallery, newGalleryUrl.trim()] }); setNewGalleryUrl(""); } }}>
                    <Plus className="h-4 w-4 mr-2" />URL
                  </Button>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                    <Button type="button" variant="outline" asChild disabled={uploading}>
                      <span><Upload className="h-4 w-4 mr-2" />{uploading ? "..." : "Yuklash"}</span>
                    </Button>
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.gallery.map((url, index) => (
                    <div key={index} className="relative group">
                      <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7" onClick={() => removeGalleryImage(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/tours")}>Bekor qilish</Button>
            <Button type="submit" disabled={updateTourMutation.isPending}>
              {updateTourMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Saqlash
            </Button>
          </div>
        </Tabs>
      </form>
    </div>
  );
};

export default AdminTourEdit;
