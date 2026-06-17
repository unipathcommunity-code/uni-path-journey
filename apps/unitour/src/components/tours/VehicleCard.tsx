import { Bus, Car, Train, Plane, Users, Wind, Wifi, Tv, Bath, Phone, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Vehicle {
  id: string;
  name: string;
  vehicle_type: "car" | "minibus" | "bus" | "train" | "plane";
  brand?: string;
  model?: string;
  color?: string;
  capacity: number;
  plate_number?: string;
  has_air_conditioning?: boolean;
  has_wifi?: boolean;
  has_tv?: boolean;
  has_toilet?: boolean;
  driver_name?: string;
  driver_phone?: string;
  description?: string;
  image?: string;
}

interface TourVehicle {
  vehicle: Vehicle;
  departure_time?: string;
  arrival_time?: string;
  pickup_location?: string;
  dropoff_location?: string;
}

interface VehicleCardProps {
  tourVehicle: TourVehicle;
}

const vehicleIcons = {
  car: Car,
  minibus: Bus,
  bus: Bus,
  train: Train,
  plane: Plane,
};

const vehicleTypeLabels = {
  car: "Avtomobil",
  minibus: "Mikroavtobus",
  bus: "Avtobus",
  train: "Poyezd",
  plane: "Samolyot",
};

const VehicleCard = ({ tourVehicle }: VehicleCardProps) => {
  const { vehicle, departure_time, arrival_time, pickup_location, dropoff_location } = tourVehicle;
  const VehicleIcon = vehicleIcons[vehicle.vehicle_type] || Bus;

  const features = [
    { icon: Wind, label: "Konditsioner", available: vehicle.has_air_conditioning },
    { icon: Wifi, label: "Wi-Fi", available: vehicle.has_wifi },
    { icon: Tv, label: "TV", available: vehicle.has_tv },
    { icon: Bath, label: "Hojatxona", available: vehicle.has_toilet },
  ].filter(f => f.available);

  const formatDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return null;
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }),
      time: date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const departure = formatDateTime(departure_time);
  const arrival = formatDateTime(arrival_time);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image or Icon */}
        <div className="md:w-1/4 bg-muted flex items-center justify-center p-8">
          {vehicle.image ? (
            <img
              src={vehicle.image}
              alt={vehicle.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <VehicleIcon className="h-16 w-16 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                <Badge variant="secondary">
                  {vehicleTypeLabels[vehicle.vehicle_type]}
                </Badge>
              </div>
              {(vehicle.brand || vehicle.model) && (
                <p className="text-sm text-muted-foreground">
                  {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                </p>
              )}
            </div>
            {vehicle.color && (
              <Badge variant="outline" className="capitalize">
                {vehicle.color} rangli
              </Badge>
            )}
          </div>

          {/* Capacity & Plate */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{vehicle.capacity} o'rindiq</span>
            </div>
            {vehicle.plate_number && (
              <Badge variant="outline" className="font-mono">
                {vehicle.plate_number}
              </Badge>
            )}
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-3 mb-4">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <feature.icon className="h-4 w-4" />
                <span>{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Schedule */}
          {(departure || arrival) && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {departure && (
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Jo'nash</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{departure.time}</span>
                      <span className="text-sm text-muted-foreground">{departure.date}</span>
                    </div>
                    {pickup_location && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{pickup_location}</span>
                      </div>
                    )}
                  </div>
                )}
                {arrival && (
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Kelish</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-success" />
                      <span className="font-semibold">{arrival.time}</span>
                      <span className="text-sm text-muted-foreground">{arrival.date}</span>
                    </div>
                    {dropoff_location && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{dropoff_location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Driver Info */}
          {vehicle.driver_name && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Haydovchi:</span>
              <span className="font-medium">{vehicle.driver_name}</span>
              {vehicle.driver_phone && (
                <a
                  href={`tel:${vehicle.driver_phone}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {vehicle.driver_phone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
