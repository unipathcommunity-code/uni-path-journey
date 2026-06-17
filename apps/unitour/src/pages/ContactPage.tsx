import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock, Send, Instagram, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(t("contact.successMessage"));
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    { icon: Phone, title: t("contact.phoneLabel"), value: "+998 50 554 06 05", href: "tel:+998505540605" },
    { icon: Mail, title: t("contact.emailLabel"), value: "info@unitour.uz", href: "mailto:info@unitour.uz" },
    { icon: MapPin, title: t("contact.address"), value: t("contact.addressValue"), href: null },
    { icon: Clock, title: t("contact.workHours"), value: t("contact.workHoursValue"), href: null },
  ];

  const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "https://instagram.com/unitour.uz" },
    { icon: MessageCircle, label: "Telegram", href: "https://t.me/unitour_uz" },
  ];

  return (
    <Layout>
      <div className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container-custom text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("contact.title")}</h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">{t("contact.subtitle")}</p>
        </div>
      </div>

      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-6">{t("contact.sendMessage")}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("contact.yourName")} *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("contact.namePlaceholder")}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("contact.phone")} *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t("contact.phonePlaceholder")}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t("contact.email")}</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t("contact.subject")} *</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={t("contact.subjectPlaceholder")}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t("contact.message")} *</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t("contact.messagePlaceholder")}
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                <Send className="h-4 w-4" />
                {isSubmitting ? t("contact.sending") : t("contact.send")}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">{t("contact.contactInfo")}</h2>

            <div className="space-y-4 mb-8">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-muted rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    {item.href ? (
                      <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-muted-foreground">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold mb-4">{t("contact.socialNetworks")}</h3>
              <div className="flex gap-4">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <link.icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("contact.addressValue")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;