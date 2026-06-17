import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { tours, destinations, formatPrice } from "@/data/tours";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const popularSearches = [
  "Samarqand",
  "Dubay",
  "Turkiya",
  "Umra",
  "Buxoro",
  "Xiva",
];

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    tours: typeof tours;
    destinations: typeof destinations;
  }>({ tours: [], destinations: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tours: [], destinations: [] });
      return;
    }

    const searchTerm = query.toLowerCase();

    const matchedTours = tours.filter(
      (tour) =>
        tour.title.toLowerCase().includes(searchTerm) ||
        tour.destination.toLowerCase().includes(searchTerm) ||
        tour.country.toLowerCase().includes(searchTerm)
    ).slice(0, 5);

    const matchedDestinations = destinations.filter(
      (dest) =>
        dest.name.toLowerCase().includes(searchTerm) ||
        dest.country.toLowerCase().includes(searchTerm)
    ).slice(0, 4);

    setResults({
      tours: matchedTours,
      destinations: matchedDestinations,
    });
  }, [query]);

  const handleTourClick = (tourId: string) => {
    navigate(`/tours/${tourId}`);
    onClose();
    setQuery("");
  };

  const handleDestinationClick = (destId: string) => {
    navigate(`/tours?destination=${destId}`);
    onClose();
    setQuery("");
  };

  const handlePopularSearch = (term: string) => {
    setQuery(term);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="fixed inset-x-0 top-0 bg-background border-b border-border shadow-lg animate-in slide-in-from-top duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="container-custom py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tur, shahar yoki davlat qidiring..."
              className="w-full h-14 pl-12 pr-12 text-lg bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Results */}
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {!query.trim() && (
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Mashhur qidiruvlar
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handlePopularSearch(term)}
                      className="px-4 py-2 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results.destinations.length > 0 && (
              <div className="py-4 border-b border-border">
                <p className="text-sm text-muted-foreground mb-3">Yo'nalishlar</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {results.destinations.map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => handleDestinationClick(dest.id)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
                    >
                      <img
                        src={dest.image}
                        alt={dest.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm">{dest.name}</p>
                        <p className="text-xs text-muted-foreground">{dest.tourCount} tur</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results.tours.length > 0 && (
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-3">Turlar</p>
                <div className="space-y-2">
                  {results.tours.map((tour) => (
                    <button
                      key={tour.id}
                      onClick={() => handleTourClick(tour.id)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                    >
                      <img
                        src={tour.image}
                        alt={tour.title}
                        className="w-16 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tour.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tour.destination}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {tour.duration.days} kun
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-sm">
                          {formatPrice(tour.price)}
                        </p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && results.tours.length === 0 && results.destinations.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">"{query}" bo'yicha natija topilmadi</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Boshqa kalit so'z bilan qidiring
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
