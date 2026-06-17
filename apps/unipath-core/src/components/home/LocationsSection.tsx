import { MapPin, Globe, Compass, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const LocationsSection = () => {
  const { t } = useTranslation();

  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["locations-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("tour_count", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/3">
        <div className="container-custom flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (destinations.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/3">
      <div className="container-custom">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <Globe className="h-4 w-4" />
            Mashhur lokatsiyalar
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Qayerga sayohat qilamiz?
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Eng mashhur yo'nalishlar va mamlakatlar bo'yicha turlar
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map((dest, index) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Link
                to={`/tours?destination=${dest.id}`}
                className="group relative rounded-2xl overflow-hidden bg-card border border-primary/10 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 block"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={dest.image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800"}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-background/90 backdrop-blur-sm text-foreground text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      {dest.name}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-md">
                      {dest.country}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Compass className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{dest.tour_count || 0}</span> turlar
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {dest.region === "uzbekistan" ? "O'zbekiston" : 
                       dest.region === "europe" ? "Yevropa" : 
                       dest.region === "asia" ? "Osiyo" : 
                       dest.region === "arab" ? "Arab davlatlari" : dest.region}
                    </div>
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

export default LocationsSection;
