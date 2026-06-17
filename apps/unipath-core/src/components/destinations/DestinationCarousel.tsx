import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  image: string | null;
  tour_count: number | null;
}

interface DestinationCarouselProps {
  destinations: Destination[];
  title: string;
  emoji: string;
  autoPlay?: boolean;
  interval?: number;
}

const DestinationCarousel = ({
  destinations,
  title,
  emoji,
  autoPlay = true,
  interval = 4000,
}: DestinationCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 4,
  };

  // Get items per view based on window size
  const getItemsPerView = () => {
    if (typeof window === "undefined") return itemsPerView.desktop;
    if (window.innerWidth < 640) return itemsPerView.mobile;
    if (window.innerWidth < 1024) return itemsPerView.tablet;
    return itemsPerView.desktop;
  };

  const [visibleItems, setVisibleItems] = useState(getItemsPerView());

  useEffect(() => {
    const handleResize = () => setVisibleItems(getItemsPerView());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, destinations.length - visibleItems);

  useEffect(() => {
    if (!autoPlay || isHovered || destinations.length <= visibleItems) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, isHovered, maxIndex, destinations.length, visibleItems]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  if (destinations.length === 0) return null;

  const defaultImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800";

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          {title}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({destinations.length} ta yo'nalish)
          </span>
        </h2>

        {destinations.length > visibleItems && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrev}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleItems)}%)`,
          }}
        >
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / visibleItems}%` }}
            >
              <Link
                to={`/tours?destination=${dest.id}`}
                className="group relative block rounded-2xl overflow-hidden aspect-[4/5]"
              >
                <img
                  src={dest.image || defaultImage}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                    {dest.name}
                  </h3>
                  <p className="text-white/80 text-sm mb-3">{dest.country}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">
                      {dest.tour_count || 0} tur mavjud
                    </span>
                    <span className="text-white flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Ko'rish <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>
          ))}
        </div>

        {/* Progress indicators */}
        {destinations.length > visibleItems && (
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-8 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default DestinationCarousel;
