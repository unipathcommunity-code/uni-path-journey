import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Package, Upload, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";

const CompanyTourNew = () => {
  const navigate = useNavigate();
  const { data } = useMyCompany();
  const company = data?.company;
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    destination: "",
    country: "Uzbekistan",
    description: "",
    price: "",
    original_price: "",
    duration_days: "3",
    duration_nights: "2",
    max_people: "10",
    image: "",
    tour_type: "cultural",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Rasm 5MB dan oshmasligi kerak");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `companies/${company.id}/tours/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("tour-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: url } = supabase.storage.from("tour-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image: url.publicUrl }));
      toast.success("Rasm yuklandi");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!company) throw new Error("Kompaniya topilmadi");
      if (!form.title || !form.destination || !form.price) throw new Error("Sarlavha, manzil va narxni kiriting");
      const payload = {
        company_id: company.id,
        title: form.title,
        destination: form.destination,
        country: form.country,
        description: form.description || null,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        duration_days: Number(form.duration_days),
        duration_nights: Number(form.duration_nights),
        max_people: Number(form.max_people),
        image: form.image || null,
        tour_type: form.tour_type,
        status: "pending",
      };
      const { data, error } = await (supabase as any).from("tours").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Tur yaratildi! Tasdiqlanishi kutilmoqda.");
      navigate("/company/tours");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!company) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/company/tours")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
      </Button>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" /> Yangi tur yaratish
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Tur ma'lumotlarini kiriting. Super Admin tomonidan tasdiqlanadi.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asosiy ma'lumotlar</CardTitle>
          <CardDescription>Mijozlar bu ma'lumotlarni saytingizda ko'radi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tur sarlavhasi *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Masalan: 5 kunlik Samarqand sayohati" />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Asosiy rasm</Label>
            {form.image ? (
              <div className="relative inline-block">
                <img src={form.image} alt="" className="h-40 rounded-lg object-cover border" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: "" })}
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center hover:scale-110 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center h-40 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary hover:bg-primary/5 transition">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                <div className="text-center">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Rasm yuklash</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG · max 5MB</p>
                    </>
                  )}
                </div>
              </label>
            )}
            <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Yoki tashqi URL kiriting" className="text-xs" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Manzil *</Label>
              <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Samarqand" />
            </div>
            <div className="space-y-2">
              <Label>Mamlakat</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Narx ($) *</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="350" />
            </div>
            <div className="space-y-2">
              <Label>Eski narx ($) — chegirmani ko'rsatish uchun</Label>
              <Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder="450" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kunlar</Label>
              <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tunlar</Label>
              <Input type="number" value={form.duration_nights} onChange={(e) => setForm({ ...form, duration_nights: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Maks. odam soni</Label>
              <Input type="number" value={form.max_people} onChange={(e) => setForm({ ...form, max_people: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tur turi</Label>
            <select
              value={form.tour_type}
              onChange={(e) => setForm({ ...form, tour_type: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="cultural">Madaniy</option>
              <option value="adventure">Sarguzasht</option>
              <option value="beach">Plyaj / dam olish</option>
              <option value="religious">Diniy / Haj-Umra</option>
              <option value="ski">Tog' / chang'i</option>
              <option value="city">Shahar tur</option>
              <option value="nature">Tabiat / eko</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Tavsif</Label>
            <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tur haqida batafsil..." />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => create.mutate()} disabled={create.isPending} size="lg">
              {create.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Turni saqlash
            </Button>
            <Button variant="outline" onClick={() => navigate("/company/tours")}>Bekor qilish</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CompanyTourNew;
