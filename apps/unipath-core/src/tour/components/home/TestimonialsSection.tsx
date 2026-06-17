import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TestimonialsSection = () => {
  const { data: reviews = [] } = useQuery({
    queryKey: ["home-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, tours(title, destination)")
        .eq("is_approved", true)
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const fallbackTestimonials = [
    { id: "1", comment: "UniTour bilan Dubayga sayohat ajoyib tajriba bo'ldi! Transfer, mehmonxona, ekskursiyalar — hammasi oldindan rejalashtirilgan. Biz faqat dam oldik!", rating: 5, tour: "Dubay — Hashamatli Dam Olish", name: "Aziz Murodov" },
    { id: "2", comment: "Samarqandga oilaviy tur juda zo'r o'tdi. Gid juda bilimdon edi, bolalar ham Registon va Shohizinda kompleksidan hayratda qolishdi!", rating: 5, tour: "Samarqand — Qadimiy Shahar Sayohati", name: "Nilufar Karimova" },
    { id: "3", comment: "Narxlari shaffof, yashirin to'lovlar yo'q. Online bron qilish juda qulay. Keyingi safar ham albatta UniTour bilan!", rating: 5, tour: "Istanbul — Ikki Qit'a Sayohati", name: "Sardor Toshmatov" },
  ];

  const displayData = reviews.length > 0
    ? reviews.map((r: any) => ({
        id: r.id,
        comment: r.comment || "Ajoyib tajriba!",
        rating: r.rating,
        tour: r.tours?.title || "Tur",
        name: "Sayohatchi",
      }))
    : fallbackTestimonials;

  return (
    <section className="py-16 md:py-24">
      <div className="container-custom">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4"
          >
            Mijozlar Fikrlari
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            Sayohatchilar Nima Deydi?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="section-subtitle mx-auto mt-3"
          >
            50+ mamnun sayohatchilarimizdan ayrimlari
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayData.slice(0, 3).map((item: any, index: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative p-6 rounded-2xl bg-card border border-border/50 hover:shadow-lg transition-all duration-300"
            >
              <Quote className="h-8 w-8 text-primary/10 absolute top-4 right-4" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < item.rating ? "fill-accent text-accent" : "text-border"}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-4">
                "{item.comment}"
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.tour}</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                  Tasdiqlangan
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
