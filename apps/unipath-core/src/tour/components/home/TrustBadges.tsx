import { ShieldCheck, CreditCard, Headphones, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const badges = [
  { icon: ShieldCheck, label: "Kafolatlangan xavfsizlik" },
  { icon: CreditCard, label: "Qulay to'lov usullari" },
  { icon: Headphones, label: "24/7 qo'llab-quvvatlash" },
  { icon: RotateCcw, label: "Bepul bekor qilish" },
];

const TrustBadges = () => {
  return (
    <section className="py-5 border-y border-border/40 bg-background">
      <div className="container-custom">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-14">
          {badges.map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <badge.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs md:text-sm font-medium text-muted-foreground">{badge.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
