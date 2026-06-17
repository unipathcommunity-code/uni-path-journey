import { Link } from "react-router-dom";
import { Check, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: 0,
    description: "Boshlash uchun ideal — to'liq funksional sayt va asosiy CRM.",
    features: [
      "5 ta tour",
      "Subdomain (kompaniyangiz.unitour.me)",
      "Brending sozlamalari",
      "Lead form va chat",
      "Asosiy analitika",
    ],
    cta: "Bepul boshlash",
    highlight: false,
  },
  {
    name: "Pro",
    price: 29,
    description: "O'sib borayotgan kompaniyalar uchun — barcha funksiyalar.",
    features: [
      "Cheksiz tour",
      "Custom domen (o'z domeningiz)",
      "Telegram bot integratsiya",
      "AI yordamchi",
      "Kengaytirilgan analitika",
      "Ustuvor qo'llab-quvvatlash",
    ],
    cta: "Pro'ga o'tish",
    highlight: true,
  },
  {
    name: "Premium",
    price: 99,
    description: "Yirik tour operatorlari uchun — eksklyuziv huquqlar.",
    features: [
      "Pro'ning hammasi",
      "Asosiy sahifada tavsiya",
      "Pastroq komissiya (5%)",
      "Shaxsiy menejer",
      "API kirish",
      "Custom integratsiyalar",
    ],
    cta: "Premium'ga o'tish",
    highlight: false,
  },
];

const PricingPlans = () => {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-muted/30">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Oddiy va shaffof narxlar</h2>
          <p className="text-lg text-muted-foreground">
            Bepul rejada boshlang — istalgan vaqt yuqori rejaga o'ting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 border-2 transition-all ${
                plan.highlight
                  ? "border-primary bg-card shadow-2xl shadow-primary/20 scale-105"
                  : "border-primary/10 bg-card hover:border-primary/30"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                  <Flame className="h-3 w-3" />
                  Eng mashhur
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">{plan.description}</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/oy</span>
              </div>
              <Link to="/register-company">
                <Button
                  className={`w-full rounded-xl h-12 font-semibold mb-6 ${
                    plan.highlight ? "bg-primary hover:bg-primary/90" : "bg-foreground/90 hover:bg-foreground"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
