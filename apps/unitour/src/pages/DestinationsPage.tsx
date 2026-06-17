import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import DestinationCarousel from "@/components/destinations/DestinationCarousel";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Globe, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  image: string | null;
  tour_count: number | null;
}

const DestinationsPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Destination[];
    },
  });

  const uzbekDestinations = destinations.filter((d) => d.region === "uzbekistan");
  const asiaDestinations = destinations.filter((d) => d.region === "asia");
  const europeDestinations = destinations.filter((d) => d.region === "europe");
  const arabDestinations = destinations.filter((d) => d.region === "arab");
  const internationalDestinations = destinations.filter((d) => d.region !== "uzbekistan");

  const stats = [
    { label: "O'zbekiston", count: uzbekDestinations.length, icon: Building2 },
    { label: "Xorijiy davlatlar", count: internationalDestinations.length, icon: Globe },
    { label: "Jami turlar", count: destinations.reduce((sum, d) => sum + (d.tour_count || 0), 0), icon: MapPin },
  ];

  return (
    <Layout>
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=1920')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              🌍 Sayohat Yo'nalishlari
            </h1>
            <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl">
              O'zbekistonning go'zal shaharlari va dunyoning eng mashhur sayohat joylarini kashf eting
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-xl">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
              >
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-white/80" />
                <p className="text-2xl md:text-3xl font-bold text-white">{stat.count}</p>
                <p className="text-white/70 text-xs md:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container-custom py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="all" className="gap-2">
              <Globe className="h-4 w-4" />
              Barchasi
            </TabsTrigger>
            <TabsTrigger value="uzbekistan" className="gap-2">
              🇺🇿 O'zbekiston
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Uzbekistan Section */}
                <DestinationCarousel
                  destinations={uzbekDestinations}
                  title="O'zbekiston"
                  emoji="🇺🇿"
                  autoPlay
                  interval={5000}
                />

                {/* Asia Section */}
                <DestinationCarousel
                  destinations={asiaDestinations}
                  title="Osiyo"
                  emoji="🌏"
                  autoPlay
                  interval={4500}
                />

                {/* Europe Section */}
                <DestinationCarousel
                  destinations={europeDestinations}
                  title="Yevropa"
                  emoji="🇪🇺"
                  autoPlay
                  interval={4000}
                />

                {/* Arab Section */}
                <DestinationCarousel
                  destinations={arabDestinations}
                  title="Arab davlatlari"
                  emoji="🕌"
                  autoPlay
                  interval={4500}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="uzbekistan">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {uzbekDestinations.map((dest) => (
                  <Link
                    key={dest.id}
                    to={`/tours?destination=${dest.id}`}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <img
                      src={dest.image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800"}
                      alt={dest.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                        {dest.name}
                      </h3>
                      <p className="text-white/80 text-sm mb-2">{dest.country}</p>
                      <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                        {dest.tour_count || 0} tur mavjud
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/50 py-12">
        <div className="container-custom text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            O'zingizga mos tur topa olmadingizmi?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Bizning mutaxassislarimiz sizga individual sayohat rejasini tuzib berishadi
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Biz bilan bog'lanish
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default DestinationsPage;
