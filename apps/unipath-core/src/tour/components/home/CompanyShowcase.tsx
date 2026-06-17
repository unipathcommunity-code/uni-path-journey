import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Star, ArrowUpRight, Building2 } from "lucide-react";

const CompanyShowcase = () => {
  const { data: companies, isLoading } = useQuery({
    queryKey: ["showcase-companies"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tour_companies")
        .select("id, slug, name, tagline, logo_url, banner_url, primary_color, rating, review_count, total_tours, city, country")
        .eq("status", "approved")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading || !companies || companies.length === 0) return null;

  return (
    <section className="py-20 md:py-28">
      <div className="container-custom">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Building2 className="h-3.5 w-3.5" />
              Bizning kompaniyalarimiz
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">UniTour'da ishlaydigan tour kompaniyalar</h2>
            <p className="text-muted-foreground mt-2">Yuzlab tour kompaniyalar bizga ishonadi.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {companies.map((c: any, i: number) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                to={`/${c.slug}`}
                className="group block rounded-2xl overflow-hidden bg-card border border-primary/10 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all"
              >
                <div
                  className="h-32 relative bg-gradient-to-br from-primary/20 to-accent/20"
                  style={{
                    backgroundImage: c.banner_url ? `url(${c.banner_url})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <ArrowUpRight className="absolute top-3 right-3 h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4 -mt-8 relative">
                  <div className="w-14 h-14 rounded-2xl bg-card border-2 border-card shadow-md overflow-hidden flex items-center justify-center">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <h3 className="font-semibold mt-3 line-clamp-1">{c.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">
                    {c.tagline || `${c.city || ""} ${c.country || ""}`.trim()}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    {Number(c.rating) > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {Number(c.rating).toFixed(1)}
                      </span>
                    )}
                    <span>{c.total_tours || 0} tour</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyShowcase;
