import { Search, SlidersHorizontal, X, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { tourTypes } from "@/data/tours";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface TourFiltersProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedRegion: string;
  setSelectedRegion: (v: string) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  selectedBookingType: string;
  setSelectedBookingType: (v: string) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  durationRange: [number, number];
  setDurationRange: (v: [number, number]) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const formatPrice = (price: number) => {
  if (price >= 1000000) return (price / 1000000).toFixed(1) + "M";
  if (price >= 1000) return (price / 1000).toFixed(0) + "K";
  return price.toString();
};

const TourFilters = ({
  searchQuery, setSearchQuery,
  selectedRegion, setSelectedRegion,
  selectedType, setSelectedType,
  selectedBookingType, setSelectedBookingType,
  priceRange, setPriceRange,
  minRating, setMinRating,
  durationRange, setDurationRange,
  sortBy, setSortBy,
  showFilters, setShowFilters,
  clearFilters, hasActiveFilters,
}: TourFiltersProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border/50 mb-6">
      {/* Search + Controls */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("tours.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/60 bg-muted/30 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Desktop Selects */}
        <div className="hidden lg:flex gap-2.5">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[140px] h-11 rounded-xl border-border/60 bg-muted/30">
              <SelectValue placeholder={t("tours.region")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("tours.allRegions")}</SelectItem>
              <SelectItem value="uzbekistan">{t("tours.uzbekistan")}</SelectItem>
              <SelectItem value="international">{t("tours.international")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[140px] h-11 rounded-xl border-border/60 bg-muted/30">
              <SelectValue placeholder={t("tours.tourType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("tours.allTypes")}</SelectItem>
              {tourTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>{type.icon} {type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] h-11 rounded-xl border-border/60 bg-muted/30">
              <SelectValue placeholder={t("tours.sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">{t("tours.recommended")}</SelectItem>
              <SelectItem value="price-low">{t("tours.priceLow")}</SelectItem>
              <SelectItem value="price-high">{t("tours.priceHigh")}</SelectItem>
              <SelectItem value="rating">{t("tours.byRating")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="h-11 rounded-xl px-5"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {t("tours.filters")}
          {hasActiveFilters && (
            <span className="ml-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border/40 space-y-5">
              {/* Mobile selects */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="lg:hidden">
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder={t("tours.region")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("tours.allRegions")}</SelectItem>
                      <SelectItem value="uzbekistan">{t("tours.uzbekistan")}</SelectItem>
                      <SelectItem value="international">{t("tours.international")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="lg:hidden">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder={t("tours.tourType")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("tours.allTypes")}</SelectItem>
                      {tourTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.icon} {type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={selectedBookingType} onValueChange={setSelectedBookingType}>
                  <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder={t("tours.travelType")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("tours.allTypes")}</SelectItem>
                    <SelectItem value="group">{t("tours.groupTour")}</SelectItem>
                    <SelectItem value="individual">{t("tours.individualTour")}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="lg:hidden">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder={t("tours.sort")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">{t("tours.recommended")}</SelectItem>
                      <SelectItem value="price-low">{t("tours.priceLow")}</SelectItem>
                      <SelectItem value="price-high">{t("tours.priceHigh")}</SelectItem>
                      <SelectItem value="rating">{t("tours.byRating")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-muted/20 rounded-xl p-4">
                <label className="text-sm font-medium mb-3 block text-foreground">
                  💰 Narx: <span className="text-primary font-semibold">{formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}</span> so'm
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  min={0}
                  max={20000000}
                  step={500000}
                />
              </div>

              {/* Rating */}
              <div className="bg-muted/20 rounded-xl p-4">
                <label className="text-sm font-medium mb-3 block text-foreground">
                  ⭐ Minimal reyting: <span className="text-primary font-semibold">{minRating > 0 ? `${minRating}+` : "Barchasi"}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[0, 3, 4, 4.5, 4.8].map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant={minRating === r ? "default" : "outline"}
                      onClick={() => setMinRating(r)}
                      className="text-xs rounded-lg h-8"
                    >
                      {r === 0 ? "Barchasi" : (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" /> {r}+
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-muted/20 rounded-xl p-4">
                <label className="text-sm font-medium mb-3 block text-foreground">
                  📅 Muddat: <span className="text-primary font-semibold">{durationRange[0]} — {durationRange[1]}</span> kun
                </label>
                <Slider
                  value={durationRange}
                  onValueChange={(v) => setDurationRange(v as [number, number])}
                  min={1}
                  max={15}
                  step={1}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">{t("tours.filtersLabel")}</span>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive ml-auto rounded-lg">
            <X className="h-4 w-4 mr-1" />
            {t("tours.clearFilters")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TourFilters;
