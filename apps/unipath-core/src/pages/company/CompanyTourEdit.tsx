import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Package, Upload, Image as ImageIcon, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";

const CompanyTourEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: companyData } = useMyCompany();
  const company = companyData?.company;
  const [uploading, setUploading] = useState(false);

  const { data: tour, isLoading } = useQuery({
    queryKey: ["company-tour", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("tours").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<any>({
    title: "", destination: "", country: "Uzbekistan", description: "",
    price: "", original_price: "", duration_days: "3", duration_nights: "2",
    max_people: "10", image: "", tour_type: "cultural",
  });

  useEffect(() => {
    if (tour) {
      setForm({
        title: tour.title ?? "",
        destination: tour.destination ?? "",
        country: tour.country ?? "Uzbekistan",
        description: tour.description ?? "",
        price: String(tour.price ?? ""),
        original_price: tour.original_price ? String(tour.original_price) : "",
        duration_days: String(tour.duration_days ?? 3),
        duration_nights: String(tour.duration_nights ?? 2),
        max_people: String(tour.max_people ?? 10),
        image: tour.image ?? "",
        tour_type: tour.tour_type ?? "cultural",
      });
    }
  }, [tour]);

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
      setForm((f: any) => ({ ...f, image: url.publicUrl }));
      toast.success("Rasm yuklandi");
    } catch (err: any) { toast.error(err.message); } finally { setUploading(false); }
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title, destination: form.destination, country: form.country,
        description: form.description || null, price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        duration_days: Number(form.duration_days), duration_nights: Number(form.duration_nights),
        max_people: Number(form.max_people), image: form.image || null, tour_type: form.tour_type,
        status: "pending", // resets to pending on edit
      };
      const { error } = await (supabase as any).from("tours").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saqlandi. Tasdiqlanish kutilmoqda.");
      qc.invalidateQueries({ queryKey: ["company-tours"] });
      navigate("/company/tours");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("tours").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tur o'chirildi");
      qc.invalidateQueries({ queryKey: ["company-tours"] });
      navigate("/company/tours");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!tour) return <div className="text-center py-20 text-muted-foreground">Tur topilmadi</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/company/tours")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
      </Button>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Turni tahrirlash
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={tour.status === "approved" ? "default" : "secondary"}>{tour.status}</Badge>
            <span className="text-xs text-muted-foreground">Saqlasangiz qaytadan tasdiqlanishi kerak</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asosiy ma'lumotlar</CardTitle>
          <CardDescription>O'zgartirgandan so'ng Super Admin tasdiqlashi kerak</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tur sarlavhasi *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Asosiy rasm</Label>
            {form.image ? (
              <div className="relative inline-block">
                <img src={form.image} alt="" className="h-40 rounded-lg object-cover border" />
                <button type="button" onClick={() => setForm({ ...form, image: "" })}
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center hover:scale-110 transition">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center h-40 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary hover:bg-primary/5 transition">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                <div className="text-center">
                  {uploading ? <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" /> : (
                    <><Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" /><p className="text-sm font-medium">Rasm yuklash</p></>
                  )}
                </div>
              </label>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Manzil *</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
            <div className="space-y-2"><Label>Mamlakat</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Narx ($) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="space-y-2"><Label>Eski narx ($)</Label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Kunlar</Label><Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tunlar</Label><Input type="number" value={form.duration_nights} onChange={(e) => setForm({ ...form, duration_nights: e.target.value })} /></div>
            <div className="space-y-2"><Label>Maks. odam</Label><Input type="number" value={form.max_people} onChange={(e) => setForm({ ...form, max_people: e.target.value })} /></div>
          </div>
          <div className="space-y-2">
            <Label>Tur turi</Label>
            <select value={form.tour_type} onChange={(e) => setForm({ ...form, tour_type: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="cultural">Madaniy</option>
              <option value="adventure">Sarguzasht</option>
              <option value="beach">Plyaj</option>
              <option value="religious">Diniy</option>
              <option value="ski">Tog'</option>
              <option value="city">Shahar</option>
              <option value="nature">Tabiat</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tavsif</Label>
            <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="flex gap-2 pt-2 flex-wrap">
            <Button onClick={() => save.mutate()} disabled={save.isPending} size="lg">
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Saqlash
            </Button>
            <Button variant="outline" onClick={() => navigate("/company/tours")}>Bekor qilish</Button>
            <Button variant="ghost" className="text-destructive ml-auto" onClick={() => { if (confirm("Tur butunlay o'chirilsinmi?")) del.mutate(); }}>
              <Trash2 className="h-4 w-4 mr-2" /> O'chirish
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CompanyTourEdit;
