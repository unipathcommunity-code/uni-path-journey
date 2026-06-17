import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, Search, LogOut, LayoutDashboard, Heart, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import SearchModal from "@/components/search/SearchModal";
import NotificationBell from "@/components/notifications/NotificationBell";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import logo from "@/assets/unitour-logo-new.png";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { wishlist } = useWishlist();
  const { t } = useTranslation();

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/#features", label: "Imkoniyatlar" },
    { href: "/#pricing", label: "Narxlar" },
    { href: "/about", label: t("nav.about") || "Biz haqimizda" },
    { href: "/contact", label: t("nav.contact") || "Aloqa" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (userRole === "super_admin" || userRole === "admin") return "/admin";
    if (userRole === "moderator") return "/operator";
    if (userRole === "company_owner" || userRole === "company_staff") return "/company";
    return "/dashboard";
  };

  const getDashboardLabel = () => {
    if (userRole === "super_admin" || userRole === "admin") return t("nav.adminPanel");
    if (userRole === "moderator") return t("nav.operatorPanel");
    if (userRole === "company_owner" || userRole === "company_staff") return "Kompaniya paneli";
    return t("nav.dashboard");
  };

  const showTransparent = isHomePage && !scrolled && !isOpen;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        showTransparent
          ? "bg-transparent border-b border-transparent"
          : "bg-background/80 backdrop-blur-xl border-b border-primary/10 shadow-lg shadow-primary/5"
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logo} alt="UniTour" className="h-9 md:h-11 w-auto transition-transform group-hover:scale-105" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive(link.href)
                    ? "text-primary"
                    : showTransparent
                    ? "text-white/85 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-xl transition-all ${showTransparent ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>

            <LanguageSwitcher />

            {user && <NotificationBell />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`gap-2 rounded-xl ml-1 transition-all ${
                      showTransparent
                        ? "text-white border border-white/20 hover:bg-white/10"
                        : "text-foreground border border-primary/20 hover:bg-primary/5 hover:border-primary/30"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">
                      {user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-primary/10 shadow-xl">
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()} className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      {getDashboardLabel()}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/10" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link to="/auth">
                  <Button
                    variant="ghost"
                    className={`rounded-xl font-medium ${
                      showTransparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-primary/5"
                    }`}
                  >
                    Kirish
                  </Button>
                </Link>
                <Link to="/register-company">
                  <Button
                    className={`gap-2 rounded-xl font-semibold transition-all ${
                      showTransparent
                        ? "bg-white text-primary hover:bg-white/90 shadow-lg"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                    }`}
                  >
                    Bepul boshlash
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-1.5 md:hidden">
            <LanguageSwitcher />
            <button
              className={`p-2 rounded-xl transition-all ${showTransparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-primary/5"}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 border-t border-primary/10">
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive(link.href)
                          ? "text-primary bg-primary/8"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <hr className="my-2 border-primary/10" />
                  {user ? (
                    <>
                      <Link to={getDashboardLink()} onClick={() => setIsOpen(false)} className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2.5 rounded-xl hover:bg-muted/50">
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                        {getDashboardLabel()}
                      </Link>
                      <button onClick={() => { setIsOpen(false); handleSignOut(); }} className="px-4 py-3 text-sm font-medium text-destructive hover:text-destructive/80 flex items-center gap-2.5 rounded-xl">
                        <LogOut className="h-4 w-4" />
                        {t("nav.logout")}
                      </button>
                    </>
                  ) : (
                    <div className="px-4 mt-2 space-y-2">
                      <Link to="/auth" onClick={() => setIsOpen(false)} className="block">
                        <Button variant="outline" className="w-full rounded-xl">Kirish</Button>
                      </Link>
                      <Link to="/register-company" onClick={() => setIsOpen(false)} className="block">
                        <Button className="w-full bg-primary text-primary-foreground rounded-xl font-semibold shadow-md shadow-primary/20">
                          Bepul boshlash
                        </Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default Header;
