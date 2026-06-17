import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Eye, EyeOff, Save, ExternalLink, Loader2, Palette, Phone, Mail as MailIcon, MapPin, Trash2, Building2, ChevronDown, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import ThemeLangSwitcher from "@/components/ThemeLangSwitcher";
import FeatureGate from "@/components/FeatureGate";
import PagesManager from "@/components/website-builder/PagesManager";
import { siteHomePath, siteHomeUrl } from "@/lib/siteRoutes";

interface Site {
  id: string;
  organization_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  theme: string;
  is_published: boolean;
  meta_description: string | null;
}

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  org_type: string;
}

/**
 * WEBSITE BUILDER (v3 — multi-tenant)
 * - Admin/Owner: edits ONLY their own organization's site (single site per org).
 * - SuperAdmin: can pick ANY organization from a searchable list and manage that
 *   org's site independently. Each education center gets its own dedicated page
 *   at inkluone.info/c/<slug>.
 */
const WebsiteBuilder = () => {
  const { hasRole } = useAuth();
  const { org: organization } = useOrganization();

  const isSuperAdmin = hasRole("superadmin");
  const allowed = isSuperAdmin || hasRole("owner") || hasRole("admin");

  // Org selection (SuperAdmin only)
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hero, setHero] = useState({ headline: "", subheadline: "", cta: "Ro'yxatdan o'tish" });
  const [contact, setContact] = useState({ phone: "", email: "", address: "" });
  const [features, setFeatures] = useState<string[]>(["Sifatli darslar", "Tajribali ustozlar", "Zamonaviy uslublar"]);

  // Default selected org = own org (admin/owner) or first org (superadmin until they pick)
  useEffect(() => {
    if (!isSuperAdmin && organization?.id) {
      setSelectedOrgId(organization.id);
    }
  }, [isSuperAdmin, organization?.id]);

  // Load org list for SuperAdmin
  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("organizations")
        .select("id, name, slug, org_type")
        .order("name");
      const list = (data as OrgRow[]) || [];
      setOrgs(list);
      // Default to first org if none chosen
      setSelectedOrgId((cur) => cur || list[0]?.id || null);
    })();
  }, [isSuperAdmin]);

  const activeOrg = isSuperAdmin
    ? orgs.find((o) => o.id === selectedOrgId) || null
    : organization
      ? { id: organization.id, name: organization.name, slug: organization.slug, org_type: "center" }
      : null;

  const load = async () => {
    if (!selectedOrgId || !activeOrg) return;
    setLoading(true);

    // Fresh fetch — site state is fully scoped to selectedOrgId
    setSite(null);
    setHero({ headline: "", subheadline: "", cta: "Ro'yxatdan o'tish" });
    setContact({ phone: "", email: "", address: "" });
    setFeatures(["Sifatli darslar", "Tajribali ustozlar", "Zamonaviy uslublar"]);

    const { data: existing } = await (supabase as any)
      .from("websites")
      .select("*")
      .eq("organization_id", selectedOrgId)
      .maybeSingle();

    let s = existing;
    if (!s) {
      const baseSlug = (activeOrg.slug || `site-${selectedOrgId.slice(0, 8)}`)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");
      const { data: created, error } = await (supabase as any)
        .from("websites")
        .insert({ organization_id: selectedOrgId, slug: baseSlug, title: activeOrg.name || "My Center" })
        .select("*")
        .single();
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      s = created;
    }
    setSite(s as any);

    const { data: blocks } = await (supabase as any)
      .from("website_blocks")
      .select("*")
      .eq("website_id", (s as any).id)
      .order("position");

    const contentBlock = (blocks || []).find((b: any) => b.block_type === "content");
    if (contentBlock?.payload) {
      const p = contentBlock.payload as any;
      if (p.hero) setHero((h) => ({ ...h, ...p.hero }));
      if (p.contact) setContact((c) => ({ ...c, ...p.contact }));
      if (Array.isArray(p.features)) setFeatures(p.features);
    } else {
      setHero({
        headline: activeOrg.name || "Eng yaxshi ta'lim",
        subheadline: "Kelajagingizni biz bilan quring — zamonaviy ta'lim markazi",
        cta: "Ro'yxatdan o'tish",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (allowed && selectedOrgId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, selectedOrgId]);

  /**
   * Hard guard: every write must target the org the SuperAdmin (or owner/admin)
   * currently has selected. Prevents any chance of a stale `site` from a
   * previous selection bleeding into another organization's record.
   */
  const assertScope = (): boolean => {
    if (!site || !selectedOrgId) return false;
    if (site.organization_id !== selectedOrgId) {
      toast.error("Sayt ma'lumoti tanlangan markazga mos emas — qayta yuklang");
      return false;
    }
    return true;
  };

  const saveAll = async () => {
    if (!assertScope() || !site) return;
    setSaving(true);
    try {
      // Scope EVERY mutation by both id AND organization_id (defense in depth)
      const { error: e1 } = await (supabase as any)
        .from("websites")
        .update({
          title: site.title,
          tagline: site.tagline,
          theme: site.theme,
          meta_description: site.meta_description,
        })
        .eq("id", site.id)
        .eq("organization_id", selectedOrgId!);
      if (e1) throw e1;

      const payload = { hero, contact, features };
      const { data: existingBlock } = await (supabase as any)
        .from("website_blocks")
        .select("id, website_id")
        .eq("website_id", site.id)
        .eq("block_type", "content")
        .maybeSingle();

      if (existingBlock?.id) {
        const { error: e2 } = await (supabase as any)
          .from("website_blocks")
          .update({ payload })
          .eq("id", existingBlock.id)
          .eq("website_id", site.id);
        if (e2) throw e2;
      } else {
        const { error: e3 } = await (supabase as any).from("website_blocks").insert({
          website_id: site.id,
          block_type: "content",
          payload,
          position: 0,
        });
        if (e3) throw e3;
      }
      toast.success("Saqlandi ✓");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!assertScope() || !site) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("websites")
      .update({ is_published: !site.is_published })
      .eq("id", site.id)
      .eq("organization_id", selectedOrgId!);
    if (error) toast.error(error.message);
    else {
      toast.success(site.is_published ? "Saytdan olindi" : "Sayt nashr qilindi ✓");
      load();
    }
    setSaving(false);
  };

  const updateFeature = (i: number, v: string) => {
    const next = [...features];
    next[i] = v;
    setFeatures(next);
  };
  const addFeature = () => features.length < 6 && setFeatures([...features, "Yangi xizmat"]);
  const removeFeature = (i: number) => setFeatures(features.filter((_, idx) => idx !== i));

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-strong p-8 text-center">
          <Globe className="w-12 h-12 mx-auto text-destructive mb-3" />
          <h2 className="font-heading font-bold">Faqat admin / owner / superadmin</h2>
        </div>
      </div>
    );
  }

  const filteredOrgs = orgs.filter((o) =>
    o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
    o.slug.toLowerCase().includes(orgSearch.toLowerCase())
  );

  return (
    <FeatureGate feature="website_builder">
      <div className="min-h-screen bg-background nova-grid-bg pb-20">
        <header className="sticky top-0 z-30 glass-strong border-b border-border/50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <BackButton />
              <div className="min-w-0">
                <h1 className="font-heading font-bold text-lg flex items-center gap-2 truncate">
                  <Globe className="w-5 h-5 text-primary flex-shrink-0" /> Veb-sayt
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  {isSuperAdmin
                    ? "Har bir o'quv markaz uchun alohida sayt"
                    : "Markazingiz sahifasi — bir necha soniyada"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {site && (
                <a
                  href={siteHomeUrl(site.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 inline-flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3 h-3" /> Ko'rish
                </a>
              )}
              <ThemeLangSwitcher />
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {/* SuperAdmin: organization picker */}
          {isSuperAdmin && (
            <div className="glass-strong rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
                      O'QUV MARKAZ
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {activeOrg?.name || "Markaz tanlang"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOrgPickerOpen((v) => !v)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition flex items-center gap-1 flex-shrink-0"
                >
                  Almashtirish <ChevronDown className={`w-3 h-3 transition-transform ${orgPickerOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              {orgPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2 pt-2 border-t border-border/60"
                >
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      autoFocus
                      value={orgSearch}
                      onChange={(e) => setOrgSearch(e.target.value)}
                      placeholder="Markaz nomi yoki slug..."
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/40 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredOrgs.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Markaz topilmadi</p>
                    ) : (
                      filteredOrgs.map((o) => {
                        const isActive = o.id === selectedOrgId;
                        return (
                          <button
                            key={o.id}
                            onClick={() => {
                              setSelectedOrgId(o.id);
                              setOrgPickerOpen(false);
                              setOrgSearch("");
                            }}
                            className={`w-full text-left p-2.5 rounded-lg transition flex items-center justify-between gap-2 ${
                              isActive ? "bg-primary/15 border border-primary/40" : "hover:bg-muted/40"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{o.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">inkluone.info/c/{o.slug}</p>
                            </div>
                            <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground flex-shrink-0">
                              {o.org_type.toUpperCase()}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : !site ? (
            <div className="text-center py-12 text-muted-foreground">
              {isSuperAdmin && !selectedOrgId ? "Markaz tanlang" : "Sayt yaratib bo'lmadi"}
            </div>
          ) : (
            <>
              {/* Publish state banner */}
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-strong rounded-2xl p-4 flex items-center justify-between gap-3 ${
                  site.is_published ? "border border-success/40" : "border border-warning/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {site.is_published ? (
                    <Eye className="w-5 h-5 text-success flex-shrink-0" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-warning flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">
                      {site.is_published ? "Sayt nashr qilingan" : "Sayt hali yashirin"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {siteHomeUrl(site.slug)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={togglePublish}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition ${
                    site.is_published
                      ? "bg-warning/15 text-warning hover:bg-warning/25"
                      : "bg-success/15 text-success hover:bg-success/25"
                  } disabled:opacity-50`}
                >
                  {site.is_published ? "Yashirish" : "Nashr qilish"}
                </button>
              </motion.div>

              {/* Theme selector */}
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" /> Shablon
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "aurora", name: "Aurora", grad: "from-primary/40 to-accent/40" },
                    { id: "midnight", name: "Midnight", grad: "from-foreground/30 to-primary/30" },
                    { id: "sunrise", name: "Sunrise", grad: "from-warning/40 to-accent/40" },
                  ].map((th) => (
                    <button
                      key={th.id}
                      onClick={() => setSite({ ...site, theme: th.id })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        site.theme === th.id ? "border-primary ring-2 ring-primary/30" : "border-border/30 hover:border-border"
                      }`}
                    >
                      <div className={`h-12 rounded-lg bg-gradient-to-br ${th.grad} mb-1.5`} />
                      <div className="text-xs font-semibold">{th.name}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Hero content */}
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-3">
                <h3 className="font-heading font-bold text-sm">Asosiy sarlavha</h3>
                <Field label="Sayt nomi" value={site.title} onChange={(v) => setSite({ ...site, title: v })} />
                <Field label="Katta sarlavha (hero)" value={hero.headline} onChange={(v) => setHero({ ...hero, headline: v })} />
                <Field label="Qisqa tavsif" value={hero.subheadline} onChange={(v) => setHero({ ...hero, subheadline: v })} multi />
                <Field label="Tugma matni" value={hero.cta} onChange={(v) => setHero({ ...hero, cta: v })} />
                <Field label="SEO tavsif (Google uchun)" value={site.meta_description || ""} onChange={(v) => setSite({ ...site, meta_description: v })} multi />
              </motion.div>

              {/* Features */}
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm">Xizmatlaringiz ({features.length})</h3>
                  {features.length < 6 && (
                    <button
                      onClick={addFeature}
                      className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition"
                    >
                      + Qo'shish
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={f}
                        onChange={(e) => updateFeature(i, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-muted/40 border border-border/30 text-sm"
                      />
                      <button
                        onClick={() => removeFeature(i)}
                        className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Multi-page manager */}
              <PagesManager websiteId={site.id} siteSlug={site.slug} />

              {/* Contact */}
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-3">
                <h3 className="font-heading font-bold text-sm">Aloqa ma'lumotlari</h3>
                <Field icon={Phone} label="Telefon" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
                <Field icon={MailIcon} label="Email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} />
                <Field icon={MapPin} label="Manzil" value={contact.address} onChange={(v) => setContact({ ...contact, address: v })} />
              </motion.div>

              {/* Sticky save bar */}
              <div className="sticky bottom-4 z-20">
                <motion.button
                  onClick={saveAll}
                  disabled={saving}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? "Saqlanmoqda..." : "Barcha o'zgarishlarni saqlash"}
                </motion.button>
              </div>
            </>
          )}
        </main>
      </div>
    </FeatureGate>
  );
};

const Field = ({
  label,
  value,
  onChange,
  multi = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
  icon?: any;
}) => (
  <div>
    <label className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3" />} {label}
    </label>
    {multi ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
      />
    )}
  </div>
);

export default WebsiteBuilder;
