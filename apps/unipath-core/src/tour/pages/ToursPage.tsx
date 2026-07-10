import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Filter, Loader2, Compass, AlertTriangle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import TourCard from "@/components/tours/TourCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import TourFilters from "@/components/tours/TourFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { tourTypes } from "@/data/tours";
import { motion } from "framer-motion";
import { useFeatureToggles } from "@/hooks/useFeatureToggles";

const ToursPage = () => {
  const { t } = useTranslation();
  const { isFeatureEnabled } = useFeatureToggles();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get("region") || "all");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");
  const [selectedBookingType, setSelectedBookingType] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000000]);
  const [minRating, setMinRating] = useState(0);
  const [durationRange, setDurationRange] = useState<[number, number]>([1, 15]);
  const [sortBy, setSortBy] = useState("price-low");

  const { activeTenant } = useApp();
  const { data: dbTours = [], isLoading } = useQuery({
    queryKey: ["tours", activeTenant?.id],
    queryFn: async () => {
      // Only THIS tour company's tours (each tour tenant = one company)
      let q = supabase.from("tours").select("*").eq("status", "approved");
      if (activeTenant?.id) q = q.eq("tenant_id", activeTenant.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenant?.id,
  });

  const filteredTours = useMemo(() => {
    let result = [...dbTours];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.destination.toLowerCase().includes(query) ||
          t.country.toLowerCase().includes(query)
      );
    }

    if (selectedRegion !== "all") {
      if (selectedRegion === "uzbekistan") {
        result = result.filter((t) => t.country === "O'zbekiston");
      } else {
        result = result.filter((t) => t.country !== "O'zbekiston");
      }
    }

    if (selectedType !== "all") {
      result = result.filter((t) => t.tour_type === selectedType);
    }

    if (selectedBookingType !== "all") {
      if (selectedBookingType === "group") {
        result = result.filter((t) => t.tour_type === "group");
      } else {
        result = result.filter((t) => t.tour_type !== "group");
      }
    }

    result = result.filter((t) => t.price >= priceRange[0] && t.price <= priceRange[1]);

    if (minRating > 0) {
      result = result.filter((t) => (t.rating || 0) >= minRating);
    }

    result = result.filter((t) => t.duration_days >= durationRange[0] && t.duration_days <= durationRange[1]);

    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    if (sortBy === "rating") result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === "featured") result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return result;
  }, [dbTours, searchQuery, selectedRegion, selectedType, selectedBookingType, priceRange, minRating, durationRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRegion("all");
    setSelectedType("all");
    setSelectedBookingType("all");
    setPriceRange([0, 20000000]);
    setMinRating(0);
    setDurationRange([1, 15]);
    setSortBy("featured");
    setSearchParams({});
  };

  const hasActiveFilters =
    searchQuery ||
    selectedRegion !== "all" ||
    selectedType !== "all" ||
    selectedBookingType !== "all" ||
    priceRange[0] > 0 ||
    priceRange[1] < 20000000 ||
    minRating > 0 ||
    durationRange[0] > 1 ||
    durationRange[1] < 15;

  if (!isFeatureEnabled("tours_visibility")) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t("tours.allTours")}</h2>
          <p className="text-muted-foreground">Turlar hozircha vaqtincha o'chirilgan. Iltimos, keyinroq tashrif buyuring.</p>
          <Button className="mt-6" onClick={() => navigate("/")}>{t("notFound.goHome")}</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/20 min-h-screen">
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-20 w-96 h-48 bg-white/50 rounded-full blur-3xl" />
          </div>
          <div className="container-custom py-10 sm:py-16 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
                  <Compass className="h-6 w-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{t("tours.allTours")}</h1>
              </div>
              <p className="text-primary-foreground/80 max-w-2xl text-sm sm:text-base leading-relaxed">
                {t("tours.allToursSubtitle")}
              </p>
            </motion.div>
          </div>
        </div>

        <div className="container-custom py-5 sm:py-8">
          <TourFilters
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion}
            selectedType={selectedType} setSelectedType={setSelectedType}
            selectedBookingType={selectedBookingType} setSelectedBookingType={setSelectedBookingType}
            priceRange={priceRange} setPriceRange={setPriceRange}
            minRating={minRating} setMinRating={setMinRating}
            durationRange={durationRange} setDurationRange={setDurationRange}
            sortBy={sortBy} setSortBy={setSortBy}
            showFilters={showFilters} setShowFilters={setShowFilters}
            clearFilters={clearFilters}
            hasActiveFilters={!!hasActiveFilters}
          />

          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {isLoading ? "Yuklanmoqda..." : `${filteredTours.length} ta tur topildi`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Turlar yuklanmoqda...</span>
            </div>
          ) : filteredTours.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filteredTours.map((tour, index) => (
                <TourCard key={tour.id} tour={tour} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Filter className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("tours.nothingFound")}</h3>
              <p className="text-muted-foreground mb-5 max-w-md mx-auto">{t("tours.tryOther")}</p>
              <Button onClick={clearFilters} className="rounded-xl px-6">{t("tours.clearFilters")}</Button>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ToursPage;
