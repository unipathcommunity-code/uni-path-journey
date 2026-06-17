import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, Phone, Mail, MapPin, Globe, Instagram, Send, MessageCircle, Search, Star,
  Calendar, Users, ChevronRight, Award, Shield, HeartHandshake, ArrowRight, CheckCircle2, Sparkles,
  LogIn, UserPlus, LogOut, User as UserIcon, Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyBySlug } from "@/hooks/useTourCompany";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyCustomer } from "@/hooks/useCompanyCustomer";
import CompanyAuthDialog from "@/components/company/CompanyAuthDialog";
import NotFound from "./NotFound";

const CompanyPublicSite = ({ slugOverride }: { slugOverride?: string } = {}) => {
  const params = useParams<{ slug: string }>();
  const slug = slugOverride ?? params.slug;
  const { data: company, isLoading } = useCompanyBySlug(slug);
  const { user, signOut } = useAuth();
  const { customer } = useCompanyCustomer(company?.id);
  const [authOpen, setAuthOpen] = useState<false | "login" | "signup" | "staff">(false);
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState(2);
  const [travelDate, setTravelDate] = useState("");
  const [tourType, setTourType] = useState<string>("all");
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "newest">("newest");
  const [submitting, setSubmitting] = useState(false);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroY = useTransform(scrollY, [0, 300], [0, 80]);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Inject custom favicon and SEO + per-brand CSS vars
  useEffect(() => {
    if (!company) return;
    document.title = company.seo_title || `${company.name} — Sayohatga taklif`;
    if (company.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = company.favicon_url;
    }
    const meta = document.querySelector('meta[name="description"]');
    if (meta && company.seo_description) meta.setAttribute("content", company.seo_description);
    const root = document.documentElement;
    root.style.setProperty("--brand", company.primary_color);
    root.style.setProperty("--brand-2", company.secondary_color);
    root.style.setProperty("--brand-accent", company.accent_color);
    return () => {
      root.style.removeProperty("--brand");
      root.style.removeProperty("--brand-2");
      root.style.removeProperty("--brand-accent");
    };
  }, [company]);

  const { data: tours } = useQuery({
    queryKey: ["public-company-tours", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await (supabase as any).from("tours").select("*").eq("company_id", company!.id).eq("status", "approved");
      return data || [];
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["public-company-posts", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await (supabase as any).from("company_posts").select("*").eq("company_id", company!.id).eq("is_published", true).order("published_at", { ascending: false }).limit(3);
      return data || [];
    },
  });

  const filteredTours = useMemo(() => {
    let list = tours || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t: any) => t.title.toLowerCase().includes(q) || t.destination?.toLowerCase().includes(q));
    }
    if (tourType !== "all") list = list.filter((t: any) => t.tour_type === tourType);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [tours, search, tourType, sort]);

  const tourTypes = useMemo(() => {
    const set = new Set((tours || []).map((t: any) => t.tour_type).filter(Boolean));
    return ["all", ...Array.from(set)] as string[];
  }, [tours]);

  const popularDestinations = useMemo(() => {
    const counts: Record<string, number> = {};
    (tours || []).forEach((t: any) => { if (t.destination) counts[t.destination] = (counts[t.destination] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([d]) => d);
  }, [tours]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!company) return <NotFound />;

  const submitLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await (supabase as any).from("company_leads").insert({
      company_id: company.id,
      full_name: fd.get("full_name"),
      phone: fd.get("phone"),
      email: fd.get("email") || null,
      message: fd.get("message") || null,
      source: "contact_form",
    });
    setSubmitting(false);
    if (error) { console.error("Lead submit:", error); alert("Murojaat yuborilmadi. Iltimos qaytadan urinib ko'ring."); }
    else { (e.target as HTMLFormElement).reset(); alert("Murojaatingiz qabul qilindi! Tez orada bog'lanamiz."); }
  };

  const goToTours = () => document.getElementById("tours")?.scrollIntoView({ behavior: "smooth" });

  const totalReviews = company.review_count || 0;
  const rating = company.rating || 4.9;
  const stats = [
    { v: tours?.length ?? 0, l: "Tayyor turlar" },
    { v: company.total_bookings || 0, l: "Mamnun mijoz" },
    { v: `${rating.toFixed(1)}★`, l: `${totalReviews} izoh` },
    { v: Math.max(1, new Date().getFullYear() - new Date(company.created_at).getFullYear()), l: "Yil tajriba" },
  ];

  const tourTypeLabel: Record<string, string> = {
    all: "Hammasi", cultural: "Madaniy", adventure: "Sarguzasht", beach: "Plyaj",
    religious: "Diniy", ski: "Tog'", city: "Shahar", nature: "Tabiat",
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: company.font_family }}>
      {/* === Header === */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/85 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2.5 group shrink-0">
            {company.logo_url ? (
              <img src={company.logo_url} className="h-10 w-10 rounded-xl object-cover" alt={company.name} />
            ) : (
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: `linear-gradient(135deg, ${company.primary_color}, ${company.secondary_color})` }}>
                {company.name.charAt(0)}
              </div>
            )}
            <div className="leading-tight">
              <span className="font-bold block text-sm md:text-base">{company.name}</span>
              {company.tagline && <span className="text-[11px] text-muted-foreground hidden md:block">{company.tagline}</span>}
            </div>
          </a>

          {/* Sticky compact search */}
          <AnimatePresence>
            {scrolled && (
              <motion.div
                initial={{ opacity: 0, y: -8, width: 0 }}
                animate={{ opacity: 1, y: 0, width: "auto" }}
                exit={{ opacity: 0, y: -8, width: 0 }}
                className="hidden md:flex flex-1 max-w-md mx-4"
              >
                <div className="flex items-center gap-1 w-full bg-muted/60 hover:bg-muted rounded-full pl-4 pr-1 h-10 cursor-pointer transition" onClick={goToTours}>
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Yo'nalish qidiring..."
                    className="bg-transparent flex-1 outline-none text-sm"
                  />
                  <Button size="sm" className="rounded-full h-8 text-white shrink-0" style={{ background: company.accent_color }} onClick={goToTours}>
                    Qidirish
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <a href="#tours" className="hover:opacity-70 transition">Turlar</a>
            <a href="#about" className="hover:opacity-70 transition">Biz haqimizda</a>
            {posts?.length ? <a href="#blog" className="hover:opacity-70 transition">Blog</a> : null}
            <a href="#contact" className="hover:opacity-70 transition">Aloqa</a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {company.phone && (
              <a href={`tel:${company.phone}`} className="hidden xl:flex items-center gap-1.5 text-xs font-medium hover:opacity-80">
                <Phone className="h-3.5 w-3.5" />
                <span>{company.phone}</span>
              </a>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: company.primary_color }}>
                      {(customer?.full_name || user.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-xs font-medium max-w-[80px] truncate">{customer?.full_name || user.email?.split("@")[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" /> Mening akkauntim
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5 rounded-xl" onClick={() => setAuthOpen("login")}>
                  <LogIn className="h-3.5 w-3.5" /> Kirish
                </Button>
                <Button size="sm" style={{ background: company.primary_color }} className="text-white hover:opacity-90 rounded-xl gap-1.5" onClick={() => setAuthOpen("signup")}>
                  <UserPlus className="h-3.5 w-3.5" /> Ro'yxat
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {!!authOpen && (
        <CompanyAuthDialog
          open={!!authOpen}
          onOpenChange={(v) => !v && setAuthOpen(false)}
          companyId={company.id}
          companyName={company.name}
          primaryColor={company.primary_color}
          defaultTab={authOpen === "signup" ? "signup" : "login"}
          accountType={authOpen === "staff" ? "staff" : "customer"}
        />
      )}

      {/* === Hero === */}
      <section id="top" className="relative min-h-[90vh] flex items-center justify-center text-white overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: company.banner_url
              ? `linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.7)), url(${company.banner_url}) center/cover`
              : `linear-gradient(135deg, ${company.primary_color}, ${company.secondary_color})`,
          }} />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative text-center container px-4 z-10 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Badge className="bg-white/20 backdrop-blur border-white/30 text-white mb-5 hover:bg-white/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Rasmiy tour operator
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]"
          >
            {company.name}
          </motion.h1>
          {company.tagline && (
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-lg md:text-2xl opacity-95 mt-5 max-w-2xl mx-auto font-light">
              {company.tagline}
            </motion.p>
          )}

          {/* Multi-field search (Aviasales-style) */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-10 max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-2xl md:rounded-full p-2 shadow-2xl flex flex-col md:flex-row items-stretch gap-2">
              <div className="flex items-center gap-2 flex-1 px-4 py-2 md:py-0">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goToTours()}
                  placeholder="Qayerga? (masalan: Samarqand)"
                  className="bg-transparent text-foreground flex-1 outline-none text-sm md:text-base placeholder:text-muted-foreground"
                />
              </div>
              <div className="md:border-l flex items-center gap-2 px-4 py-2 md:py-0">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="bg-transparent text-foreground outline-none text-sm md:text-base placeholder:text-muted-foreground w-full"
                />
              </div>
              <div className="md:border-l flex items-center gap-2 px-4 py-2 md:py-0">
                <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                <select
                  value={people}
                  onChange={(e) => setPeople(Number(e.target.value))}
                  className="bg-transparent text-foreground outline-none text-sm md:text-base appearance-none pr-2"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n} kishi</option>
                  ))}
                </select>
              </div>
              <Button size="lg" className="rounded-xl md:rounded-full px-6 md:px-8 text-white font-semibold shrink-0" style={{ background: company.accent_color }} onClick={goToTours}>
                <Search className="h-4 w-4 mr-2" /> Qidirish
              </Button>
            </div>

            {/* Popular chips */}
            {popularDestinations.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="text-xs opacity-80 self-center">Mashhur:</span>
                {popularDestinations.map((d) => (
                  <button key={d} onClick={() => { setSearch(d); goToTours(); }}
                    className="text-xs bg-white/15 backdrop-blur hover:bg-white/25 transition px-3 py-1.5 rounded-full border border-white/20">
                    {d}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Trust strip */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm">
            <div className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Litsenziyalangan</div>
            <div className="flex items-center gap-1.5"><Award className="h-4 w-4" /> Sifat kafolati</div>
            <div className="flex items-center gap-1.5"><HeartHandshake className="h-4 w-4" /> 24/7 qo'llab-quvvatlash</div>
          </motion.div>
        </motion.div>
      </section>

      {/* === Stats bar === */}
      <section className="border-y bg-card">
        <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }} className="text-center">
              <p className="text-2xl md:text-4xl font-extrabold" style={{ color: company.primary_color }}>{s.v}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{s.l}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* === Tours === */}
      <section id="tours" className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <Badge variant="secondary" className="mb-3">Bizning takliflar</Badge>
            <h2 className="text-3xl md:text-5xl font-bold" style={{ color: company.primary_color }}>Sayohatga tayyor turlar</h2>
            <p className="text-muted-foreground mt-3">Har bir tur sizning unutilmas xotirangiz uchun mukammal tayyorlangan</p>
          </div>

          {/* Filters */}
          {!!tours?.length && (
            <div className="mb-8 flex flex-col md:flex-row md:items-center gap-3 sticky top-16 z-30 bg-muted/30 backdrop-blur py-3 -mx-4 px-4">
              <div className="flex gap-2 overflow-x-auto pb-1 flex-1 scrollbar-hide">
                {tourTypes.map((t) => (
                  <button key={t} onClick={() => setTourType(t)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${tourType === t ? "text-white shadow-md" : "bg-background hover:bg-muted border"}`}
                    style={tourType === t ? { background: company.primary_color } : {}}>
                    {tourTypeLabel[t] || t}
                  </button>
                ))}
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value as any)}
                className="h-10 rounded-full border bg-background px-4 text-sm font-medium shrink-0">
                <option value="newest">Yangi qo'shilgan</option>
                <option value="price-asc">Arzon → qimmat</option>
                <option value="price-desc">Qimmat → arzon</option>
              </select>
            </div>
          )}

          {!filteredTours.length ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              {tours?.length ? "Filtr bo'yicha turlar topilmadi" : "Tez orada qiziqarli turlar qo'shiladi"}
            </CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {filteredTours.map((t: any, i: number) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05 }}>
                  <Link to={`/tours/${t.id}`} className="block h-full">
                    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full group border-0 shadow-md rounded-2xl">
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {t.image && <img src={t.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={t.title} />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                        <Badge className="absolute top-3 left-3 backdrop-blur bg-white/90 text-foreground border-0">
                          <Calendar className="h-3 w-3 mr-1" />
                          {t.duration_days} kun {t.duration_nights ? `${t.duration_nights} tun` : ""}
                        </Badge>
                        {t.original_price && t.original_price > t.price && (
                          <Badge className="absolute top-3 right-3 text-white border-0" style={{ background: company.accent_color }}>
                            -{Math.round(((t.original_price - t.price) / t.original_price) * 100)}%
                          </Badge>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <MapPin className="h-3 w-3" /> {t.destination}
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-bold text-base line-clamp-2 min-h-[3rem]">{t.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {t.max_people || 10} kishigacha</span>
                          {t.rating > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {t.rating}</span>}
                        </div>
                        <div className="flex items-end justify-between mt-4 pt-4 border-t">
                          <div>
                            {t.original_price && t.original_price > t.price && (
                              <span className="text-xs text-muted-foreground line-through block leading-none">${t.original_price}</span>
                            )}
                            <p className="text-2xl font-extrabold leading-tight" style={{ color: company.primary_color }}>${t.price}</p>
                            <span className="text-[10px] text-muted-foreground">/ kishi</span>
                          </div>
                          <Button size="sm" className="text-white rounded-full" style={{ background: company.primary_color }}>
                            Ko'rish <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* === About === */}
      {company.description && (
        <section id="about" className="py-16 md:py-20 container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge variant="secondary" className="mb-3">Biz haqimizda</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-5" style={{ color: company.primary_color }}>
                Tajriba va ishonch yo'l ko'rsatuvchimiz
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base">{company.description}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {["Mahalliy gid", "Premium mehmonxona", "24/7 yordam", "Sug'urta"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4" style={{ color: company.primary_color }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: company.banner_url
                  ? `url(${company.banner_url}) center/cover`
                  : `linear-gradient(135deg, ${company.primary_color}, ${company.secondary_color})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
              {company.logo_url && (
                <div className="absolute bottom-6 left-6 bg-white p-3 rounded-2xl shadow-xl">
                  <img src={company.logo_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* === Blog === */}
      {!!posts?.length && (
        <section id="blog" className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <Badge variant="secondary" className="mb-3">Blog</Badge>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: company.primary_color }}>So'nggi yangiliklar</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {posts.map((p: any, i: number) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Card className="overflow-hidden hover:shadow-xl transition group h-full border-0 shadow-md rounded-2xl">
                    {p.cover_image && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img src={p.cover_image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.title} />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <Badge variant="outline" className="text-[10px] mb-2">{p.category}</Badge>
                      <h3 className="font-bold line-clamp-2">{p.title}</h3>
                      {p.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{p.excerpt}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === Contact / CTA === */}
      <section id="contact" className="py-16 md:py-20 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${company.primary_color}, ${company.secondary_color})` }}
      >
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto items-start text-white">
            <div>
              <Badge className="bg-white/20 backdrop-blur border-white/30 text-white mb-3">Bog'lanish</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">Sayohatingizni boshlaymiz</h2>
              <p className="opacity-90 mb-8 max-w-md">
                Forma to'ldiring va biz tez orada eng yaxshi taklif bilan bog'lanamiz. Yoki to'g'ridan-to'g'ri qo'ng'iroq qiling.
              </p>
              <div className="space-y-4">
                {company.phone && <a href={`tel:${company.phone}`} className="flex items-center gap-3 hover:opacity-80 transition group">
                  <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center group-hover:bg-white/25"><Phone className="h-5 w-5" /></div>
                  <div><p className="text-xs opacity-80">Telefon</p><p className="font-medium">{company.phone}</p></div>
                </a>}
                {company.email && <a href={`mailto:${company.email}`} className="flex items-center gap-3 hover:opacity-80 transition group">
                  <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center group-hover:bg-white/25"><Mail className="h-5 w-5" /></div>
                  <div><p className="text-xs opacity-80">Email</p><p className="font-medium">{company.email}</p></div>
                </a>}
                {(company.address || company.city) && <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center"><MapPin className="h-5 w-5" /></div>
                  <div><p className="text-xs opacity-80">Manzil</p><p className="font-medium">{[company.address, company.city].filter(Boolean).join(", ")}</p></div>
                </div>}
              </div>
              <div className="flex gap-2 mt-6">
                {company.telegram && <a href={`https://t.me/${company.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20"><Send className="h-4 w-4 text-white" /></Button>
                </a>}
                {company.whatsapp && <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20"><MessageCircle className="h-4 w-4 text-white" /></Button>
                </a>}
                {company.instagram && <a href={`https://instagram.com/${company.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20"><Instagram className="h-4 w-4 text-white" /></Button>
                </a>}
                {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20"><Globe className="h-4 w-4 text-white" /></Button>
                </a>}
              </div>
            </div>

            <Card className="border-0 shadow-2xl">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-foreground">Bepul konsultatsiya</h3>
                <p className="text-sm text-muted-foreground mt-1">5 daqiqa ichida sizga eng yaxshi taklif</p>
                <form onSubmit={submitLead} className="space-y-3 mt-5">
                  <Input name="full_name" required placeholder="Ismingiz *" />
                  <Input name="phone" required placeholder="Telefon raqamingiz *" />
                  <Input name="email" type="email" placeholder="Email (ixtiyoriy)" />
                  <textarea name="message" rows={3} placeholder="Qaysi sayohat sizni qiziqtiradi?"
                    className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-sm" />
                  <Button type="submit" size="lg" className="w-full text-white" disabled={submitting}
                    style={{ background: company.primary_color }}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                    Yuborish
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground">
                    Yuborish orqali siz bizning maxfiylik siyosatimizga rozilik bildirasiz
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      </section>

      {/* === Floating contact button === */}
      {(company.whatsapp || company.telegram || company.phone) && (
        <a
          href={
            company.whatsapp
              ? `https://wa.me/${company.whatsapp.replace(/\D/g, "")}`
              : company.telegram
              ? `https://t.me/${company.telegram.replace("@", "")}`
              : `tel:${company.phone}`
          }
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
          style={{ background: company.accent_color }}
          aria-label="Bog'lanish"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}

      {/* === Footer === */}
      <footer className="py-8 text-center border-t bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            {company.logo_url && <img src={company.logo_url} className="h-7 w-7 rounded object-cover" alt="" />}
            <span className="font-bold">{company.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {company.name} · Barcha huquqlar himoyalangan
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-2">
            <button onClick={() => setAuthOpen("staff")} className="hover:text-foreground transition">
              Xodim kirishi
            </button>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CompanyPublicSite;
