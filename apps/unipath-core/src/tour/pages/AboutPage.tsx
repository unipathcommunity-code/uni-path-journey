import Layout from "@/components/layout/Layout";
import { Users, Award, Globe, Heart, Phone, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

const AboutPage = () => {
  const { t } = useTranslation();

  const stats = [
    { value: "50+", label: t("about.happyClients") },
    { value: "12+", label: t("about.tourPackages") },
    { value: "12+", label: t("about.directions") },
    { value: "3+", label: t("about.partnerOperators") },
  ];

  const values = [
    { icon: Users, title: t("about.transparency"), description: t("about.transparencyDesc") },
    { icon: Award, title: t("about.quality"), description: t("about.qualityDesc") },
    { icon: Globe, title: t("about.experience"), description: t("about.experienceDesc") },
    { icon: Heart, title: t("about.care"), description: t("about.careDesc") },
  ];

  return (
    <Layout>
      <div className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container-custom text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">{t("about.title")}</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">{t("about.subtitle")}</p>
        </div>
      </div>

      <div className="py-12 bg-muted">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-card rounded-xl border border-border">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">{t("about.ourMission")}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">{t("about.missionText")}</p>
          </div>
        </div>
      </div>

      <div className="py-16 md:py-24 bg-muted">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t("about.ourValues")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-card p-6 rounded-xl border border-border text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
                  <value.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 md:py-24">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t("about.ourTeam")}</h2>
          <div className="max-w-md mx-auto text-center">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-1">Hasanov Behruz</h3>
            <p className="text-primary font-medium mb-3">{t("about.founderRole")}</p>
            <p className="text-muted-foreground">{t("about.founderDesc")}</p>
          </div>
        </div>
      </div>

      <div className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container-custom text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">{t("about.contactUs")}</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">{t("about.contactUsDesc")}</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="tel:+998505540605"
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary-foreground/90 transition-colors"
            >
              <Phone className="h-5 w-5" />
              +998 50 554 06 05
            </a>
            <a
              href="mailto:info@unitour.uz"
              className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 px-6 py-3 rounded-lg font-medium hover:bg-primary-foreground/20 transition-colors"
            >
              <Mail className="h-5 w-5" />
              info@unitour.uz
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;