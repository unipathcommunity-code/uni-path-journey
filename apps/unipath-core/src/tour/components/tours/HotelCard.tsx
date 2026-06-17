import { Star, Wifi, Utensils, Car, Waves, Dumbbell, Flower, Wind, MapPin, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Hotel {
  id: string;
  name: string;
  address?: string;
  star_rating?: number;
  room_count?: number;
  has_restaurant?: boolean;
  has_wifi?: boolean;
  has_parking?: boolean;
  has_pool?: boolean;
  has_gym?: boolean;
  has_spa?: boolean;
  has_air_conditioning?: boolean;
  breakfast_included?: boolean;
  lunch_included?: boolean;
  dinner_included?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  description?: string;
  image?: string;
}

interface TourHotel {
  hotel: Hotel;
  room_type?: string;
  nights?: number;
  check_in_date?: string;
  check_out_date?: string;
}

interface HotelCardProps {
  tourHotel: TourHotel;
}

const HotelCard = ({ tourHotel }: HotelCardProps) => {
  const { hotel, room_type, nights } = tourHotel;

  const amenities = [
    { icon: Wifi, label: "Wi-Fi", available: hotel.has_wifi },
    { icon: Utensils, label: "Restoran", available: hotel.has_restaurant },
    { icon: Car, label: "Parking", available: hotel.has_parking },
    { icon: Waves, label: "Basseyn", available: hotel.has_pool },
    { icon: Dumbbell, label: "Sport zal", available: hotel.has_gym },
    { icon: Flower, label: "SPA", available: hotel.has_spa },
    { icon: Wind, label: "Konditsioner", available: hotel.has_air_conditioning },
  ].filter(a => a.available);

  const mealInfo = [];
  if (hotel.breakfast_included) mealInfo.push("Nonushta");
  if (hotel.lunch_included) mealInfo.push("Tushlik");
  if (hotel.dinner_included) mealInfo.push("Kechki ovqat");

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-1/3 aspect-video md:aspect-auto">
          <img
            src={hotel.image || "/placeholder.svg"}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold text-lg">{hotel.name}</h3>
              {hotel.address && (
                <p className="text-sm text-muted-foreground">{hotel.address}</p>
              )}
            </div>
            {hotel.star_rating && (
              <div className="flex items-center gap-1">
                {[...Array(hotel.star_rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
            )}
          </div>

          {/* Room Info */}
          <div className="flex flex-wrap gap-2 mb-4">
            {room_type && (
              <Badge variant="secondary" className="capitalize">
                {room_type === "standard" && "Standart xona"}
                {room_type === "deluxe" && "Deluxe xona"}
                {room_type === "suite" && "Suite xona"}
                {room_type === "family" && "Oilaviy xona"}
                {!["standard", "deluxe", "suite", "family"].includes(room_type) && room_type}
              </Badge>
            )}
            {nights && (
              <Badge variant="outline">
                {nights} tun
              </Badge>
            )}
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-3 mb-4">
            {amenities.map((amenity) => (
              <div
                key={amenity.label}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <amenity.icon className="h-4 w-4" />
                <span>{amenity.label}</span>
              </div>
            ))}
          </div>

          {/* Meals */}
          {mealInfo.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Utensils className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">
                {mealInfo.join(", ")} kiritilgan
              </span>
            </div>
          )}

          {/* Check-in/out times */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Kirish: {hotel.check_in_time?.slice(0, 5) || "14:00"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Chiqish: {hotel.check_out_time?.slice(0, 5) || "12:00"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
