import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { tours, formatPrice } from "@/data/tours";
import { useWishlist } from "@/hooks/useWishlist";
import TourActions from "@/components/tours/TourActions";
import { MapPin, Clock, Star, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const WishlistPage = () => {
  const { wishlist, isInWishlist } = useWishlist();

  const wishlistTours = tours.filter((tour) => wishlist.includes(tour.id));

  return (
    <Layout>
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-8 w-8 fill-primary-foreground" />
            <h1 className="text-3xl md:text-4xl font-bold">Sevimlilar</h1>
          </div>
          <p className="text-primary-foreground/80">
            Siz saqlab qo'ygan turlar ro'yxati
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {wishlistTours.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sevimlilar bo'sh</h2>
            <p className="text-muted-foreground mb-6">
              Siz hali hech qanday turni sevimlilarga qo'shmagansiz
            </p>
            <Button asChild>
              <Link to="/tours">Turlarni ko'rish</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              {wishlistTours.length} ta tur saqlangan
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistTours.map((tour) => (
                <Link
                  key={tour.id}
                  to={`/tours/${tour.id}`}
                  className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all"
                >
                  <div className="relative">
                    <img
                      src={tour.image}
                      alt={tour.title}
                      className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <TourActions
                      tourId={tour.id}
                      tourTitle={tour.title}
                      variant="card"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{tour.destination}, {tour.country}</span>
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {tour.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{tour.duration.days} kun</span>
                        <Star className="h-4 w-4 fill-accent text-accent ml-2" />
                        <span>{tour.rating}</span>
                      </div>
                      <span className="font-bold text-primary">
                        {formatPrice(tour.price)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default WishlistPage;
