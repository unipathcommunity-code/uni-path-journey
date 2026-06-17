import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import TourCard from "@/components/tours/TourCard";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureToggles } from "@/hooks/useFeatureToggles";

const FeaturedTours = () => {
  const { t } = useTranslation();
  const { isFeatureEnabled } = useFeatureToggles();

  const { data: featuredTours = [], isLoading } = useQuery({
    queryKey: ["featured-tours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("status", "approved")
        .eq("featured", true)
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  if (!isFeatureEnabled("tours_visibility")) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="section-title">{t("featured.title")}</h2>
            <p className="section-subtitle mt-2">{t("featured.subtitle")}</p>
          </div>
          <Link
            to="/tours"
            className="text-primary font-medium flex items-center gap-2 hover:gap-3 transition-all"
          >
            {t("featured.viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredTours.map((tour, index) => (
              <TourCard key={tour.id} tour={tour} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedTours;
