import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Hotel, Bus, UtensilsCrossed, Users, Calendar, Calculator, Plus, X, Send } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

const excursionOptions = [
  "Muzey ziyorati", "Bozor sayohati", "Mahalliy taom degustatsiyasi",
  "Cho'l safarisi", "Sohil dam olishi", "Tog' yurishi",
  "Tarixiy joylar", "Oshxona master-klassi", "Hunarmandchilik ustaxonasi",
];

const CustomTourPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [destination, setDestination] = useState("");
  const [hotelLevel, setHotelLevel] = useState(3);
  const [transportType, setTransportType] = useState("bus");
  const [foodPlan, setFoodPlan] = useState("breakfast");
  const [selectedExcursions, setSelectedExcursions] = useState<string[]>([]);
  const [peopleCount, setPeopleCount] = useState(2);
  const [durationDays, setDurationDays] = useState(3);
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: destinations } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data } = await supabase.from("destinations").select("*").order("name");
      return data || [];
    },
  });

  const toggleExcursion = (exc: string) => {
    setSelectedExcursions((prev) =>
      prev.includes(exc) ? prev.filter((e) => e !== exc) : [...prev, exc]
    );
  };

  const estimatedPrice = useMemo(() => {
    let base = 500000; // base per person per day
    const hotelMultiplier = [0.6, 0.8, 1, 1.5, 2.2][hotelLevel - 1];
    const transportCost = transportType === "plane" ? 3000000 : transportType === "train" ? 1500000 : 800000;
    const foodCost = foodPlan === "full" ? 300000 : foodPlan === "half" ? 200000 : 100000;
    const excursionCost = selectedExcursions.length * 200000;

    return Math.round((base * hotelMultiplier * durationDays + transportCost + foodCost * durationDays + excursionCost) * peopleCount);
  }, [hotelLevel, transportType, foodPlan, selectedExcursions, peopleCount, durationDays]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Avval tizimga kiring");
      navigate("/auth");
      return;
    }
    if (!destination) {
      toast.error("Yo'nalishni tanlang");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("custom_tour_requests" as any).insert({
        user_id: user.id,
        destination_name: destination,
        hotel_level: hotelLevel,
        transport_type: transportType,
        food_plan: foodPlan,
        excursions: selectedExcursions,
        people_count: peopleCount,
        duration_days: durationDays,
        start_date: startDate || null,
        estimated_price: estimatedPrice,
        notes: notes || null,
      });

      if (error) throw error;
      toast.success("So'rov muvaffaqiyatli yuborildi!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">O'zingizga Tur Tuzing</h1>
          <p className="text-primary-foreground/80">Yo'nalish, mehmonxona, transport va ovqat tanlang — narxni real vaqtda ko'ring</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Builder Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Destination */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  1. Yo'nalish tanlang
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Qayerga sayohat qilmoqchisiz?" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations?.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}, {d.country}
                      </SelectItem>
                    ))}
                    <SelectItem value="Boshqa">Boshqa (izohda yozing)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Step 2: Hotel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hotel className="h-5 w-5 text-primary" />
                  2. Mehmonxona darajasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Slider
                    value={[hotelLevel]}
                    onValueChange={([v]) => setHotelLevel(v)}
                    min={1} max={5} step={1}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1 ⭐</span><span>2 ⭐</span><span>3 ⭐</span><span>4 ⭐</span><span>5 ⭐</span>
                  </div>
                  <p className="text-center font-semibold text-primary">{hotelLevel} yulduzli mehmonxona</p>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Transport */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bus className="h-5 w-5 text-primary" />
                  3. Transport turi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "bus", label: "Avtobus", icon: "🚌" },
                    { id: "train", label: "Poyezd", icon: "🚂" },
                    { id: "plane", label: "Samolyot", icon: "✈️" },
                  ].map((t) => (
                    <button key={t.id} onClick={() => setTransportType(t.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${transportType === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <span className="text-2xl block mb-1">{t.icon}</span>
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Food */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                  4. Ovqatlanish rejasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "breakfast", label: "Nonushta", icon: "🥐" },
                    { id: "half", label: "Yarim pension", icon: "🍽️" },
                    { id: "full", label: "To'liq pension", icon: "🍴" },
                  ].map((f) => (
                    <button key={f.id} onClick={() => setFoodPlan(f.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${foodPlan === f.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <span className="text-2xl block mb-1">{f.icon}</span>
                      <span className="text-sm font-medium">{f.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 5: Excursions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-primary" />
                  5. Qo'shimcha ekskursiyalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {excursionOptions.map((exc) => (
                    <Badge key={exc} variant={selectedExcursions.includes(exc) ? "default" : "outline"}
                      className="cursor-pointer text-sm py-2 px-3" onClick={() => toggleExcursion(exc)}>
                      {selectedExcursions.includes(exc) && <X className="h-3 w-3 mr-1" />}
                      {exc}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 6: Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  6. Tafsilotlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Kishilar soni</label>
                    <Input type="number" min={1} max={50} value={peopleCount}
                      onChange={(e) => setPeopleCount(parseInt(e.target.value) || 1)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Kunlar soni</label>
                    <Input type="number" min={1} max={30} value={durationDays}
                      onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Boshlanish sanasi</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Qo'shimcha izohlar</label>
                  <Textarea placeholder="Maxsus talablar, istaklar..." value={notes}
                    onChange={(e) => setNotes(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Summary - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="bg-primary text-primary-foreground rounded-t-2xl">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Narx kalkulyatsiyasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    {destination && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Yo'nalish</span>
                        <span className="font-medium">{destination}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mehmonxona</span>
                      <span className="font-medium">{hotelLevel} ⭐</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transport</span>
                      <span className="font-medium">{transportType === "bus" ? "Avtobus" : transportType === "train" ? "Poyezd" : "Samolyot"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ovqatlanish</span>
                      <span className="font-medium">{foodPlan === "breakfast" ? "Nonushta" : foodPlan === "half" ? "Yarim pension" : "To'liq pension"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Muddat</span>
                      <span className="font-medium">{durationDays} kun</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kishilar</span>
                      <span className="font-medium">{peopleCount} kishi</span>
                    </div>
                    {selectedExcursions.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ekskursiyalar</span>
                        <span className="font-medium">{selectedExcursions.length} ta</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Taxminiy narx</span>
                      <span className="text-2xl font-bold text-primary">{formatPrice(estimatedPrice)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      1 kishi uchun: {formatPrice(Math.round(estimatedPrice / peopleCount))}
                    </p>
                  </div>

                  <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading || !destination}>
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Yuborilmoqda..." : "So'rov yuborish"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Agent sizga 24 soat ichida javob beradi
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomTourPage;
