import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Calendar, Users, ArrowRight, GraduationCap, Globe, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-education.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [destination, setDestination] = useState("");

  const handleSearch = () => {
    navigate(`/tours${destination ? `?search=${destination}` : ""}`);
  };

  return (
    <section className="relative min-h-[92vh] flex items-center -mt-20 pt-20">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Education Travel" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
      </div>

      <div className="relative container-custom py-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md text-white rounded-full text-sm font-medium mb-6 border border-white/20">
              <GraduationCap className="h-4 w-4" />
              {t("hero.badge")}
            </span>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              Sayohatni Biz Bilan{" "}
              <span className="text-primary-foreground bg-primary/90 px-4 py-1 rounded-xl inline-block">Boshlang</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-xl leading-relaxed">
              {t("hero.subtitle")}
            </p>
          </motion.div>

          {/* Smart Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="bg-background/95 backdrop-blur-lg rounded-2xl p-3 md:p-4 shadow-xl border border-border/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 pl-1">
                  <MapPin className="inline h-3.5 w-3.5 mr-1" />
                  {t("hero.whereTo")}
                </label>
                <input
                  type="text"
                  placeholder={t("hero.cityOrCountry")}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
                />
              </div>
              <div className="hidden md:block">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 pl-1">
                  <Calendar className="inline h-3.5 w-3.5 mr-1" />
                  {t("hero.when")}
                </label>
                <input
                  type="date"
                  className="px-4 py-3 rounded-xl bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
                />
              </div>
              <div className="hidden md:block">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 pl-1">
                  <Users className="inline h-3.5 w-3.5 mr-1" />
                  {t("hero.howMany")}
                </label>
                <select className="px-4 py-3 rounded-xl bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm appearance-none pr-8">
                  <option>{t("hero.person1")}</option>
                  <option>{t("hero.person2")}</option>
                  <option>{t("hero.person3")}</option>
                  <option>{t("hero.person6")}</option>
                </select>
              </div>

              <Button
                onClick={handleSearch}
                className="rounded-xl px-6 py-3 h-[46px] text-sm font-semibold"
              >
                <Search className="h-4 w-4 mr-2" />
                {t("hero.searchTours")}
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-wrap gap-8 mt-10"
          >
            {[
              { icon: Globe, value: "12+", label: t("hero.statTours") },
              { icon: MapPin, value: "12+", label: t("hero.statDestinations") },
              { icon: Users, value: "50+", label: t("hero.statClients") },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  <p className="text-xs text-white/70">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-white/50">
          <ArrowRight className="h-4 w-4 rotate-90 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
