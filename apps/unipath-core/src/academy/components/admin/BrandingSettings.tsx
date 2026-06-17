import { motion } from "framer-motion";
import { Building2, Loader2, Upload, Palette, Save } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

const PRESETS = [
  { name: "NOVA Purple", primary: "262 83% 58%", accent: "180 70% 50%" },
  { name: "Ocean", primary: "210 90% 55%", accent: "190 85% 50%" },
  { name: "Forest", primary: "150 60% 45%", accent: "120 50% 50%" },
  { name: "Sunset", primary: "20 90% 55%", accent: "340 80% 60%" },
  { name: "Royal", primary: "230 70% 50%", accent: "280 75% 60%" },
  { name: "Crimson", primary: "0 75% 55%", accent: "30 85% 55%" },
];

const BrandingSettings = () => {
  const { org, refresh } = useOrganization();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("");
  const [accent, setAccent] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setPrimary(org.primary_color);
      setAccent(org.accent_color);
      setLogoUrl(org.logo_url);
    }
  }, [org]);

  const applyLive = (p: string, a: string) => {
    document.documentElement.style.setProperty("--primary", p);
    document.documentElement.style.setProperty("--accent", a);
  };

  const handleUpload = async (file: File) => {
    if (!org) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${org.id}/logo_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("org-logos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
      toast.success(t("admin.logo_uploaded") || "Logo uploaded");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!org) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name, primary_color: primary, accent_color: accent, logo_url: logoUrl })
        .eq("id", org.id);
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("nova:org-updated"));
      await refresh();
      toast.success(t("admin.branding_saved") || "Branding saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Building2 className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold font-heading">{t("admin.branding") || "Organization Branding"}</h3>
          <p className="text-[10px] text-muted-foreground">{t("admin.branding_desc") || "Customize your institution's identity"}</p>
        </div>
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <label className="text-[11px] font-medium text-muted-foreground">{t("admin.logo") || "Logo"}</label>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex-1 px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted/60 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? t("common.uploading") || "Uploading..." : t("admin.upload_logo") || "Upload logo"}
          </button>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("admin.org_name") || "Organization name"}</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full bg-muted/40 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
      </div>

      {/* Color presets */}
      <div className="space-y-2">
        <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          <Palette className="w-3 h-3" /> {t("admin.color_preset") || "Color preset"}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button key={p.name}
              onClick={() => { setPrimary(p.primary); setAccent(p.accent); applyLive(p.primary, p.accent); }}
              className={`p-2 rounded-xl border text-left transition-all ${
                primary === p.primary ? "border-primary ring-1 ring-primary/30" : "border-border/30 hover:border-border/60"
              }`}>
              <div className="flex gap-1 mb-1">
                <div className="w-4 h-4 rounded-full" style={{ background: `hsl(${p.primary})` }} />
                <div className="w-4 h-4 rounded-full" style={{ background: `hsl(${p.accent})` }} />
              </div>
              <span className="text-[10px] font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom HSL */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground">Primary HSL</label>
          <input value={primary} onChange={(e) => { setPrimary(e.target.value); applyLive(e.target.value, accent); }}
            placeholder="262 83% 58%"
            className="w-full bg-muted/40 text-xs rounded-lg px-2 py-1.5 outline-none border border-border/30" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Accent HSL</label>
          <input value={accent} onChange={(e) => { setAccent(e.target.value); applyLive(primary, e.target.value); }}
            placeholder="180 70% 50%"
            className="w-full bg-muted/40 text-xs rounded-lg px-2 py-1.5 outline-none border border-border/30" />
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? t("common.saving") || "Saving..." : t("admin.save_branding") || "Save branding"}
      </button>
    </motion.div>
  );
};

export default BrandingSettings;
