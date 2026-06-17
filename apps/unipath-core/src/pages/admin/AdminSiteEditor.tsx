import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ExternalLink, ArrowLeft, Save, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ColorField = ({ label, value, onChange }: any) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="flex gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-14 rounded-lg border border-border cursor-pointer" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs rounded-xl" />
    </div>
  </div>
);

const ImageField = ({ label, value, onChange, companyId, hint }: any) => {
  const [up, setUp] = useState(false);
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("5MB dan kichik bo'lsin"); return; }
    setUp(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `companies/${companyId}/${label.toLowerCase()}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("tour-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("tour-images").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success(`${label} yuklandi`);
    } catch (e: any) { toast.error(e.message); }
    finally { setUp(false); }
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ImageIcon className="h-3 w-3" strokeWidth={1.75} /> {label}
      </Label>
      {value && <img src={value} className="h-20 w-full rounded-xl object-cover border border-border/60" alt="" />}
      <div className="flex gap-2">
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} className="text-xs rounded-xl" placeholder="URL" />
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={up} />
          <Button type="button" variant="outline" size="sm" className="rounded-xl" disabled={up} asChild>
            <span>{up ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />}</span>
          </Button>
        </label>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
};

const Section = ({ title, hint, children }: any) => (
  <Card className="p-5 rounded-2xl border-border/60 space-y-4">
    <div>
      <h3 className="font-medium text-sm">{title}</h3>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
    {children}
  </Card>
);

const AdminSiteEditor = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const qc = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ["admin-site-editor", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("tour_companies").select("*").eq("id", companyId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (company) setForm({
      name: company.name, tagline: company.tagline ?? "", description: company.description ?? "",
      logo_url: company.logo_url ?? "", banner_url: company.banner_url ?? "", favicon_url: company.favicon_url ?? "",
      primary_color: company.primary_color, secondary_color: company.secondary_color, accent_color: company.accent_color,
      font_family: company.font_family,
      seo_title: company.seo_title ?? "", seo_description: company.seo_description ?? "",
      about_html: company.about_html ?? "",
    });
  }, [company]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("tour_companies").update(form).eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saqlandi");
      qc.invalidateQueries({ queryKey: ["admin-site-editor", companyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !form) return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!company) return <p className="text-center text-sm text-muted-foreground py-16">Kompaniya topilmadi</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/admin/tour-companies">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" strokeWidth={1.75} /></Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight truncate">Sayt tahriri</h1>
            <p className="text-xs text-muted-foreground truncate">{company.name} · super admin</p>
          </div>
        </div>
        <a href={`/${company.slug}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="rounded-xl"><ExternalLink className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} /> Ochish</Button>
        </a>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl overflow-hidden border border-border/60"
        style={{ fontFamily: form.font_family }}
      >
        <div className="relative h-44 flex items-end p-5 text-white"
             style={{
               background: form.banner_url
                 ? `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55)), url(${form.banner_url}) center/cover`
                 : `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})`,
             }}>
          <div className="flex items-center gap-3">
            {form.logo_url ? (
              <img src={form.logo_url} className="h-12 w-12 rounded-xl object-cover bg-white/10 p-1" alt="" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-semibold">
                {form.name?.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{form.name}</h3>
              {form.tagline && <p className="text-sm opacity-90">{form.tagline}</p>}
            </div>
          </div>
        </div>
      </motion.div>

      <Section title="Identifikatsiya">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Nom</Label><Input className="rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Slogan</Label><Input className="rounded-xl" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs text-muted-foreground">Tavsif</Label><Textarea rows={3} className="rounded-xl" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </Section>

      <Section title="Rasmlar" hint="Logo, banner va favicon">
        <div className="grid md:grid-cols-3 gap-3">
          <ImageField companyId={companyId} label="Logo" value={form.logo_url} onChange={(v: string) => setForm({ ...form, logo_url: v })} hint="256×256" />
          <ImageField companyId={companyId} label="Banner" value={form.banner_url} onChange={(v: string) => setForm({ ...form, banner_url: v })} hint="1920×600" />
          <ImageField companyId={companyId} label="Favicon" value={form.favicon_url} onChange={(v: string) => setForm({ ...form, favicon_url: v })} hint="64×64" />
        </div>
      </Section>

      <Section title="Ranglar va shrift">
        <div className="grid md:grid-cols-3 gap-3">
          <ColorField label="Asosiy" value={form.primary_color} onChange={(v: string) => setForm({ ...form, primary_color: v })} />
          <ColorField label="Ikkilamchi" value={form.secondary_color} onChange={(v: string) => setForm({ ...form, secondary_color: v })} />
          <ColorField label="Aksent" value={form.accent_color} onChange={(v: string) => setForm({ ...form, accent_color: v })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Shrift</Label>
          <select value={form.font_family} onChange={(e) => setForm({ ...form, font_family: e.target.value })}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
            {["Plus Jakarta Sans", "Inter", "Poppins", "Manrope", "DM Sans", "Space Grotesk"].map((f) =>
              <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </Section>

      <Section title="SEO va mazmun">
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">SEO sarlavha</Label><Input className="rounded-xl" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">SEO tavsif</Label><Textarea rows={2} className="rounded-xl" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">"Biz haqimizda" (HTML)</Label><Textarea rows={6} className="rounded-xl font-mono text-xs" value={form.about_html} onChange={(e) => setForm({ ...form, about_html: e.target.value })} /></div>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" className="rounded-xl shadow-lg" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" strokeWidth={1.75} />}
          Saqlash
        </Button>
      </div>
    </div>
  );
};

export default AdminSiteEditor;
