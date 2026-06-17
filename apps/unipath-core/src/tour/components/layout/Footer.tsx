import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Facebook, Send, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/unitour-logo.png";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground text-background">
      {/* UniPath banner */}
      <div className="bg-primary/10 border-b border-primary/20 py-3">
        <div className="container-custom">
          <a
            href="https://unipath.me"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="text-sm md:text-base text-background/80">
              🎓 <strong>UniPath</strong> — Xorijda ta'lim olish uchun eng yaxshi yo'l
            </span>
            <span className="text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-medium">
              unipath.me →
            </span>
          </a>
        </div>
      </div>

      <div className="container-custom py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
          {/* Brand */}
          <div className="space-y-5">
            <img src={logo} alt="UniTour" className="h-12 w-auto brightness-0 invert" />
            <p className="text-background/50 text-sm leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: "https://instagram.com/unitour.uz", label: "Instagram" },
                { icon: Facebook, href: "https://facebook.com/unitour.uz", label: "Facebook" },
                { icon: Send, href: "https://t.me/unitour_uz", label: "Telegram" },
                { icon: MessageCircle, href: "https://wa.me/998505540605", label: "WhatsApp" },
              ].map(({ icon: Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center text-background/50 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-base mb-5 text-background">Platforma</h4>
            <ul className="space-y-3">
              {[
                { href: "/#features", label: "Imkoniyatlar" },
                { href: "/#pricing", label: "Narxlar" },
                { href: "/register-company", label: "Bepul boshlash" },
                { href: "/about", label: t("nav.about") || "Biz haqimizda" },
                { href: "/contact", label: t("nav.contact") || "Aloqa" },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-background/50 hover:text-primary text-sm transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Companies */}
          <div>
            <h4 className="font-semibold text-base mb-5 text-background">Tour kompaniyalar uchun</h4>
            <ul className="space-y-3 text-sm text-background/50">
              <li>O'z brendingiz bilan sayt</li>
              <li>Buyurtmalarni boshqarish</li>
              <li>Telegram bot integratsiyasi</li>
              <li>To'lov va analitika</li>
              <li>Mijozlarga aloqa kanallari</li>
            </ul>
          </div>

          {/* Contact & Quick Connect */}
          <div>
            <h4 className="font-semibold text-base mb-5 text-background">{t("footer.contactUs")}</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-background/50 text-sm">
                <div className="w-9 h-9 rounded-xl bg-background/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                Toshkent, O'zbekiston
              </li>
              <li>
                <a
                  href="tel:+998505540605"
                  className="flex items-center gap-3 text-background/50 hover:text-primary text-sm transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-background/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  +998 50 554 06 05
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@unitour.uz"
                  className="flex items-center gap-3 text-background/50 hover:text-primary text-sm transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-background/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  info@unitour.uz
                </a>
              </li>
            </ul>

            {/* Quick connect buttons */}
            <div className="mt-5 space-y-2">
              <p className="text-xs text-background/30 font-medium uppercase tracking-wider">Tez bog'lanish</p>
              <div className="flex gap-2">
                <a
                  href="https://t.me/unitour_uz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0088cc]/20 text-[#0088cc] hover:bg-[#0088cc]/30 text-xs font-medium transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  Telegram
                </a>
                <a
                  href="https://wa.me/998505540605"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 text-xs font-medium transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-10 border-background/10" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/40">
          <p>© 2026 UniTour. {t("footer.rights")}</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors">{t("footer.privacy")}</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
