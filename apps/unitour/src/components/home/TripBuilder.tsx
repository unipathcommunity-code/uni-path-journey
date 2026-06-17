import { useState } from "react";
import { Hotel, Users, Bus, UtensilsCrossed, Check, ArrowRight, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface Service {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  price: number;
  enabled: boolean;
}

const TripBuilder = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [services, setServices] = useState<Service[]>([
    { id: "hotel", icon: Hotel, label: "Mehmonxona", description: "4-5 yulduzli mehmonxona", price: 850000, enabled: true },
    { id: "guide", icon: Users, label: "Gid xizmati", description: "Professional gid", price: 300000, enabled: false },
    { id: "transport", icon: Bus, label: "Transport", description: "Qulay avtobus yoki avto", price: 450000, enabled: true },
    { id: "meals", icon: UtensilsCrossed, label: "Ovqatlanish", description: "Nonushta + Tushlik", price: 250000, enabled: false },
  ]);

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const activeServices = services.filter((s) => s.enabled);
  const totalPrice = activeServices.reduce((sum, s) => sum + s.price, 0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container-custom">
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4"
          >
            Interaktiv Narx Kalkulyator
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            Sayohatingizni O'zingiz Yarating
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="section-subtitle mx-auto mt-3"
          >
            Xizmatlarni tanlang — narx avtomatik hisoblanadi. Shaffof, yashirin to'lovsiz.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Service toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {services.map((service, index) => (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                onClick={() => toggleService(service.id)}
                className={`relative flex items-start gap-4 p-5 rounded-3xl border-2 transition-all duration-200 text-left ${
                  service.enabled
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    service.enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <service.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{service.label}</h3>
                    {service.enabled && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                  <p className="text-sm font-semibold text-primary mt-1.5">{formatPrice(service.price)}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Transparency Card — Price Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-card border border-border overflow-hidden"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/40">
              <Receipt className="h-5 w-5 text-accent" />
              <h4 className="font-semibold text-foreground">Xarajatlar Taqsimoti</h4>
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {activeServices.length} ta xizmat tanlangan
              </span>
            </div>

            {/* Line items */}
            <div className="px-6 py-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {activeServices.length > 0 ? (
                  activeServices.map((service) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                          <service.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-foreground font-medium">{service.label}</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{formatPrice(service.price)}</span>
                    </motion.div>
                  ))
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-muted-foreground text-sm py-4"
                  >
                    Xizmatlarni tanlang
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Total */}
            <div className="px-6 py-5 bg-primary/5 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Umumiy narx</span>
                <span className="text-2xl md:text-3xl font-bold text-foreground font-display">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <Button
                onClick={() => navigate("/custom-tour")}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl py-6 text-base font-semibold"
              >
                Turni Buyurtma Qiling
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TripBuilder;
