import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const OperatorTourNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    destination: "",
    country: "O'zbekiston",
    duration_days: 3,
    duration_nights: 2,
    price: 0,
    original_price: 0,
    max_people: 20,
    tour_type: "group",
    image: "",
    gallery: [] as string[],
  });

  const [itinerary, setItinerary] = useState([
    { day: 1, title: "", description: "", activities: [] as string[] },
  ]);

  const [inclusions, setInclusions] = useState([
    { item: "", included: true },
  ]);

  const { data: destinations = [] } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data } = await supabase.from("destinations").select("*");
      return data || [];
    },
  });

  const createTourMutation = useMutation({
    mutationFn: async () => {
      // Create tour
      const { data: tour, error: tourError } = await supabase
        .from("tours")
        .insert({
          title: formData.title,
          description: formData.description,
          destination: formData.destination,
          country: formData.country,
          duration_days: formData.duration_days,
          duration_nights: formData.duration_nights,
          price: formData.price,
          original_price: formData.original_price || null,
          max_people: formData.max_people,
          tour_type: formData.tour_type,
          image: formData.image || null,
          gallery: formData.gallery.filter((g) => g),
          operator_id: user?.id,
          status: "pending",
        })
        .select()
        .single();

      if (tourError) throw tourError;

      // Create itinerary
      const itineraryData = itinerary
        .filter((i) => i.title)
        .map((i) => ({
          tour_id: tour.id,
          day: i.day,
          title: i.title,
          description: i.description,
          activities: i.activities.filter((a) => a),
        }));

      if (itineraryData.length > 0) {
        const { error: itinError } = await supabase
          .from("tour_itineraries")
          .insert(itineraryData);
        if (itinError) throw itinError;
      }

      // Create inclusions
      const inclusionData = inclusions
        .filter((i) => i.item)
        .map((i) => ({
          tour_id: tour.id,
          item: i.item,
          included: i.included,
        }));

      if (inclusionData.length > 0) {
        const { error: inclError } = await supabase
          .from("tour_inclusions")
          .insert(inclusionData);
        if (inclError) throw inclError;
      }

      return tour;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator-tours"] });
      toast.success("Tur muvaffaqiyatli yaratildi! Admin tasdiqlashi kutilmoqda.");
      navigate("/operator/tours");
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const addItineraryDay = () => {
    setItinerary([
      ...itinerary,
      { day: itinerary.length + 1, title: "", description: "", activities: [] },
    ]);
  };

  const removeItineraryDay = (index: number) => {
    const updated = itinerary.filter((_, i) => i !== index);
    setItinerary(updated.map((item, i) => ({ ...item, day: i + 1 })));
  };

  const updateItinerary = (index: number, field: string, value: any) => {
    const updated = [...itinerary];
    updated[index] = { ...updated[index], [field]: value };
    setItinerary(updated);
  };

  const addInclusion = () => {
    setInclusions([...inclusions, { item: "", included: true }]);
  };

  const removeInclusion = (index: number) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const updateInclusion = (index: number, field: string, value: any) => {
    const updated = [...inclusions];
    updated[index] = { ...updated[index], [field]: value };
    setInclusions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.destination || !formData.price) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }
    createTourMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Yangi tur qo'shish</h1>
          <p className="text-muted-foreground">
            Tur yaratib, admin tasdiqini kuting
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="basic">Asosiy</TabsTrigger>
            <TabsTrigger value="itinerary">Dastur</TabsTrigger>
            <TabsTrigger value="inclusions">Xizmatlar</TabsTrigger>
            <TabsTrigger value="gallery">Rasmlar</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Asosiy ma'lumotlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tur nomi *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Masalan: Samarqand Sayohati"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination">Manzil *</Label>
                    <Select
                      value={formData.destination}
                      onValueChange={(value) =>
                        setFormData({ ...formData, destination: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Manzilni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinations.map((dest: any) => (
                          <SelectItem key={dest.id} value={dest.name}>
                            {dest.name}, {dest.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Mamlakat</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tour_type">Tur turi</Label>
                    <Select
                      value={formData.tour_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tour_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group">Guruh</SelectItem>
                        <SelectItem value="family">Oilaviy</SelectItem>
                        <SelectItem value="luxury">Hashamatli</SelectItem>
                        <SelectItem value="budget">Arzon</SelectItem>
                        <SelectItem value="adventure">Sarguzasht</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration_days">Kunlar</Label>
                    <Input
                      id="duration_days"
                      type="number"
                      min={1}
                      value={formData.duration_days}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_days: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration_nights">Tunlar</Label>
                    <Input
                      id="duration_nights"
                      type="number"
                      min={0}
                      value={formData.duration_nights}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_nights: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Narx (so'm) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="original_price">Asl narx (chegirma uchun)</Label>
                    <Input
                      id="original_price"
                      type="number"
                      min={0}
                      value={formData.original_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          original_price: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_people">Maksimal kishilar</Label>
                    <Input
                      id="max_people"
                      type="number"
                      min={1}
                      value={formData.max_people}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_people: parseInt(e.target.value) || 20,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Asosiy rasm URL</Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Tavsif</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tur haqida batafsil ma'lumot..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Itinerary Tab */}
          <TabsContent value="itinerary">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Kunlik dastur</CardTitle>
                <Button type="button" variant="outline" onClick={addItineraryDay}>
                  <Plus className="h-4 w-4 mr-2" />
                  Kun qo'shish
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {itinerary.map((day, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">
                        {day.day}-kun
                      </span>
                      {itinerary.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItineraryDay(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sarlavha</Label>
                        <Input
                          value={day.title}
                          onChange={(e) =>
                            updateItinerary(index, "title", e.target.value)
                          }
                          placeholder="Masalan: Kelish va joylashish"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tavsif</Label>
                        <Input
                          value={day.description}
                          onChange={(e) =>
                            updateItinerary(index, "description", e.target.value)
                          }
                          placeholder="Kun faoliyatlari..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inclusions Tab */}
          <TabsContent value="inclusions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Xizmatlar</CardTitle>
                <Button type="button" variant="outline" onClick={addInclusion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Xizmat qo'shish
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {inclusions.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.included}
                        onCheckedChange={(checked) =>
                          updateInclusion(index, "included", checked)
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.included ? "Kiritilgan" : "Kiritilmagan"}
                      </span>
                    </div>
                    <Input
                      className="flex-1"
                      value={item.item}
                      onChange={(e) =>
                        updateInclusion(index, "item", e.target.value)
                      }
                      placeholder="Masalan: Mehmonxonada yashash"
                    />
                    {inclusions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInclusion(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle>Galereya</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rasm URL lari (har bir qatorda bitta)</Label>
                  <Textarea
                    rows={5}
                    value={formData.gallery.join("\n")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gallery: e.target.value.split("\n"),
                      })
                    }
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Bekor qilish
          </Button>
          <Button
            type="submit"
            disabled={createTourMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {createTourMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OperatorTourNew;
