import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Users, ExternalLink, Loader2, Copy, Share2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

interface Agent {
  id: string;
  name: string;
  company_name: string;
  user_id: string | null;
}

interface AgentTour {
  id: string;
  agent_id: string;
  tour_id: string;
  special_price: number | null;
  notes: string | null;
  tour?: {
    id: string;
    title: string;
    destination: string;
    country: string;
    image: string | null;
    price: number;
    duration_days: number;
    duration_nights: number;
    max_people: number | null;
    tour_type: string | null;
  };
}

const AgentTours = () => {
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: agent } = useQuery({
    queryKey: ["agent-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agents")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data as Agent;
    },
    enabled: !!user?.id,
  });

  const { data: agentTours = [], isLoading } = useQuery({
    queryKey: ["agent-tours", agent?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_tours")
        .select(`
          *,
          tour:tours(*)
        `)
        .eq("agent_id", agent?.id);
      if (error) throw error;
      return data as AgentTour[];
    },
    enabled: !!agent?.id,
  });

  const generateReferralLink = (tourId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/tours/${tourId}?ref=${agent?.id}`;
  };

  const copyReferralLink = async (tourId: string) => {
    const link = generateReferralLink(tourId);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(tourId);
      toast.success("Havola nusxalandi!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Nusxalashda xatolik yuz berdi");
    }
  };

  const shareTour = async (tour: AgentTour["tour"]) => {
    if (!tour) return;
    
    const link = generateReferralLink(tour.id);
    const text = `🌍 ${tour.title}\n📍 ${tour.destination}, ${tour.country}\n📅 ${tour.duration_days} kun / ${tour.duration_nights} tun\n💰 ${tour.price.toLocaleString()} so'm\n\n${link}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: tour.title,
          text: text,
          url: link,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Matn nusxalandi!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Turlarim</h1>
        <p className="text-muted-foreground">
          Siz sotishingiz mumkin bo'lgan turlar ro'yxati
        </p>
      </div>

      {/* Referral Info */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <Share2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Referal havola orqali sotish
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Har bir tur uchun maxsus havola nusxalab, mijozlarga yuboring. 
                Ular shu havola orqali bron qilganda, komissiya avtomatik hisoblanadi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {agentTours.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentTours.map((item) => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="aspect-video relative">
                <img
                  src={item.tour?.image || "/placeholder.svg"}
                  alt={item.tour?.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-primary">
                    {item.tour?.tour_type === "group" ? "Guruh" : 
                     item.tour?.tour_type === "individual" ? "Individual" : item.tour?.tour_type}
                  </Badge>
                </div>
                {item.special_price && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-green-500 text-white">
                      Maxsus narx
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                  {item.tour?.title}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{item.tour?.destination}, {item.tour?.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{item.tour?.duration_days} kun / {item.tour?.duration_nights} tun</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Maks {item.tour?.max_people} kishi</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Narxi</p>
                    <p className="font-bold text-lg">
                      {(item.special_price || item.tour?.price)?.toLocaleString()} so'm
                    </p>
                  </div>
                  <Link to={`/tours/${item.tour?.id}`} target="_blank">
                    <Button size="sm" variant="outline" className="gap-2">
                      Ko'rish
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Referral Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 gap-2"
                    onClick={() => item.tour && copyReferralLink(item.tour.id)}
                  >
                    {copiedId === item.tour?.id ? (
                      <>
                        <Check className="h-4 w-4" />
                        Nusxalandi
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Havolani nusxalash
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareTour(item.tour)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted rounded">
                    {item.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Turlar yo'q</h2>
          <p className="text-muted-foreground">
            Sizga hali turlar biriktirilmagan. Administrator bilan bog'laning.
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentTours;
