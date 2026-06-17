import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { 
  Bus, Car, Wifi, Wind, Tv, ShowerHead, Users, 
  Loader2, Phone, Palette, Hash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TransportPage = () => {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("is_available", true)
        .order("vehicle_type");

      if (error) throw error;
      return data;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "bus":
        return <Bus className="h-6 w-6" />;
      case "minibus":
        return <Bus className="h-5 w-5" />;
      default:
        return <Car className="h-5 w-5" />;
    }
  };

  const getVehicleTypeName = (type: string) => {
    switch (type) {
      case "bus":
        return "Avtobus";
      case "minibus":
        return "Mikroavtobus";
      case "car":
        return "Avtomobil";
      default:
        return type;
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Transport xizmatlari</h1>
          <p className="text-primary-foreground/80 max-w-2xl">
            Sayohatlaringiz uchun qulay va xavfsiz transport vositalarini taqdim etamiz.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : vehicles && vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="aspect-[16/10] relative">
                  <img
                    src={vehicle.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800"}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      {getVehicleIcon(vehicle.vehicle_type)}
                      {getVehicleTypeName(vehicle.vehicle_type)}
                    </Badge>
                  </div>
                  {vehicle.price_per_day && (
                    <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur px-3 py-2 rounded-lg">
                      <span className="font-bold text-primary">{formatPrice(vehicle.price_per_day)}</span>
                      <span className="text-sm text-muted-foreground"> / kun</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-1">{vehicle.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {vehicle.brand} {vehicle.model}
                    </p>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span><strong>{vehicle.capacity}</strong> o'rin</span>
                    </div>
                    {vehicle.color && (
                      <div className="flex items-center gap-2 text-sm">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <span>{vehicle.color}</span>
                      </div>
                    )}
                    {vehicle.plate_number && (
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{vehicle.plate_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {vehicle.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {vehicle.description}
                    </p>
                  )}

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4 pt-4 border-t border-border">
                    {vehicle.has_wifi && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs">
                        <Wifi className="h-3 w-3" /> Wi-Fi
                      </span>
                    )}
                    {vehicle.has_air_conditioning && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs">
                        <Wind className="h-3 w-3" /> Konditsioner
                      </span>
                    )}
                    {vehicle.has_tv && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs">
                        <Tv className="h-3 w-3" /> Televizor
                      </span>
                    )}
                    {vehicle.has_toilet && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs">
                        <ShowerHead className="h-3 w-3" /> Hojatxona
                      </span>
                    )}
                  </div>

                  {/* Driver Info */}
                  {(vehicle.driver_name || vehicle.driver_phone) && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Haydovchi</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{vehicle.driver_name}</span>
                        {vehicle.driver_phone && (
                          <a
                            href={`tel:${vehicle.driver_phone}`}
                            className="inline-flex items-center gap-1 text-primary text-sm hover:text-primary/80"
                          >
                            <Phone className="h-4 w-4" />
                            {vehicle.driver_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Hozircha transport vositalari mavjud emas</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TransportPage;
