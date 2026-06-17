import { Link } from "react-router-dom";
import { MapPin, Clock, Star, Users, ArrowRight } from "lucide-react";
import { formatPrice, formatPriceUSD } from "@/data/tours";
import TourActions from "./TourActions";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type DbTour = Tables<"tours">;

interface TourCardProps {
  tour: DbTour;
  index?: number;
}

const tourTypeLabels: Record<string, string> = {
  family: "Oilaviy",
  group: "Guruh",
  luxury: "Hashamatli",
  budget: "Arzon",
  adventure: "Sarguzasht",
};

const TourCard = ({ tour, index = 0 }: TourCardProps) => {
  const discount = tour.original_price
    ? Math.round((1 - tour.price / tour.original_price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
      className="h-full"
    >
      <Link
        to={`/tours/${tour.id}`}
        className="group block h-full bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-400 hover:-translate-y-1.5"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={tour.image || "/placeholder.svg"}
            alt={tour.title}
            className="w-full h-full object-cover transition-transform duration-600 ease-out group-hover:scale-108"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {tour.featured && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground shadow-md">
                ⭐ Tavsiya
              </span>
            )}
            {discount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive text-destructive-foreground shadow-md">
                -{discount}%
              </span>
            )}
          </div>

          {/* Wishlist */}
          <TourActions tourId={tour.id} tourTitle={tour.title} variant="card" />

          {/* Price badge */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-background/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-border/30">
              {tour.original_price && (
                <span className="text-[10px] text-muted-foreground line-through block leading-tight">
                  {formatPrice(tour.original_price)}
                </span>
              )}
              <span className="text-sm sm:text-base font-bold text-primary leading-tight">
                {formatPrice(tour.price)}
              </span>
              <span className="text-[9px] text-muted-foreground block leading-tight">
                ≈ {formatPriceUSD(tour.price)}
              </span>
            </div>
          </div>

          {/* Tour type */}
          {tour.tour_type && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-background/90 backdrop-blur-sm text-foreground shadow-sm border border-border/20">
                {tourTypeLabels[tour.tour_type] || tour.tour_type}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mb-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{tour.destination}, {tour.country}</span>
          </div>

          <h3 className="font-semibold text-[13px] sm:text-sm text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-2.5 min-h-[2rem] sm:min-h-[2.5rem] leading-snug">
            {tour.title}
          </h3>

          <div className="flex items-center gap-3 text-[11px] sm:text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span>{tour.duration_days}k/{tour.duration_nights}t</span>
            </div>
            {tour.max_people && (
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span>{tour.max_people}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-border/40">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-xs sm:text-sm">{Number(tour.rating || 0).toFixed(1)}</span>
              <span className="text-muted-foreground text-[10px] sm:text-xs">
                ({tour.review_count || 0})
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-primary group-hover:gap-2 transition-all">
              Batafsil <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default TourCard;
