import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  image: string | null;
  tour_count: number | null;
}

const DestinationsSection = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["home-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("tour_count", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as Destination[];
    },
  });

  useEffect(() => {
    if (destinations.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(1, destinations.length - 5));
    }, 4000);
    return () => clearInterval(timer);
  }, [destinations.length]);

  const defaultImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800";

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container-custom flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="section-title">{t("destinations.title")}</h2>
            <p className="section-subtitle mt-2">{t("destinations.subtitle")}</p>
          </div>
          <Link
            to="/destinations"
            className="text-primary font-medium flex items-center gap-2 hover:gap-3 transition-all"
          >
            {t("destinations.viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {destinations.slice(0, 8).map((destination, index) => (
            <Link
              key={destination.id}
              to={`/tours?destination=${destination.id}`}
              className={`group relative rounded-2xl overflow-hidden ${
                index === 0 ? "col-span-2 row-span-2" : ""
              }`}
              style={{ aspectRatio: index === 0 ? "1" : "3/4" }}
            >
              <img
                src={destination.image || defaultImage}
                alt={destination.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className={`font-bold text-white ${index === 0 ? "text-2xl" : "text-lg"}`}>
                  {destination.name}
                </h3>
                <p className="text-white/80 text-sm">
                  {destination.tour_count || 0} {t("destinations.tourCount")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DestinationsSection;