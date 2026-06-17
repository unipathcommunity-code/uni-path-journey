import { Users, Star, Globe, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const QuickStats = () => {
  const { t } = useTranslation();

  const stats = [
    { icon: Users, value: "50+", label: t("stats.happyTravelers"), color: "bg-primary/10 text-primary" },
    { icon: Globe, value: "12+", label: t("stats.destinations"), color: "bg-accent/10 text-accent" },
    { icon: Star, value: "4.8", label: t("stats.avgRating"), color: "bg-gold/10 text-gold" },
    { icon: Award, value: "100%", label: t("stats.serviceGuarantee"), color: "bg-success/10 text-success" },
  ];

  return (
    <section className="py-14 bg-muted/30">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${stat.color.split(' ')[0]} mb-4`}>
                <stat.icon className={`h-6 w-6 ${stat.color.split(' ')[1]}`} />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1 font-display">
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickStats;
