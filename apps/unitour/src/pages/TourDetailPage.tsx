import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  MapPin, Clock, Star, Users, Check, X, Calendar,
  ChevronLeft, ChevronRight, Phone, Building2, UserCheck,
  UsersRound, Home, Shield, CreditCard, Loader2, Zap,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { formatPrice, formatPriceUSD } from "@/data/tours";
import TourAccommodation from "@/components/tours/TourAccommodation";
import TourActions from "@/components/tours/TourActions";
import TourReviews from "@/components/tours/TourReviews";
import DestinationHotels from "@/components/tours/DestinationHotels";
import BackButton from "@/components/common/BackButton";
import UrgencyBadge from "@/components/conversion/UrgencyBadge";
import TrustSection from "@/components/conversion/TrustSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

type BookingType = "group" | "individual" | "family";

const DEPOSIT_AMOUNT = 10; // USD

const tourTypeLabels: Record<string, string> = {
  family: "Oilaviy",
  group: "Guruh",
  luxury: "Hashamatli",
  budget: "Arzon",
  adventure: "Sarguzasht",
};

const TourDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: tour, isLoading } = useQuery({
    queryKey: ["tour", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: itineraries = [] } = useQuery({
    queryKey: ["tour-itineraries", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_itineraries")
        .select("*")
        .eq("tour_id", id!)
        .order("day");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: inclusions = [] } = useQuery({
    queryKey: ["tour-inclusions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_inclusions")
        .select("*")
        .eq("tour_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Count bookings for this tour (social proof)
  const { data: bookingCount = 0 } = useQuery({
    queryKey: ["tour-booking-count", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("tour_id", id!);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!id,
  });

  const [bookingType, setBookingType] = useState<BookingType>("family");
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [guests, setGuests] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!tour) {
    return (
      <Layout>
        <div className="container-custom py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Tur topilmadi</h1>
          <Button onClick={() => navigate("/tours")}>Turlarga qaytish</Button>
        </div>
      </Layout>
    );
  }

  const images = tour.gallery?.length ? tour.gallery : [tour.image || "/placeholder.svg"];
  const includedItems = inclusions.filter((i) => i.included);
  const excludedItems = inclusions.filter((i) => !i.included);
  const totalPrice = tour.price * guests;
  const seatsLeft = Math.max(2, (tour.max_people || 20) - bookingCount);

  const handleBooking = () => {
    const dateToUse = customDate?.toISOString().split("T")[0];
    if (!dateToUse) {
      alert("Iltimos, sanani tanlang");
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref");
    const refQuery = refParam ? `&ref=${refParam}` : "";
    navigate(`/booking/${tour.id}?date=${dateToUse}&guests=${guests}&type=${bookingType}${refQuery}`);
  };

  const bookingTypes = [
    { id: "group" as BookingType, label: "Guruh bilan", description: "Biz belgilagan sanada, guruh bilan sayohat", icon: UsersRound },
    { id: "individual" as BookingType, label: "Yakka o'zim", description: "O'zingiz tanlagan sanada, individual sayohat", icon: UserCheck },
    { id: "family" as BookingType, label: "Oilam bilan", description: "O'zingiz tanlagan sanada, oila bilan sayohat", icon: Home },
  ];

  return (
    <Layout>
      <div className="bg-muted/30 py-4">
        <div className="container-custom">
          <BackButton className="mb-2" />
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Bosh sahifa</Link>
            <span>/</span>
            <Link to="/tours" className="hover:text-foreground">Turlar</Link>
            <span>/</span>
            <span className="text-foreground">{tour.title}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={images[currentImage]}
                alt={tour.title}
                className="w-full aspect-[16/10] object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((p) => (p === 0 ? images.length - 1 : p - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((p) => (p === images.length - 1 ? 0 : p + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                {tour.featured && (
                  <Badge className="bg-accent text-accent-foreground">⭐ Tavsiya</Badge>
                )}
                {tour.tour_type && (
                  <Badge variant="secondary">{tourTypeLabels[tour.tour_type] || tour.tour_type}</Badge>
                )}
                {tour.original_price && tour.original_price > tour.price && (
                  <Badge className="bg-destructive text-destructive-foreground">
                    -{Math.round(((tour.original_price - tour.price) / tour.original_price) * 100)}% chegirma
                  </Badge>
                )}
              </div>
              {/* Social proof badge */}
              <div className="absolute bottom-4 left-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 text-sm"
                >
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">{bookingCount + 12} kishi band qilgan</span>
                </motion.div>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={cn(
                      "flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors",
                      currentImage === idx ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Meta */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>{tour.destination}, {tour.country}</span>
                </div>
                <TourActions tourId={tour.id} tourTitle={tour.title} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{tour.title}</h1>
              {tour.description && (
                <p className="text-muted-foreground mb-4">{tour.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-semibold">{Number(tour.rating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({tour.review_count || 0} sharh)</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>{tour.duration_days} kun / {tour.duration_nights} tun</span>
                </div>
                {tour.max_people && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span>Maks. {tour.max_people} kishi</span>
                  </div>
                )}
              </div>
            </div>

            {/* Itinerary */}
            {itineraries.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Kun bo'yicha marshrut</h2>
                <div className="space-y-4">
                  {itineraries.map((day) => (
                    <div key={day.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold">
                        {day.day}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{day.title}</h3>
                        {day.description && <p className="text-muted-foreground text-sm">{day.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Included / Excluded */}
            {(includedItems.length > 0 || excludedItems.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6">
                {includedItems.length > 0 && (
                  <div className="bg-accent/10 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4 text-accent-foreground">✓ Narxga kiritilgan</h3>
                    <ul className="space-y-3">
                      {includedItems.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{item.item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {excludedItems.length > 0 && (
                  <div className="bg-destructive/10 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4 text-destructive">✗ Narxga kiritilmagan</h3>
                    <ul className="space-y-3">
                      {excludedItems.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm">
                          <X className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <span>{item.item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <TourAccommodation tourId={tour.id} />
            <DestinationHotels destinationName={tour.destination} />
            <TourReviews tourId={tour.id} rating={Number(tour.rating || 0)} reviewCount={tour.review_count || 0} />

            {/* Trust Section - bottom of content */}
            <TrustSection />

            {/* Operator */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-bold text-lg mb-4">Tur operatori</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">UniTour</h4>
                  <p className="text-sm text-muted-foreground">Litsenziyalangan tur operatori</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    {tour.original_price && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(tour.original_price)}
                      </span>
                    )}
                    <span className="text-3xl font-bold text-primary">
                      {formatPrice(tour.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/ 1 kishi uchun</span>
                    <span className="text-sm font-medium text-primary/70">≈ {formatPriceUSD(tour.price)}</span>
                  </div>
                </div>

                {/* Urgency */}
                <UrgencyBadge seatsLeft={seatsLeft} maxPeople={tour.max_people || 20} />

                <hr className="my-4 border-border" />

                {/* Booking Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-3">Sayohat turi</label>
                  <div className="space-y-2">
                    {bookingTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setBookingType(type.id)}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all",
                          bookingType === type.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <type.icon className={cn("h-5 w-5 mt-0.5", bookingType === type.id ? "text-primary" : "text-muted-foreground")} />
                        <div>
                          <p className={cn("font-medium", bookingType === type.id && "text-primary")}>{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Sanani tanlang
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !customDate && "text-muted-foreground")}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customDate ? format(customDate, "d MMMM yyyy", { locale: uz }) : "Sanani tanlang"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customDate}
                        onSelect={setCustomDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Guests */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    Mehmonlar soni
                  </label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setGuests((g) => Math.max(1, g - 1))} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted">-</button>
                    <span className="text-xl font-semibold">{guests}</span>
                    <button onClick={() => setGuests((g) => Math.min(tour.max_people || 20, g + 1))} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted">+</button>
                  </div>
                </div>

                <hr className="my-4 border-border" />

                {/* Total */}
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Jami:</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
                    <span className="block text-xs text-muted-foreground">≈ {formatPriceUSD(totalPrice)}</span>
                  </div>
                </div>

                {/* Deposit info */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Hozir faqat ${DEPOSIT_AMOUNT} deposit to'lang</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joyingizni band qiling. Qolgan summa keyinroq to'lanadi.
                  </p>
                </div>

                {/* CTA Button */}
                <Button onClick={handleBooking} className="w-full py-6 text-base font-bold relative overflow-hidden group">
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80"
                    initial={false}
                  />
                  <span className="relative flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    ${DEPOSIT_AMOUNT} deposit bilan band qilish
                  </span>
                </Button>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>24 soat ichida qaytarish kafolati</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>Click, Payme yoki naqd to'lov</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>10 daqiqada manager bilan aloqa</span>
                  </div>
                </div>
              </div>

              {/* Phone support */}
              <div className="text-center">
                <a href="tel:+998505540605" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <Phone className="h-4 w-4" />
                  Savol bor? +998 50 554 06 05
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TourDetailPage;
