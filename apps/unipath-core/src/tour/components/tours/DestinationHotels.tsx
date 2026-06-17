import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Star, Wifi, UtensilsCrossed, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DestinationHotelsProps {
  destinationName: string;
}

const DestinationHotels = ({ destinationName }: DestinationHotelsProps) => {
  // First find destination by name, then get hotels
  const { data: hotels, isLoading } = useQuery({
    queryKey: ["destination-hotels", destinationName],
    queryFn: async () => {
      // Find destination by name
      const { data: destinations, error: destError } = await supabase
        .from("destinations")
        .select("id")
        .ilike("name", `%${destinationName}%`)
        .limit(1);

      if (destError) throw destError;
      if (!destinations || destinations.length === 0) return [];

      // Get hotels for this destination
      const { data: hotelsData, error: hotelsError } = await supabase
        .from("hotels")
        .select("*")
        .eq("destination_id", destinations[0].id)
        .eq("is_partner", true);

      if (hotelsError) throw hotelsError;
      return hotelsData;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hotels || hotels.length === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
      />
    ));
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{destinationName} shahridagi mehmonxonalar</h2>
          <p className="text-sm text-muted-foreground">Sizning turingiz uchun tavsiya etilgan turar joylar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="bg-card rounded-xl border border-border overflow-hidden flex hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div className="w-32 h-full flex-shrink-0">
              <img
                src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-4 flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm">{hotel.name}</h3>
                <Badge variant="outline" className="text-xs">Hamkor</Badge>
              </div>

              <div className="flex mb-2">{renderStars(hotel.star_rating || 3)}</div>

              {hotel.address && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{hotel.address}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {hotel.has_wifi && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted rounded text-xs">
                    <Wifi className="h-2.5 w-2.5" /> Wi-Fi
                  </span>
                )}
                {hotel.breakfast_included && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-success/10 text-success rounded text-xs">
                    <UtensilsCrossed className="h-2.5 w-2.5" /> Nonushta
                  </span>
                )}
                {hotel.has_restaurant && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted rounded text-xs">
                    <UtensilsCrossed className="h-2.5 w-2.5" /> Restoran
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DestinationHotels;
