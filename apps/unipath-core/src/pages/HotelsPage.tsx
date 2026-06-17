import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { 
  Star, Wifi, Car, Waves, Dumbbell, Flower, Wind, 
  UtensilsCrossed, Coffee, Loader2, MapPin, Phone, Mail
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const HotelsPage = () => {
  const { data: hotels, isLoading } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .eq("is_partner", true)
        .order("star_rating", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
      />
    ));
  };

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Hamkor mehmonxonalar</h1>
          <p className="text-primary-foreground/80 max-w-2xl">
            Bizning tekshirilgan hamkor mehmonxonalarimiz sizga eng yaxshi turar joy va xizmatni taqdim etadi.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : hotels && hotels.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="aspect-[16/9] relative">
                  <img
                    src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-primary-foreground">
                      Hamkor
                    </Badge>
                  </div>
                  {hotel.price_per_night && (
                    <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur px-3 py-2 rounded-lg">
                      <span className="font-bold text-primary">{formatPrice(hotel.price_per_night)}</span>
                      <span className="text-sm text-muted-foreground"> / tun</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{hotel.name}</h3>
                      {hotel.address && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{hotel.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex">{renderStars(hotel.star_rating || 3)}</div>
                  </div>

                  {/* Description */}
                  {hotel.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {hotel.description}
                    </p>
                  )}

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.has_wifi && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                        <Wifi className="h-3 w-3" /> Wi-Fi
                      </span>
                    )}
                    {hotel.has_parking && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                        <Car className="h-3 w-3" /> Avtoturargoh
                      </span>
                    )}
                    {hotel.has_pool && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                        <Waves className="h-3 w-3" /> Basseyn
                      </span>
                    )}
                    {hotel.has_gym && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                        <Dumbbell className="h-3 w-3" /> Sport zal
                      </span>
                    )}
                    {hotel.has_spa && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                        <Flower className="h-3 w-3" /> SPA
                      </span>
                    )}
                    {hotel.has_air_conditioning && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                        <Wind className="h-3 w-3" /> Konditsioner
                      </span>
                    )}
                    {hotel.has_restaurant && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                        <UtensilsCrossed className="h-3 w-3" /> Restoran
                      </span>
                    )}
                  </div>

                  {/* Meals */}
                  <div className="flex flex-wrap gap-3 mb-4 pt-4 border-t border-border">
                    {hotel.breakfast_included && (
                      <span className="text-xs text-success flex items-center gap-1">
                        <Coffee className="h-3 w-3" /> Nonushta ✓
                      </span>
                    )}
                    {hotel.lunch_included && (
                      <span className="text-xs text-success flex items-center gap-1">
                        <UtensilsCrossed className="h-3 w-3" /> Tushlik ✓
                      </span>
                    )}
                    {hotel.dinner_included && (
                      <span className="text-xs text-success flex items-center gap-1">
                        <UtensilsCrossed className="h-3 w-3" /> Kechki ovqat ✓
                      </span>
                    )}
                    {!hotel.breakfast_included && !hotel.lunch_included && !hotel.dinner_included && (
                      <span className="text-xs text-muted-foreground">Ovqat alohida</span>
                    )}
                  </div>

                  {/* Check times & Contact */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border text-sm">
                    <div className="flex gap-4 text-muted-foreground">
                      <span>Kirish: <strong className="text-foreground">{hotel.check_in_time}</strong></span>
                      <span>Chiqish: <strong className="text-foreground">{hotel.check_out_time}</strong></span>
                    </div>
                    <div className="flex gap-3">
                      {hotel.phone && (
                        <a href={`tel:${hotel.phone}`} className="text-primary hover:text-primary/80">
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {hotel.email && (
                        <a href={`mailto:${hotel.email}`} className="text-primary hover:text-primary/80">
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Hozircha mehmonxonalar mavjud emas</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HotelsPage;
