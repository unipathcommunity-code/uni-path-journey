import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, LogIn, CheckCircle2, Clock, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { siteHomePath, siteLoginPath, sitePagePath } from "@/lib/siteRoutes";
import { Logo } from "@/components/Logo";

interface SiteHeader {
  id: string;
  slug: string;
  title: string;
  theme: string;
  primary_color: string | null;
  accent_color: string | null;
}
interface Branding { logo_url: string | null; name: string }
interface NavPage { page_id: string; page_slug: string; page_title: string; show_in_nav: boolean }
interface PageData {
  page_id: string;
  page_slug: string;
  page_title: string;
  page_type: "home" | "content" | "tech" | "study" | "custom";
  payload: any;
}

const THEMES: Record<string, { bg: string; accent: string }> = {
  aurora:   { bg: "from-primary/15 via-background to-accent/10", accent: "from-primary to-accent" },
  midnight: { bg: "from-background via-background to-primary/15", accent: "from-foreground to-primary" },
  sunrise:  { bg: "from-warning/15 via-background to-accent/10", accent: "from-warning to-accent" },
};

/**
 * PublicPage — secondary pages of an org's published site.
 * URL: /c/<orgSlug>/<pageSlug>
 *
 * Renders payload differently depending on page_type. Branding & theme are
 * inherited from the parent site so all pages feel like one product.
 */
const PublicPage = () => {
  const { slug, pageSlug } = useParams();
  const [site, setSite] = useState<SiteHeader | null>(null);
  const [brand, setBrand] = useState<Branding | null>(null);
  const [pages, setPages] = useState<NavPage[]>([]);
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug || !pageSlug) return;
    (async () => {
      setLoading(true);
      setNotFound(false);

      const { data: s } = await supabase
        .from("websites")
        .select("id, slug, title, theme, primary_color, accent_color")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!s) { setNotFound(true); setLoading(false); return; }
      setSite(s as any);

      const { data: branding } = await supabase.rpc("site_branding_by_slug", { _slug: slug });
      if (branding) {
        const row: any = Array.isArray(branding) ? branding[0] : branding;
        if (row) setBrand({ logo_url: row.org_logo_url, name: row.org_name });
      }

      const [{ data: navData }, { data: pageData }] = await Promise.all([
        supabase.rpc("site_pages_by_slug", { _slug: slug }),
        supabase.rpc("site_page_by_slug", { _slug: slug, _page_slug: pageSlug }),
      ]);

      setPages(((navData as any) || []).filter((p: NavPage) => p.show_in_nav));
      const pageRow = Array.isArray(pageData) ? pageData[0] : pageData;
      if (!pageRow) { setNotFound(true); setLoading(false); return; }
      setPage(pageRow as any);

      // SEO
      document.title = `${pageRow.page_title} — ${(s as any).title}`;
      setLoading(false);
    })();
  }, [slug, pageSlug]);

  // Apply tenant brand colors as scoped CSS vars
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
  if (notFound || !site || !page) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-3xl font-heading font-bold mb-2">Sahifa topilmadi</h1>
        <p className="text-muted-foreground mb-4">Bu sahifa mavjud emas yoki yashirin.</p>
        {slug && <Link to={siteHomePath(slug)} className="text-primary underline">Bosh sahifaga qaytish</Link>}
      </div>
    </div>
  );

  const theme = THEMES[site.theme] || THEMES.aurora;
  const displayName = brand?.name || site.title;
  const loginPath = siteLoginPath(site.slug);
  const homePath = siteHomePath(site.slug);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${theme.bg}`}>
      {/* Sticky branded nav with secondary page links */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/60 border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2 flex-wrap">
          <Link to={homePath} className="flex items-center gap-2.5 min-w-0">
            {brand?.logo_url ? (
              <img
                src={brand.logo_url}
                alt={`${displayName} logosi`}
                className="w-9 h-9 rounded-lg object-contain bg-white/80 p-1 shadow-sm flex-shrink-0"
              />
            ) : (
              <Logo size="sm" showText={false} forcePlatform />
            )}
            <div className="font-heading font-bold text-base sm:text-lg truncate">{displayName}</div>
          </Link>

          {/* Page links */}
          {pages.length > 0 && (
            <nav className="flex items-center gap-1 order-3 w-full sm:w-auto sm:order-2 overflow-x-auto">
              <Link
                to={homePath}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition whitespace-nowrap"
              >
                Bosh sahifa
              </Link>
              {pages.map((p) => (
                <Link
                  key={p.page_id}
                  to={sitePagePath(site.slug, p.page_slug)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    p.page_slug === page.page_slug
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
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

      {/* Page hero */}
      <section className="px-6 pt-16 sm:pt-20 pb-6 max-w-4xl mx-auto text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`text-3xl sm:text-5xl font-heading font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r ${theme.accent}`}>
          {page.page_title}
        </motion.h1>
      </section>

      {/* Body — varies by type */}
      <main className="px-6 pb-20 max-w-4xl mx-auto">
        <PagePayloadRenderer page={page} themeAccent={theme.accent} />

        <div className="mt-12 text-center">
          <Link
            to={homePath}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-8 border-t border-border/30">
        © {new Date().getFullYear()} {displayName}
      </footer>
    </div>
  );
};

const PagePayloadRenderer = ({ page, themeAccent }: { page: PageData; themeAccent: string }) => {
  const p = page.payload || {};

  if (page.page_type === "tech") {
    const items: string[] = Array.isArray(p.items) ? p.items : [];
    return (
      <div className="space-y-8">
        {p.intro && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base sm:text-lg text-muted-foreground text-center max-w-2xl mx-auto">
            {p.intro}
          </motion.p>
        )}
        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((it, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="glass-strong p-4 rounded-2xl flex items-start gap-3"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${themeAccent} flex items-center justify-center text-primary-foreground flex-shrink-0`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm leading-tight pt-1">{it}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (page.page_type === "study") {
    return (
      <div className="space-y-6">
        {p.intro && (
          <p className="text-base sm:text-lg text-muted-foreground text-center max-w-2xl mx-auto">{p.intro}</p>
        )}
        {(p.duration || p.level) && (
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {p.duration && (
              <div className="glass p-4 rounded-2xl text-center">
                <Clock className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Davomiylik</div>
                <div className="font-semibold text-sm mt-1">{p.duration}</div>
              </div>
            )}
            {p.level && (
              <div className="glass p-4 rounded-2xl text-center">
                <Award className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Daraja</div>
                <div className="font-semibold text-sm mt-1">{p.level}</div>
              </div>
            )}
          </div>
        )}
        {p.body && (
          <div className="glass-strong p-6 rounded-2xl">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {p.body}
            </div>
          </div>
        )}
      </div>
    );
  }

  // content / custom
  return (
    <div className="space-y-4">
      {p.body && (
        <div className="glass-strong p-6 sm:p-8 rounded-2xl whitespace-pre-wrap text-foreground/90 leading-relaxed text-base">
          {p.body}
        </div>
      )}
      {p.body2 && (
        <div className="glass p-6 sm:p-8 rounded-2xl whitespace-pre-wrap text-foreground/85 leading-relaxed">
          {p.body2}
        </div>
      )}
    </div>
  );
};

export default PublicPage;
