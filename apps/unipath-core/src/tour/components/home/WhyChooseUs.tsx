import { Shield, Eye, Clock, HeadphonesIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const WhyChooseUs = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Eye,
      title: t("whyUs.transparency"),
      description: t("whyUs.transparencyDesc"),
    },
    {
      icon: Shield,
      title: t("whyUs.reliable"),
      description: t("whyUs.reliableDesc"),
    },
    {
      icon: Clock,
      title: t("whyUs.fastBooking"),
      description: t("whyUs.fastBookingDesc"),
    },
    {
      icon: HeadphonesIcon,
      title: t("whyUs.support"),
      description: t("whyUs.supportDesc"),
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-primary">
      <div className="container-custom">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-white/15 text-white text-sm font-semibold mb-4"
          >
            Eng Ma'qul Narx Kafolati
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 font-display"
          >
            {t("whyUs.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-primary-foreground/70 max-w-2xl mx-auto text-lg"
          >
            {t("whyUs.subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors duration-300"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 mb-5">
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-primary-foreground">{feature.title}</h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
