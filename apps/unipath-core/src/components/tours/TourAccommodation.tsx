import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Bus, Loader2 } from "lucide-react";
import HotelCard from "./HotelCard";
import VehicleCard from "./VehicleCard";

interface TourAccommodationProps {
  tourId: string;
}

// UUID validation function
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const TourAccommodation = ({ tourId }: TourAccommodationProps) => {
  // Only fetch if tourId is a valid UUID (database tour)
  const isDbTour = isValidUUID(tourId);

  // Fetch tour hotels
  const { data: tourHotels, isLoading: hotelsLoading } = useQuery({
    queryKey: ["tour-hotels", tourId],
    queryFn: async () => {
      if (!isDbTour) return [];
      
      const { data, error } = await supabase
        .from("tour_hotels")
        .select(`
          id,
          room_type,
          nights,
          check_in_date,
          check_out_date,
          hotel:hotels(*)
        `)
        .eq("tour_id", tourId);

      if (error) throw error;
      return data;
    },
    enabled: isDbTour,
  });

  // Fetch tour vehicles
  const { data: tourVehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["tour-vehicles", tourId],
    queryFn: async () => {
      if (!isDbTour) return [];
      
      const { data, error } = await supabase
        .from("tour_vehicles")
        .select(`
          id,
          departure_time,
          arrival_time,
          pickup_location,
          dropoff_location,
          vehicle:vehicles(*)
        `)
        .eq("tour_id", tourId);

      if (error) throw error;
      return data;
    },
    enabled: isDbTour,
  });

  const isLoading = hotelsLoading || vehiclesLoading;
  const hasHotels = tourHotels && tourHotels.length > 0;
  const hasVehicles = tourVehicles && tourVehicles.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasHotels && !hasVehicles) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Hotels Section */}
      {hasHotels && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Mehmonxonalar</h2>
              <p className="text-sm text-muted-foreground">Sayohat davomida turar joylar</p>
            </div>
          </div>
          <div className="space-y-4">
            {tourHotels.map((th) => (
              <HotelCard
                key={th.id}
                tourHotel={{
                  hotel: th.hotel as any,
                  room_type: th.room_type || undefined,
                  nights: th.nights || undefined,
                  check_in_date: th.check_in_date || undefined,
                  check_out_date: th.check_out_date || undefined,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vehicles Section */}
      {hasVehicles && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Transport</h2>
              <p className="text-sm text-muted-foreground">Sayohat uchun transport vositalari</p>
            </div>
          </div>
          <div className="space-y-4">
            {tourVehicles.map((tv) => (
              <VehicleCard
                key={tv.id}
                tourVehicle={{
                  vehicle: tv.vehicle as any,
                  departure_time: tv.departure_time || undefined,
                  arrival_time: tv.arrival_time || undefined,
                  pickup_location: tv.pickup_location || undefined,
                  dropoff_location: tv.dropoff_location || undefined,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourAccommodation;
