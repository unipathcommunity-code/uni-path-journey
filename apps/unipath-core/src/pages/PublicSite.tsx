import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, Phone, Mail as MailIcon, MapPin, LogIn } from "lucide-react";
import { siteHomePath, siteLoginPath, sitePagePath } from "@/lib/siteRoutes";
import { NovaLogo } from "@/components/brand/NovaLogo";

interface Site {
  id: string;
  organization_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  theme: string;
  primary_color: string | null;
  accent_color: string | null;
  meta_description: string | null;
}

interface Content {
  hero?: { headline?: string; subheadline?: string; cta?: string };
  contact?: { phone?: string; email?: string; address?: string };
  features?: string[];
}

interface OrgBranding {
  logo_url: string | null;
  name: string;
}

const THEMES: Record<string, { bg: string; accent: string }> = {
  aurora:   { bg: "from-primary/15 via-background to-accent/10", accent: "from-primary to-accent" },
  midnight: { bg: "from-background via-background to-primary/15", accent: "from-foreground to-primary" },
  sunrise:  { bg: "from-warning/15 via-background to-accent/10", accent: "from-warning to-accent" },
};

/**
 * PublicSite — the marketing landing for ONE education-center.
 * Reads only published websites + their content blocks.
 *
 * Login is intentionally NOT a modal here: the "Kirish" buttons send the
   * visitor to a fully-branded /c/<slug>/login page so the experience
 * mirrors what students/parents already expect from systems like LC-UP.
 *
 * Org colors are applied as scoped CSS variables on the document root so
 * the rest of the page (gradients, buttons) automatically picks up the
 * tenant's brand without per-component overrides.
 */
const PublicSite = () => {
  const { slug } = useParams();
  const [site, setSite] = useState<Site | null>(null);
  const [content, setContent] = useState<Content>({});
  const [brand, setBrand] = useState<OrgBranding | null>(null);
  const [navPages, setNavPages] = useState<{ page_id: string; page_slug: string; page_title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: s } = await supabase
        .from("websites")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!s) { setNotFound(true); setLoading(false); return; }
      setSite(s as any);

      // Logo + name come from a security-definer RPC (anon-safe, published-only)
      const { data: branding } = await supabase.rpc("site_branding_by_slug", { _slug: slug });
      if (branding && (Array.isArray(branding) ? branding.length : true)) {
        const row: any = Array.isArray(branding) ? branding[0] : branding;
        setBrand({ logo_url: row.org_logo_url, name: row.org_name });
      }

      const { data: blocks } = await supabase
        .from("website_blocks")
        .select("*")
        .eq("website_id", (s as any).id)
        .eq("is_visible", true)
        .order("position");

      const contentBlock = (blocks || []).find((b: any) => b.block_type === "content");
      if (contentBlock?.payload) setContent(contentBlock.payload as Content);

      // Secondary pages for top nav (anon-safe RPC, only show_in_nav=true)
      const { data: pageList } = await supabase.rpc("site_pages_by_slug", { _slug: slug });
      if (Array.isArray(pageList)) {
        setNavPages(
          pageList
            .filter((p: any) => p.show_in_nav)
            .map((p: any) => ({ page_id: p.page_id, page_slug: p.page_slug, page_title: p.page_title }))
        );
      }

      // SEO
      document.title = (s as any).title;
      if ((s as any).meta_description) {
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("name", "description");
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", (s as any).meta_description);
      }
      setLoading(false);
    })();
  }, [slug]);

  // Apply tenant brand colors as scoped CSS vars (auto-restore on unmount)
  useEffect(() => {
    if (!site) return;
    const root = document.documentElement;
    const prevP = root.style.getPropertyValue("--primary");
    const prevA = root.style.getPropertyValue("--accent");
    if (site.primary_color) root.style.setProperty("--primary", site.primary_color);
    if (site.accent_color) root.style.setProperty("--accent", site.accent_color);
    return () => {
      if (prevP) root.style.setProperty("--primary", prevP); else root.style.removeProperty("--primary");
      if (prevA) root.style.setProperty("--accent", prevA); else root.style.removeProperty("--accent");
    };
  }, [site]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
  if (notFound || !site) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-3xl font-heading font-bold mb-2">Sahifa topilmadi</h1>
        <p className="text-muted-foreground mb-4">Bu sayt mavjud emas yoki nashr qilinmagan.</p>
        <Link to="/" className="text-primary underline">Bosh sahifa</Link>
      </div>
    </div>
  );

  const theme = THEMES[site.theme] || THEMES.aurora;
  const hero = content.hero || {};
  const contact = content.contact || {};
  const features = content.features || [];
  const loginPath = siteLoginPath(site.slug);
  const displayName = brand?.name || site.title;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${theme.bg}`}>
      {/* Sticky nav with branded logo + login CTA */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/60 border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2 flex-wrap">
          <Link to={siteHomePath(site.slug)} className="flex items-center gap-2.5 min-w-0">
            {brand?.logo_url ? (
              <img
                src={brand.logo_url}
                alt={`${displayName} logosi`}
                loading="eager"
                className="w-9 h-9 rounded-lg object-contain bg-white/80 p-1 shadow-sm flex-shrink-0"
              />
            ) : (
              <NovaLogo size="md" showWordmark={false} />
            )}
            <div className="font-heading font-bold text-base sm:text-lg truncate">{displayName}</div>
          </Link>

          {navPages.length > 0 && (
            <nav className="flex items-center gap-1 order-3 w-full sm:w-auto sm:order-2 overflow-x-auto -mx-1 px-1">
              <span className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/15 text-primary whitespace-nowrap">
                Bosh sahifa
              </span>
              {navPages.map((p) => (
                <Link
                  key={p.page_id}
                  to={sitePagePath(site.slug, p.page_slug)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition whitespace-nowrap"
                >
                  {p.page_title}
                </Link>
              ))}
            </nav>
          )}

          <Link
            to={loginPath}
            className="px-3 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 hover:opacity-90 transition active:scale-95 text-primary-foreground shadow-md order-2 sm:order-3"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
          >
            <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Kirish
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 sm:py-28 text-center max-w-4xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`text-4xl sm:text-6xl md:text-7xl font-heading font-bold mb-5 bg-clip-text text-transparent bg-gradient-to-r ${theme.accent}`}>
          {hero.headline || displayName}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-base sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {hero.subheadline || site.tagline}
        </motion.p>
        <Link to={loginPath}>
          <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="px-8 py-3.5 rounded-full font-semibold inline-flex items-center gap-2 shadow-xl text-primary-foreground hover:scale-105 transition-transform"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
              boxShadow: "0 12px 32px -8px hsl(var(--primary) / 0.45)",
            }}
          >
            {hero.cta || "Ro'yxatdan o'tish"} <ArrowRight className="w-4 h-4" />
          </motion.span>
        </Link>
      </section>

      {/* Features */}
      {features.length > 0 && (
        <section className="px-6 py-12 sm:py-20 max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center mb-10">Bizning xizmatlar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="glass-strong p-6 rounded-2xl text-center hover:scale-105 transition-transform">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${theme.accent} flex items-center justify-center text-primary-foreground font-bold`}>
                  {i + 1}
                </div>
                <h3 className="font-heading font-bold text-base">{f}</h3>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      {(contact.phone || contact.email || contact.address) && (
        <section className="px-6 py-12 sm:py-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-8">Bog'lanish</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="glass p-5 rounded-2xl text-center hover:bg-muted/30 transition">
                <Phone className="w-5 h-5 mx-auto mb-2 text-primary" />
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Telefon</div>
                <div className="font-semibold text-sm mt-1 break-all">{contact.phone}</div>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="glass p-5 rounded-2xl text-center hover:bg-muted/30 transition">
                <MailIcon className="w-5 h-5 mx-auto mb-2 text-primary" />
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</div>
                <div className="font-semibold text-sm mt-1 break-all">{contact.email}</div>
              </a>
            )}
            {contact.address && (
              <div className="glass p-5 rounded-2xl text-center">
                <MapPin className="w-5 h-5 mx-auto mb-2 text-primary" />
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Manzil</div>
                <div className="font-semibold text-sm mt-1">{contact.address}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tenant-clean footer (no platform branding) */}
      <footer className="text-center text-xs text-muted-foreground py-8 border-t border-border/30 mt-12">
        © {new Date().getFullYear()} {displayName}
      </footer>
    </div>
  );
};

export default PublicSite;
