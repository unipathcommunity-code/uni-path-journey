import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { PRICING_PLANS } from '@/core/constants/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Globe, 
  Zap, 
  Check,
  Building2,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Bot,
  Menu,
  X,
  Lock,
  ArrowUpRight,
  Send,
  Smartphone,
  Laptop,
  Palette,
  Settings,
  Shield,
  Phone,
  MapPin,
  Clock,
  Mail,
  Star,
  Award,
  BookOpen,
  Camera
} from 'lucide-react';

interface TenantLandingPageProps {
  tenant: any;
  isUz: boolean;
  navigate: (path: string) => void;
}

function TenantLandingPage({ tenant, isUz, navigate }: TenantLandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detect vertical
  const vertical = tenant.config?.business_type || tenant.business_type || 'consulting';
  const isTour = vertical === 'tour';
  const isAcademy = vertical === 'academy';
  const isHotel = vertical === 'hotel';
  // default: consulting

  // --- TOUR vertical content ---
  const tourDestinations = [
    { name: isUz ? 'Turkiya (Antaliya)' : 'Turkey (Antalya)', flag: '🇹🇷', desc: isUz ? 'All-inclusive plyajlar, hashamatli mehmonxonalar va charter reyslar.' : 'All-inclusive beaches, luxury resorts and charter flights.', badge: isUz ? 'Eng ommabop' : 'Most Popular' },
    { name: isUz ? 'BAA (Dubai)' : 'UAE (Dubai)', flag: '🇦🇪', desc: isUz ? 'Savdo markazlari, Burj Khalifa va cho\'l safari tajribalari.' : 'World-class malls, Burj Khalifa & desert safari adventures.', badge: isUz ? 'Premium' : 'Premium' },
    { name: isUz ? 'Misr (Sharm)' : 'Egypt (Sharm)', flag: '🇪🇬', desc: isUz ? 'Qizil dengiz, snorkeling va arzon all-inclusive paketlar.' : 'Red Sea snorkeling, diving and budget-friendly all-inclusive packages.', badge: isUz ? 'Arzon' : 'Budget Friendly' },
    { name: isUz ? 'Makkah va Madinah' : 'Mecca & Medina', flag: '🕋', desc: isUz ? 'Umra va ziyorat sayohatlari — to\'liq xizmat ko\'rsatish bilan.' : 'Umrah and holy pilgrimage tours with full hospitality service.', badge: isUz ? 'Ziyorat' : 'Pilgrimage' },
    { name: isUz ? 'Samarqand va Buxoro' : 'Samarkand & Bukhara', flag: '🇺🇿', desc: isUz ? 'Buyuk Ipak yo\'li — mahalliy tarixiy va madaniy sayohatlar.' : 'Great Silk Road — local historical and cultural discovery tours.', badge: isUz ? 'Mahalliy' : 'Local' },
  ];

  const tourServices = [
    { icon: Globe, title: isUz ? 'Turlar Katalogi' : 'Tour Catalog', desc: isUz ? 'Xalqaro va mahalliy yo\'nalishlardagi 50+ sayohat paketlarini onlayn ko\'ring va bron qiling.' : 'Browse and book from 50+ international and local tour packages online.' },
    { icon: Shield, title: isUz ? 'Viza Ko\'magi' : 'Visa Assistance', desc: isUz ? 'Turkiya, BAA, Misr va Shengen vizalari uchun hujjat tayyorlashda to\'liq yordam.' : 'Full document support for Turkey, UAE, Egypt and Schengen visa applications.' },
    { icon: Star, title: isUz ? 'Bepul Transfer' : 'Free Transfer', desc: isUz ? 'Aeroportdan mehmonxonaga va qaytishda qulay transport xizmati.' : 'Complimentary airport-to-hotel transfer included in every package.' },
    { icon: Phone, title: isUz ? '24/7 Qo\'llab-quvvatlash' : '24/7 Support', desc: isUz ? 'Sayohat davomida istalgan muammoingizni hal qilish uchun biz doim siz bilan.' : 'Our dedicated travel team is available around the clock during your trip.' },
  ];

  // --- ACADEMY vertical content ---
  const academyCourses = [
    { name: 'IELTS', flag: '📝', desc: isUz ? 'Band 7+ maqsad — real imtihon formati asosida intensiv mashg\'ulotlar.' : 'Band 7+ target — intensive practice based on real exam format.', badge: isUz ? 'Eng ommabop' : 'Most Popular' },
    { name: isUz ? 'Ingliz tili (A1–C2)' : 'English (A1–C2)', flag: '🇬🇧', desc: isUz ? 'Boshlang\'ich darajadan C2 gacha — tajribali murabbiylar bilan.' : 'Beginner to C2 advanced — structured with experienced trainers.', badge: isUz ? 'Barcha darajalar' : 'All Levels' },
    { name: isUz ? 'IT va Dasturlash' : 'IT & Programming', flag: '💻', desc: isUz ? 'Python, Web va Mobile — amaliy loyihalar asosida o\'rganing.' : 'Python, Web & Mobile — project-based practical learning.', badge: isUz ? 'Yangi' : 'New' },
    { name: isUz ? 'SAT / GMAT Tayyorlov' : 'SAT / GMAT Prep', flag: '🎯', desc: isUz ? 'Xalqaro test imtihonlariga chuqurlashtirilgan tayyorlov kurslari.' : 'Deep preparation courses for international standardized tests.', badge: isUz ? 'Premium' : 'Premium' },
  ];

  const academyServices = [
    { icon: GraduationCap, title: isUz ? 'Guruhli Darslar' : 'Group Classes', desc: isUz ? 'Kichik guruhlar (8-12 kishi) — individual e\'tibor va samarali o\'rganish.' : 'Small groups (8-12) — individual attention and effective learning.' },
    { icon: Users, title: isUz ? 'Online Dars' : 'Online Classes', desc: isUz ? 'Zoom orqali interaktiv onlayn darslar — uydan chiqmasdan o\'qing.' : 'Interactive Zoom-based online sessions — learn from anywhere.' },
    { icon: Star, title: isUz ? 'Mock Imtihonlar' : 'Mock Exams', desc: isUz ? 'Real imtihon sharoitida muntazam sinov testlari va natijalar tahlili.' : 'Regular practice tests under real exam conditions with result analysis.' },
    { icon: Award, title: isUz ? 'Sertifikat' : 'Certificate', desc: isUz ? 'Kurs yakunida rasmiy sertifikat va ish beruvchilar uchun tavsiyalar.' : 'Official course certificate and employer recommendations upon completion.' },
  ];

  // --- HOTEL vertical content ---
  const hotelRooms = [
    { name: isUz ? 'Standart Xona' : 'Standard Room', flag: '🛏️', desc: isUz ? 'Qulay va zamonaviy standart xona — Wi-Fi va konditsioner bilan.' : 'Comfortable and modern standard room with Wi-Fi and air conditioning.', badge: isUz ? 'Iqtisodiy' : 'Economy' },
    { name: isUz ? 'Deluxe Xona' : 'Deluxe Room', flag: '🌟', desc: isUz ? 'Kengaytirilgan maydoni, premium to\'shak va shahar ko\'rinishi.' : 'Larger space, premium bedding and scenic city views.', badge: isUz ? 'Ommabop' : 'Popular' },
    { name: isUz ? 'Suite' : 'Suite', flag: '👑', desc: isUz ? 'Alohida mehmon xonasi, oshxona va premium xizmat ko\'rsatish.' : 'Separate living area, kitchenette and premium concierge service.', badge: isUz ? 'Luxe' : 'Luxury' },
    { name: isUz ? 'Oilaviy xona' : 'Family Room', flag: '👨‍👩‍👧', desc: isUz ? 'Oila uchun keng xona — 2 yotoq va alohida hammom bilan.' : 'Spacious family room — 2 bedrooms and an ensuite bathroom.', badge: isUz ? 'Oila uchun' : 'Family' },
  ];

  const hotelServices = [
    { icon: Star, title: isUz ? 'Bepul Nonushta' : 'Free Breakfast', desc: isUz ? 'Har kuni ertalab keng assortimentdagi milliy va xalqaro taomlar.' : 'Extensive national and international buffet breakfast daily.' },
    { icon: Globe, title: isUz ? 'Bepul Wi-Fi' : 'Free Wi-Fi', desc: isUz ? 'Mehmonxonaning barcha hududlarida yuqori tezlikli internet aloqasi.' : 'High-speed internet across all hotel zones, free of charge.' },
    { icon: Shield, title: isUz ? '24/7 Qabul' : '24/7 Reception', desc: isUz ? 'Har qanday vaqtda yordam ko\'rsatishga tayyor mehribon xodimlar.' : 'Friendly reception team ready to assist at any hour.' },
    { icon: Phone, title: isUz ? 'Transfer Xizmati' : 'Transfer Service', desc: isUz ? 'Aeroportdan mehmonxonaga qulay va o\'z vaqtida yetkazib berish.' : 'Timely and comfortable pick-up service from the airport.' },
  ];

  // Shared contact info
  const contactPhone = tenant.owner_phone || tenant.config?.branding?.phone || '+998 71 200 70 00';
  const contactEmail = tenant.owner_email || `info@${tenant.subdomain || 'business'}.uz`;
  const contactAddress = tenant.config?.branding?.address || (isUz ? 'Toshkent shahri, Yunusobod tumani, Amir Temur ko\'chasi, 108-uy' : '108 Amir Temur Ave, Yunusabad District, Tashkent, Uzbekistan');

  // --- Dynamic content based on vertical ---
  const heroBadge = isTour
    ? (isUz ? '✈️ Ishonchli sayohat hamkoringiz' : '✈️ Your Trusted Travel Partner')
    : isAcademy
    ? (isUz ? '🎓 Professional ta\'lim markazi' : '🎓 Professional Education Center')
    : isHotel
    ? (isUz ? '🏨 Premium mehmonxona xizmatlari' : '🏨 Premium Hotel & Hospitality')
    : (isUz ? '🌍 Xalqaro ta\'lim konsaltingi' : '🌍 Premium Study Abroad Consulting');

  const heroTitle = isTour
    ? (isUz ? `${tenant.name} bilan dunyo saring!` : `Discover the World with ${tenant.name}!`)
    : isAcademy
    ? (isUz ? `${tenant.name} bilan bilim oling` : `Learn & Grow with ${tenant.name}`)
    : isHotel
    ? (isUz ? `${tenant.name} — hashamatli qo'nalg'a` : `${tenant.name} — Your Premium Stay`)
    : (isUz ? `${tenant.name} bilan dunyoni o'rganing` : `Study the World with ${tenant.name}`);

  const heroSubtitle = isTour
    ? (isUz
        ? 'Turkiya, BAA, Misr, Umra va mahalliy sayohatlar — onlayn bron qiling, tez va qulay. Viza yordami ham biz bilan!'
        : 'Turkey, UAE, Egypt, Umrah and local tours — book online, fast and easy. Visa assistance included!')
    : isAcademy
    ? (isUz
        ? 'IELTS, ingliz tili, dasturlash va boshqa kurslar — tajribali murabbiylar va zamonaviy o\'quv muhiti bilan.'
        : 'IELTS, English, programming and more — experienced trainers and a modern learning environment.')
    : isHotel
    ? (isUz
        ? 'Qulay xonalar, mazali nonushta va 24/7 xizmat ko\'rsatish — dam olishni siz afzal ko\'rgan tarzda.'
        : 'Comfortable rooms, delicious breakfast and 24/7 service — relaxation exactly how you prefer it.')
    : (isUz
        ? 'Xalqaro miqyosdagi top universitetlarda tahsil oling va kelajagingizni quring. Biz universitet tanlashdan tortib viza olishgacha bo\'lgan barcha jarayonni o\'z zimmamizga olamiz.'
        : 'Study at top-tier global universities and shape your professional future. We guide you seamlessly through admissions, visas, housing, and scholarship options.');

  const ctaLabel = isTour
    ? (isUz ? 'Tur Bron Qilish' : 'Book a Tour')
    : isAcademy
    ? (isUz ? 'Kursga Yozilish' : 'Enroll Now')
    : isHotel
    ? (isUz ? 'Xona Band Qilish' : 'Book a Room')
    : (isUz ? 'Hozir Murojaat Qiling' : 'Apply Now');

  const statsRow = isTour
    ? [
        { value: '50+', label: isUz ? 'Tur yo\'nalishlari' : 'Tour Destinations' },
        { value: '5,000+', label: isUz ? 'Mamnun sayyohlar' : 'Happy Travellers' },
        { value: '100%', label: isUz ? 'Viza tasdig\'i' : 'Visa Success Rate' },
      ]
    : isAcademy
    ? [
        { value: '30+', label: isUz ? 'Kurs yo\'nalishlari' : 'Course Tracks' },
        { value: '2,000+', label: isUz ? 'O\'quvchilar' : 'Active Students' },
        { value: '95%', label: isUz ? 'Imtihon natijalari' : 'Exam Pass Rate' },
      ]
    : isHotel
    ? [
        { value: '120+', label: isUz ? 'Xonalar' : 'Rooms & Suites' },
        { value: '4.8★', label: isUz ? 'O\'rtacha baho' : 'Average Rating' },
        { value: '24/7', label: isUz ? 'Xizmat vaqti' : 'Service Hours' },
      ]
    : [
        { value: '1,200+', label: isUz ? 'Muvaffaqiyatli talabalar' : 'Successful Students' },
        { value: '98.4%', label: isUz ? 'Viza tasdig\'i darajasi' : 'Visa Approval Rate' },
        { value: '80+', label: isUz ? 'Hamkor universitetlar' : 'Partner Universities' },
      ];

  const listItems = isTour ? tourDestinations : isAcademy ? academyCourses : isHotel ? hotelRooms : null;
  const listTitle = isTour
    ? (isUz ? 'Mashhur sayohat yo\'nalishlari' : 'Popular Tour Destinations')
    : isAcademy
    ? (isUz ? 'Kurs yo\'nalishlari' : 'Our Course Offerings')
    : isHotel
    ? (isUz ? 'Xona turlari' : 'Room Categories')
    : (isUz ? "Ta'lim dasturlarimiz mavjud davlatlar" : 'Study Destination Options');

  const serviceItems = isTour ? tourServices : isAcademy ? academyServices : isHotel ? hotelServices : null;
  const serviceTitle = isTour
    ? (isUz ? 'Bizning xizmatlarimiz' : 'Our Travel Services')
    : isAcademy
    ? (isUz ? 'Nima uchun biz?' : 'Why Choose Us?')
    : isHotel
    ? (isUz ? 'Mehmonxona xizmatlari' : 'Hotel Amenities')
    : (isUz ? 'Bizning xizmatlarimiz va qulayliklar' : 'Our Core Services');

  // Nav labels by vertical
  const nav1 = isTour
    ? { href: '#destinations', label: isUz ? 'Turlar' : 'Tours' }
    : isAcademy
    ? { href: '#courses', label: isUz ? 'Kurslar' : 'Courses' }
    : isHotel
    ? { href: '#rooms', label: isUz ? 'Xonalar' : 'Rooms' }
    : { href: '#countries', label: isUz ? 'Davlatlar' : 'Countries' };

  const consulting_countries = [
    { name: isUz ? 'AQSH (USA)' : 'USA', flag: '🇺🇸', desc: isUz ? 'Top universitetlar, STEM dasturlari va ishlash imkoniyati' : 'Top universities, STEM programs & work authorization', grant: 'Up to 70% Scholarship' },
    { name: isUz ? 'Buyuk Britaniya (UK)' : 'United Kingdom', flag: '🇬🇧', desc: isUz ? '1 yillik Master darajalari, nufuzli diplom va 2 yillik ish vizasi' : '1-year Master degrees, world-class reputation & 2-year post-study work visa', grant: 'Up to £10,000 Grant' },
    { name: isUz ? 'Germaniya' : 'Germany', flag: '🇩🇪', desc: isUz ? 'Davlat universitetlarida bepul ta\'lim va yevropa bo\'ylab sayohat' : 'Free education at state universities and Schengen-wide mobility', grant: '100% Free Tuition' },
    { name: isUz ? 'Janubiy Koreya' : 'South Korea', flag: '🇰🇷', desc: isUz ? 'Koreys yoki ingliz tilida o\'qish, 100% gacha grant va yashash uchun ish' : 'Study in Korean/English, up to 100% scholarship & student jobs', grant: 'Full-ride Scholarships' },
    { name: isUz ? 'Kanada' : 'Canada', flag: '🇨🇦', desc: isUz ? 'O\'qishdan keyin oson immigratsiya va yashash huquqi (PR)' : 'Post-graduation work permit (PGWP) and pathway to permanent residency', grant: 'Co-op Work & Study' },
  ];

  const consulting_services = [
    { icon: BookOpen, title: isUz ? 'Universitet tanlash' : 'University Selection', desc: isUz ? 'Qiziqishlaringiz va byudjetingizga mos bo\'lgan 5 dan ortiq OTMlarni tahlil qilib beramiz.' : 'We analyze and present at least 5 universities matching your academic profile and budget.' },
    { icon: Award, title: isUz ? 'Grant yutish ko\'magi' : 'Scholarship Support', desc: isUz ? 'Motivation letter va insholarni tayyorlashda yordam berib, grant yutish imkoniyatingizni oshiramiz.' : 'Boost your scholarship chances with professional help on motivational letters, portfolios, and essays.' },
    { icon: Shield, title: isUz ? 'Hujjatlar tayyorlash' : 'Document Assistance', desc: isUz ? 'Universitet qabul talablariga mos tarzda barcha hujjatlarni professional tarjima va tayyorlash.' : 'Professional translation, apostille guidance, and accurate preparation matching exact admission criteria.' },
    { icon: Globe, title: isUz ? 'Viza ko\'magi' : 'Visa Assistance', desc: isUz ? 'Elchixona intervyusiga tayyorlash va barcha viza hujjatlarini kamchiliklarsiz shakllantirish.' : 'Extensive mock interviews and full assistance preparing student visa files with zero errors.' },
  ];

  const finalListItems = listItems || consulting_countries;
  const finalServiceItems = serviceItems || consulting_services;

  return (
    <div className="min-h-screen bg-[#040e1a] text-[#e2edfc] font-sans overflow-x-hidden relative selection:bg-primary/30 selection:text-white">
      {/* Background gradients aligned with injected theme */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-primary/8 blur-[180px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 noise-overlay opacity-[0.02] pointer-events-none"></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#040e1a]/85 backdrop-blur-2xl border-b border-white/5 py-3 shadow-lg' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {tenant.config?.branding?.logo_url ? (
              <img 
                src={tenant.config.branding.logo_url} 
                alt={tenant.name} 
                className="w-10 h-10 object-contain rounded-xl bg-white/5 p-1 border border-white/10" 
              />
            ) : (
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 text-primary">
                {isTour ? <Globe className="w-6 h-6" /> : isHotel ? <Building2 className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
              </div>
            )}
            <span className="font-bold text-xl md:text-2xl text-white tracking-tight font-['Sora']">
              {tenant.name}
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 bg-white/[0.02] backdrop-blur-xl px-6 py-2 rounded-full border border-white/5">
            <a href={nav1.href} className="text-xs font-semibold text-slate-300 hover:text-primary transition-colors">{nav1.label}</a>
            <a href="#services" className="text-xs font-semibold text-slate-300 hover:text-primary transition-colors">{isUz ? 'Xizmatlar' : 'Services'}</a>
            <a href="#contact" className="text-xs font-semibold text-slate-300 hover:text-primary transition-colors">{isUz ? 'Aloqa' : 'Contact'}</a>
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <Button 
                onClick={() => navigate('/auth?mode=login')} 
                variant="ghost"
                className="text-slate-300 hover:text-white text-xs h-9 px-4 rounded-lg transition-all"
              >
                {isUz ? 'Kirish' : 'Sign In'}
              </Button>
              <Button 
                onClick={() => navigate('/auth?mode=signup')} 
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 px-5 rounded-lg transition-all hover:scale-[1.02]"
              >
                {ctaLabel}
              </Button>
            </div>
          </div>

          {/* Mobile Toggle */}
          <div className="flex md:hidden items-center gap-4">
            <LanguageSwitcher />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-0 z-40 bg-[#040e1a]/98 backdrop-blur-3xl pt-24 pb-8 px-4 flex flex-col md:hidden border-b border-white/5 shadow-2xl"
          >
            <nav className="flex flex-col gap-6 mb-8 text-center">
              <a onClick={() => setMobileMenuOpen(false)} href={nav1.href} className="text-lg font-medium text-slate-200 hover:text-primary transition-colors">{nav1.label}</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#services" className="text-lg font-medium text-slate-200 hover:text-primary transition-colors">{isUz ? 'Xizmatlar' : 'Services'}</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#contact" className="text-lg font-medium text-slate-200 hover:text-primary transition-colors">{isUz ? 'Aloqa' : 'Contact'}</a>
            </nav>
            
            <div className="space-y-3 px-4">
              <Button 
                onClick={() => { setMobileMenuOpen(false); navigate('/auth?mode=login'); }}
                className="w-full justify-center h-11 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm"
              >
                {isUz ? 'Kirish' : 'Sign In'}
              </Button>
              <Button 
                onClick={() => { setMobileMenuOpen(false); navigate('/auth?mode=signup'); }}
                className="w-full h-11 bg-primary text-white hover:bg-primary/90 rounded-xl text-sm font-bold shadow-lg"
              >
                {ctaLabel}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 pt-28 pb-20 md:pt-40 md:pb-28">
        
        {/* Hero */}
        <section className="container mx-auto px-4 md:px-6 text-center max-w-4xl mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 backdrop-blur-md"
          >
            <Zap className="w-4 h-4 animate-pulse text-[#4cd7f6]" />
            <span className="text-xs font-semibold tracking-wide uppercase text-primary">
              {heroBadge}
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.15] font-['Sora']"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#60a5fa] to-primary bg-[length:200%_auto] animate-gradient font-extrabold">
              {heroTitle}
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base md:text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed font-light"
          >
            {heroSubtitle}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 max-w-md mx-auto"
          >
            <Button 
              onClick={() => navigate('/auth?mode=signup')}
              size="lg" 
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              {ctaLabel} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button 
              onClick={() => navigate('/auth?mode=login')}
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-white/[0.02] border-white/10 text-white hover:bg-white/10 backdrop-blur-md transition-all hover:scale-[1.02]"
            >
              {isUz ? "Tizimga kirish" : 'Sign In'}
            </Button>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 md:px-6 mb-28 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {statsRow.map((stat, i) => (
              <div key={i} className="bg-[#122131]/20 border border-white/5 rounded-3xl p-6 text-center hover:border-primary/20 transition-all hover:-translate-y-0.5">
                <div className="text-3xl md:text-4xl font-extrabold text-primary mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* List Section (Destinations / Courses / Rooms / Countries) */}
        <section id={isTour ? 'destinations' : isAcademy ? 'courses' : isHotel ? 'rooms' : 'countries'} className="container mx-auto px-4 md:px-6 mb-28 max-w-6xl scroll-mt-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 font-['Sora']">{listTitle}</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalListItems.map((item: any, idx: number) => (
              <div key={idx} className="bg-[#122131]/15 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-primary/20 transition-all hover:-translate-y-1 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{item.flag}</span>
                    <h3 className="text-lg font-bold text-white tracking-tight">{item.name}</h3>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-light mb-6">{item.desc}</p>
                </div>
                <div className="text-primary font-bold text-xs bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-xl self-start">
                  {item.badge || item.grant}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section id="services" className="container mx-auto px-4 md:px-6 mb-28 max-w-6xl scroll-mt-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 font-['Sora']">{serviceTitle}</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {finalServiceItems.map((service: any, idx: number) => (
              <div key={idx} className="bg-[#122131]/20 border border-white/5 rounded-3xl p-6 hover:bg-[#122131]/30 transition-all border-b-2 border-b-transparent hover:border-b-primary">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-5 text-primary border border-primary/20">
                  <service.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{service.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">{service.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact/About section */}
        <section id="contact" className="container mx-auto px-4 md:px-6 scroll-mt-24 max-w-5xl">
          <div className="bg-[#122131]/10 rounded-3xl border border-white/5 p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              
              <div className="md:col-span-5 space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-['Sora']">
                  {isUz ? "Biz bilan bog'laning" : 'Contact Us Today'}
                </h2>
                <p className="text-slate-400 text-xs md:text-sm font-light leading-relaxed">
                  {isUz 
                    ? `Savollaringiz bormi? Quyidagi aloqa ma'lumotlari orqali biz bilan bog'laning!`
                    : `Have questions or ready to get started? Reach us via the details below!`}
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">{isUz ? 'Telefon' : 'Phone'}</div>
                      <a href={`tel:${contactPhone}`} className="text-xs font-semibold text-white hover:text-primary transition-colors">{contactPhone}</a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">{isUz ? 'Elektron Pochta' : 'Email Address'}</div>
                      <a href={`mailto:${contactEmail}`} className="text-xs font-semibold text-white hover:text-primary transition-colors">{contactEmail}</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">{isUz ? 'Ofis Manzili' : 'Office Location'}</div>
                      <div className="text-xs font-semibold text-white leading-tight">{contactAddress}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">{isUz ? 'Ish Vaqtlari' : 'Working Hours'}</div>
                      <div className="text-xs font-semibold text-white">{isUz ? 'Dushanba - Shanba, 9:00 - 18:00' : 'Monday - Saturday, 9:00 - 18:00'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead form */}
              <div className="md:col-span-7 bg-[#040e1a]/70 border border-white/5 rounded-3xl p-5 md:p-8">
                <h3 className="text-base md:text-lg font-bold text-white mb-4 tracking-tight">
                  {isTour
                    ? (isUz ? 'Tur so\'rovnomasi' : 'Tour Inquiry')
                    : isAcademy
                    ? (isUz ? 'Kursga yozilish' : 'Course Enrollment')
                    : isHotel
                    ? (isUz ? 'Xona band qilish' : 'Room Reservation')
                    : (isUz ? 'Ariza qoldiring' : 'Send an Inquiry')}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="lead-name" className="text-slate-400 text-xs">{isUz ? 'F.I.SH.' : 'Full Name'}</Label>
                    <Input id="lead-name" placeholder={isUz ? 'Ism va familiyangiz' : 'Your Full Name'} className="bg-white/5 border-white/10 text-white rounded-xl focus:border-primary focus:ring-primary h-11 text-xs" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="lead-phone" className="text-slate-400 text-xs">{isUz ? 'Telefon raqam' : 'Phone Number'}</Label>
                      <Input id="lead-phone" placeholder="+998 90 123 45 67" className="bg-white/5 border-white/10 text-white rounded-xl focus:border-primary focus:ring-primary h-11 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lead-interest" className="text-slate-400 text-xs">
                        {isTour ? (isUz ? 'Qiziqtirgan yo\'nalish' : 'Preferred Destination')
                          : isAcademy ? (isUz ? 'Kurs nomi' : 'Course Name')
                          : isHotel ? (isUz ? 'Xona turi' : 'Room Type')
                          : (isUz ? 'O\'qimoqchi bo\'lgan davlatingiz' : 'Preferred Destination')}
                      </Label>
                      <Input id="lead-interest" placeholder={
                        isTour ? (isUz ? 'Turkiya, BAA, Misr...' : 'Turkey, UAE, Egypt...')
                          : isAcademy ? (isUz ? 'IELTS, Ingliz tili...' : 'IELTS, English...')
                          : isHotel ? (isUz ? 'Standart, Deluxe...' : 'Standard, Deluxe...')
                          : 'USA, Germany, UK...'
                      } className="bg-white/5 border-white/10 text-white rounded-xl focus:border-primary focus:ring-primary h-11 text-xs" />
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      alert(isUz ? 'Rahmat! So\'rovingiz qabul qilindi, mutaxassislarimiz tez orada siz bilan bog\'lanishadi.' : 'Thank you! Your inquiry was received. Our team will contact you shortly.');
                    }}
                    className="w-full h-11 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl text-xs tracking-wide shadow-lg shadow-primary/10 mt-2 transition-all hover:scale-[1.01]"
                  >
                    {ctaLabel} <Send className="ml-2 w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#020b14] py-10 px-4 md:px-6 relative z-10 text-xs">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 font-light">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">{tenant.name}</span>
            <span>—</span>
            <span>
              {isTour
                ? (isUz ? 'Sayohat va turizm xizmatlari' : 'Travel & Tourism Services')
                : isAcademy
                ? (isUz ? 'Ta\'lim va kurslar markazi' : 'Education & Training Center')
                : isHotel
                ? (isUz ? 'Mehmonxona va hospitality xizmatlari' : 'Hotel & Hospitality Services')
                : (isUz ? 'Dunyo bo\'ylab ta\'lim va viza konsaltingi' : 'Global Student Admissions & Visas')}
            </span>
          </div>
          <div>
            <p>© 2026 {tenant.name}. {isUz ? 'Barcha huquqlar himoyalangan.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default function Index({ forceSaaS = false }: { forceSaaS?: boolean } = {}) {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { language, activeTenant } = useApp();
  const isUz = language === 'uz';
  const isRu = language === 'ru';
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ⚠️ Hooks MUST be called before any conditional return
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!isLoading && user && !activeTenant) {
      // Don't redirect on core root — let them see the SaaS landing
    }
  }, [user, isLoading, activeTenant]);

  if (activeTenant && !forceSaaS) {
    return <TenantLandingPage tenant={activeTenant} isUz={isUz} navigate={navigate} />;
  }

  const features = [
    {
      icon: Globe,
      title: isUz ? 'White-Label, o\'z domeningizda' : isRu ? 'White-Label на вашем домене' : 'White-Label on Your Domain',
      desc: isUz ? "Har bir biznes o'z subdomain yoki custom domenida ishlaydi. Brend, rang, logo — barchasi moslashtiriladi." : isRu ? "Каждый бизнес работает на своём поддомене или домене. Бренд, цвета, логотип — всё настраивается." : "Every business runs under its own subdomain or custom domain. Brand, colors, logo — all fully customizable."
    },
    {
      icon: Bot,
      title: isUz ? 'Telegram Bot (har biznes uchun)' : isRu ? 'Выделенный Telegram Bot' : 'Dedicated Telegram Bot',
      desc: isUz ? "Har bir biznes uchun alohida Telegram bot. Mijozlar buyurtma, navbat, to'lov va holat tekshirishni botdan qiladi." : isRu ? "Каждый бизнес получает свой Telegram bot. Клиенты проверяют заказы, запись, оплату и статус без звонков." : "Each business gets its own Telegram bot. Clients can check orders, appointments, payments, and status without calling."
    },
    {
      icon: Camera,
      title: isUz ? 'AI Kamera Nazorat tizimi' : isRu ? 'AI-видеонаблюдение' : 'AI Camera Surveillance',
      desc: isUz ? "Yong'in, tutun, bosqin va yuz tanish — real vaqtda AI aniqlash va Telegram orqali darhol ogohlantirish." : isRu ? "Пожар, дым, вторжение, распознавание лиц — AI-обнаружение в реальном времени с мгновенными Telegram-оповещениями." : "Fire, smoke, intrusion, face recognition — real-time AI detection with instant Telegram alerts."
    },
    {
      icon: LayoutDashboard,
      title: isUz ? 'CRM + ERP — bitta tizimda' : isRu ? 'CRM + ERP в одной платформе' : 'CRM + ERP in One Platform',
      desc: isUz ? "Mijozlar, xodimlar, ombor, hisob-kitob va analitika — har bir biznes turiga moslashtirilgan bitta tizimda." : isRu ? "Клиенты, сотрудники, склад, биллинг и аналитика — всё в одной системе, адаптированной под ваш бизнес." : "Customers, staff, inventory, billing, and analytics — all in one system tailored to your business type."
    },
    {
      icon: CreditCard,
      title: isUz ? "Ko'p filial, ko'p valyuta" : isRu ? 'Мультифилиальность и мультивалютность' : 'Multi-Branch, Multi-Currency',
      desc: isUz ? "Toshkent, Samarqand, Buxoro — barcha filiallaringizni bitta admin panelidan boshqaring. Valyuta va vaqt zonasi ham alohida." : isRu ? "Управляйте всеми филиалами из одной панели. Отдельная валюта, часовой пояс и настройки для каждого." : "Manage all your branches from one panel. Separate currency, timezone, and settings per branch."
    },
    {
      icon: Users,
      title: isUz ? 'Rollarga asoslangan huquqlar' : isRu ? 'Разграничение доступа по ролям' : 'Role-Based Access Control',
      desc: isUz ? "Kassir, direktor, xodim, ombor mudir — har biri faqat o'ziga tegishli ma'lumotni ko'radi va tahrirlaydi." : isRu ? "Кассир, директор, сотрудник, кладовщик — каждый видит и редактирует только то, что ему разрешено." : "Cashier, director, staff, warehouse manager — each role sees and edits only what they're allowed to."
    }
  ];

  const plans = PRICING_PLANS.map(plan => ({
    id: plan.id,
    name: plan.name,
    price: `$${plan.priceMonthly}`,
    period: isUz ? 'oyiga' : isRu ? '/мес' : '/mo',
    popular: plan.popular,
    desc: isUz ? plan.descUz : isRu ? plan.descRu : plan.descEn,
    features: isUz ? plan.featuresUz : isRu ? plan.featuresRu : plan.featuresEn,
    style: plan.style
  }));

  const steps = [
    {
      num: '01', icon: Building2,
      title: isUz ? "Biznes turini tanlang" : isRu ? 'Выберите тип бизнеса' : 'Choose Your Business Type',
      desc: isUz ? "Fitnes, ta'lim, restoran, mehmonxona, klinika yoki boshqa 20+ vertikal ichidan o'zingizga mosini tanlang." : isRu ? "Фитнес, образование, ресторан, отель, клиника — выбирайте из 20+ вертикалей." : "Pick from 20+ verticals — gym, education, restaurant, hotel, clinic, retail, and more."
    },
    {
      num: '02', icon: Zap,
      title: isUz ? 'Brendingizni sozlang' : isRu ? 'Настройте свой бренд' : 'Set Up Your Brand',
      desc: isUz ? "Logo, rang, subdomain va Telegram bot — 15 daqiqada o'z nomingizda ishlaydigan tizim tayyor." : isRu ? "Логотип, цвет, поддомен и Telegram bot — ваша брендированная система за 15 минут." : "Logo, color, subdomain, and Telegram bot — your branded system ready in 15 minutes."
    },
    {
      num: '03', icon: GraduationCap,
      title: isUz ? 'Biznesingizni boshqaring' : isRu ? 'Управляйте и масштабируйтесь' : 'Run & Scale Your Business',
      desc: isUz ? "Mijozlar, xodimlar, to'lovlar, ombor va AI-kamera — barchasini bitta dashboarddan nazorat qiling." : isRu ? "Клиенты, сотрудники, оплаты, склад и AI-камеры — всё управляется с одной мощной панели." : "Customers, staff, payments, inventory, and AI cameras — all from one powerful dashboard."
    },
  ];

  return (
    <div className="min-h-screen bg-[#051424] text-[#d4e4fa] font-sans overflow-x-hidden selection:bg-[#d2bbff]/30 selection:text-white relative">
      {/* Background radial effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#d2bbff]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[#4cd7f6]/8 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-15%] left-[20%] w-[60%] h-[60%] bg-[#8b5cf6]/10 blur-[180px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 noise-overlay opacity-[0.03] pointer-events-none"></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#051424]/80 backdrop-blur-2xl border-b border-white/10 py-3 shadow-lg shadow-[#051424]/20' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#d2bbff] to-[#4cd7f6] rounded-xl flex items-center justify-center shadow-lg shadow-[#d2bbff]/20 border border-white/10">
              <Globe className="w-6 h-6 text-[#051424]" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight font-['Sora']">
              UniPath<span className="text-[#d2bbff]">.</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 bg-white/[0.03] backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/10">
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{isUz ? 'Imkoniyatlar' : isRu ? 'Возможности' : 'Features'}</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{isUz ? 'Qanday ishlaydi' : isRu ? 'Как работает' : 'How it works'}</a>
            <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{isUz ? 'Narxlar' : isRu ? 'Цены' : 'Pricing'}</a>
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <Button
                onClick={() => navigate('/auth')}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium h-10 px-4 rounded-lg backdrop-blur-md transition-all hover:scale-[1.02]"
              >
                <Users className="w-4 h-4 mr-2 text-[#d2bbff]" />
                {isUz ? 'Kirish' : isRu ? 'Войти' : 'Login'}
              </Button>

              <Button
                onClick={() => navigate('/tizimlashtirish')}
                className="bg-gradient-to-r from-[#d2bbff] to-[#4cd7f6] text-[#051424] font-bold h-10 px-4 rounded-lg transition-all hover:opacity-90 hover:scale-[1.02]"
              >
                {isUz ? 'Boshlash' : isRu ? 'Начать' : 'Get Started'}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-4">
            <LanguageSwitcher />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-0 z-40 bg-[#051424]/98 backdrop-blur-3xl pt-24 pb-8 px-4 flex flex-col md:hidden border-b border-white/10 shadow-2xl"
          >
            <nav className="flex flex-col gap-6 mb-10">
              <a onClick={() => setMobileMenuOpen(false)} href="#features" className="text-xl font-medium text-slate-200 hover:text-white transition-colors">{isUz ? 'Imkoniyatlar' : isRu ? 'Возможности' : 'Features'}</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#how-it-works" className="text-xl font-medium text-slate-200 hover:text-white transition-colors">{isUz ? 'Qanday ishlaydi' : isRu ? 'Как работает' : 'How it works'}</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#pricing" className="text-xl font-medium text-slate-200 hover:text-white transition-colors">{isUz ? 'Narxlar' : isRu ? 'Цены' : 'Pricing'}</a>
            </nav>

            <div className="space-y-4">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">
                {isUz ? 'Tizimga kirish' : isRu ? 'Аккаунт' : 'Account'}
              </div>
              <Button
                onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}
                className="w-full justify-center h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-base"
              >
                <Users className="w-5 h-5 mr-3 text-[#d2bbff]" />
                {isUz ? 'Tizimga kirish' : isRu ? 'Войти' : 'Sign In'}
              </Button>

              <Button
                onClick={() => { setMobileMenuOpen(false); navigate('/tizimlashtirish'); }}
                className="w-full h-12 bg-gradient-to-r from-[#d2bbff] to-[#4cd7f6] text-[#051424] rounded-xl text-base font-bold shadow-lg shadow-[#d2bbff]/10"
              >
                {isUz ? 'Platformani ishga tushirish' : isRu ? 'Запустить платформу' : 'Launch Platform'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 pt-28 pb-20 md:pt-40 md:pb-28">
        
        {/* Hero Section */}
        <section className="container mx-auto px-4 md:px-6 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[#d2bbff] mb-8 backdrop-blur-md"
          >
            <Zap className="w-4 h-4 text-[#4cd7f6] animate-pulse" />
            <span className="text-sm font-medium tracking-wide">
              {isUz ? 'Har qanday biznes uchun White-Label SaaS platforma' : isRu ? 'White-Label SaaS платформа для любого бизнеса' : 'White-Label SaaS Platform for Any Business'}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-white mb-6 leading-[1.1] font-['Sora']"
          >
            {isUz ? "Har qanday biznesingizni" : isRu ? 'Переведите любой бизнес' : 'Run any business'}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d2bbff] via-[#4cd7f6] to-[#d2bbff] bg-[length:200%_auto] animate-gradient">
              {isUz ? "raqamlashtiring." : isRu ? 'в цифровой формат.' : 'fully digital.'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed font-light"
          >
            {isUz
              ? "Ta'lim konsalting, fitnes zal, restoran, mehmonxona, klinika, ulgurji savdo — istalgan biznes uchun o'z brendingizda CRM, ERP va AI-kuzatuv tizimi. Bir platformada."
              : isRu
              ? "Образовательный консалтинг, фитнес, ресторан, отель, клиника, оптовая торговля — полноценная CRM, ERP и AI-видеонаблюдение под вашим брендом. Одна платформа для любого бизнеса."
              : "Education consulting, gym, restaurant, hotel, clinic, wholesale — a full CRM, ERP, and AI camera system under your own brand. One platform for every business type."}
          </motion.p>

          {/* Vertical pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-wrap justify-center gap-2 mb-10 px-4"
          >
            {[
              { emoji: '🎓', label: isUz ? 'Ta\'lim' : isRu ? 'Образование' : 'EdTech' },
              { emoji: '💪', label: isUz ? 'Fitnes' : isRu ? 'Фитнес' : 'Gym' },
              { emoji: '🏨', label: isUz ? 'Hotel' : isRu ? 'Отель' : 'Hotel' },
              { emoji: '🍽️', label: isUz ? 'Restoran' : isRu ? 'Ресторан' : 'Restaurant' },
              { emoji: '🏥', label: isUz ? 'Klinika' : isRu ? 'Клиника' : 'Clinic' },
              { emoji: '📷', label: isUz ? 'AI Kamera' : isRu ? 'AI Камера' : 'AI Camera' },
              { emoji: '🛒', label: isUz ? 'Savdo' : isRu ? 'Торговля' : 'Retail' },
              { emoji: '🏟️', label: isUz ? 'Sport' : isRu ? 'Спорт' : 'Sports' },
            ].map((v) => (
              <span key={v.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-medium backdrop-blur-sm">
                <span>{v.emoji}</span>{v.label}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 mb-20"
          >
            <Button
              onClick={() => navigate('/tizimlashtirish')}
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-gradient-to-r from-[#d2bbff] to-[#4cd7f6] text-[#051424] hover:opacity-90 font-bold shadow-lg shadow-[#d2bbff]/20 transition-all hover:scale-[1.03]"
            >
              {isUz ? 'Biznesni ulash' : isRu ? 'Начать бесплатно' : 'Get Started Free'} <ArrowUpRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white/[0.03] border-white/10 text-white hover:bg-white/10 backdrop-blur-md transition-all hover:scale-[1.03]"
            >
              {isUz ? "Tizimga kirish" : isRu ? 'Войти' : 'Log In'}
            </Button>
          </motion.div>
        </section>



        {/* Verticals Showcase */}
        <section className="py-16 px-4 md:px-6 relative">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 font-['Sora']">
                {isUz ? 'Uch kuchli platforma — bitta ekosistema' : isRu ? 'Три мощные платформы — одна экосистема' : 'Three Powerful Platforms, One Ecosystem'}
              </h2>
              <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto font-light">
                {isUz ? 'Sohangizni tanlang — tizim avtomatik moslashadi.' : isRu ? 'Выберите свою отрасль — система автоматически адаптируется.' : 'Choose your industry — the platform adapts automatically.'}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  emoji: '🎓',
                  color: 'from-violet-500/20 to-purple-500/10',
                  border: 'border-violet-500/25 hover:border-violet-500/50',
                  tag: 'NOVA',
                  tagColor: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
                  title: isUz ? "O'quv Markazlar" : isRu ? 'Учебные Центры' : 'Education Centers',
                  desc: isUz ? "Guruhlar, darslar, davomat, sertifikat, ota-ona portal, to'lov va AI dars rejalash." : isRu ? 'Группы, уроки, посещаемость, сертификаты, родительский портал, AI-планирование.' : 'Groups, lessons, attendance, certificates, parent portal, AI lesson planner & billing.',
                  items: isUz ? ['O\'qituvchi & Talaba panel', 'Biometrik davomat', 'Website Builder', 'Sertifikat tizimi'] : isRu ? ['Панель учителя & студента', 'Биометрическое посещение', 'Конструктор сайтов', 'Система сертификатов'] : ['Teacher & Student panels', 'Biometric attendance', 'Website Builder', 'Certificate system'],
                },
                {
                  emoji: '✈️',
                  color: 'from-sky-500/20 to-cyan-500/10',
                  border: 'border-sky-500/25 hover:border-sky-500/50',
                  tag: 'UniTour',
                  tagColor: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
                  title: isUz ? 'Tur Agentliklar' : isRu ? 'Тур Агентства' : 'Tour Agencies',
                  desc: isUz ? "Turlar katalogi, online bron, agent tarmog'i, viza moduli va har agentlikka o'z public sayt." : isRu ? 'Каталог туров, онлайн бронирование, сеть агентов, визовый модуль и собственный сайт.' : 'Tour catalog, online booking, agent network, visa module & white-label public site per agency.',
                  items: isUz ? ['Bronlar & Viza moduli', 'Agent komissiya tizimi', 'Public katalog', 'Brend sayt'] : isRu ? ['Бронирование & Виза', 'Комиссионная система', 'Публичный каталог', 'Брендовый сайт'] : ['Bookings & Visa module', 'Agent commission system', 'Public tour catalog', 'Branded website'],
                },
                {
                  emoji: '🏢',
                  color: 'from-emerald-500/20 to-green-500/10',
                  border: 'border-emerald-500/25 hover:border-emerald-500/50',
                  tag: 'UniPath Core',
                  tagColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
                  title: isUz ? 'Universal Biznes' : isRu ? 'Универсальный Бизнес' : 'Universal Business',
                  desc: isUz ? "Konsalting, fitnes, restoran, klinika, mehmonxona va 15+ soha uchun CRM, buxgalteriya, HR va ko'p-filial boshqaruvi." : isRu ? 'Консалтинг, фитнес, ресторан, клиника, отель — CRM, бухгалтерия, HR и управление филиалами.' : 'Consulting, gym, restaurant, clinic, hotel and 15+ verticals with CRM, accounting, HR & multi-branch.',
                  items: isUz ? ['CRM Pipeline', 'Buxgalteriya & P&L', 'Ko\'p-filial boshqaruv', 'AI Kamera nazorat'] : isRu ? ['CRM Pipeline', 'Бухгалтерия & P&L', 'Управление филиалами', 'AI-камера контроль'] : ['CRM Pipeline', 'Accounting & P&L', 'Multi-branch management', 'AI Camera control'],
                },
              ].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={`bg-gradient-to-br ${v.color} border ${v.border} rounded-3xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{v.emoji}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${v.tagColor}`}>{v.tag}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1.5">{v.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">{v.desc}</p>
                  </div>
                  <ul className="space-y-1.5 mt-auto">
                    {v.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-current opacity-70 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="py-20 px-4 md:px-6 relative">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight font-['Sora']">
                {isUz ? 'Har bir biznes uchun kuchli qurollar' : isRu ? 'Всё что нужно вашему бизнесу' : 'Everything your business needs, built in'}
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
                {isUz ? 'Brendingizga moslashtiring, filiallaringizni boshqaring, Telegram bot ulang va AI kamera orqali real vaqtda nazorat qiling.' : isRu ? 'Настройте свой бренд, управляйте филиалами, подключите Telegram bot и следите за всем через AI-камеры — всё в одной платформе.' : 'White-label your brand, manage branches, plug in a Telegram bot, and monitor everything with AI cameras — all from one platform.'}
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div 
                  key={i}
                  className="bg-[#122131]/30 backdrop-blur-xl border border-white/5 p-8 rounded-3xl hover:bg-[#122131]/60 hover:border-[#d2bbff]/30 transition-all hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-[#d2bbff]/10 group-hover:border-[#d2bbff]/30 transition-colors">
                    <f.icon className="w-6 h-6 text-[#d2bbff]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight font-['Sora']">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-light">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 px-4 md:px-6 relative overflow-hidden bg-[#0d1c2d]/25 border-y border-white/5">
          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight font-['Sora']">
                {isUz ? 'Ishni boshlash juda oson' : isRu ? 'Начать очень просто' : 'Quick launch guide'}
              </h2>
              <p className="text-slate-400 text-base max-w-lg mx-auto font-light">
                {isUz ? "3 ta oddiy qadamda tizimni firmangizga moslashtiring va xodimlarni taklif qiling" : isRu ? "3 простых шага — настройте систему под свою компанию и пригласите сотрудников" : "Set up your workspace and integrate staff in under 10 minutes"}
              </p>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-[#122131]/20 backdrop-blur-md border border-white/5 p-6 rounded-2xl hover:bg-[#122131]/40 transition-colors"
                >
                  <div className="shrink-0 w-14 h-14 bg-[#051424] rounded-xl flex items-center justify-center border border-[#d2bbff]/30 shadow-md">
                    <step.icon className="w-6 h-6 text-[#4cd7f6]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#d2bbff] font-bold tracking-widest mb-1 uppercase">{isUz ? 'Qadam' : isRu ? 'Шаг' : 'Step'} {step.num}</div>
                    <h3 className="text-xl font-bold text-white mb-1.5 tracking-tight font-['Sora']">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-light">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-4 md:px-6 relative">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight font-['Sora']">
                {isUz ? 'Moslashuvchan tarif rejalar' : isRu ? 'Гибкие тарифные планы' : 'Pricing for growth'}
              </h2>
              <p className="text-slate-400 text-base max-w-lg mx-auto font-light">
                {isUz ? 'Biznesingiz hajmiga mos tarifni tanlang. Istalgan vaqtda tarifni o\'zgartirishingiz mumkin.' : isRu ? 'Выберите тариф, подходящий для вашего бизнеса. Повысить или снизить план можно в любое время.' : 'Select the tier that best fits your workload. Upgrade or downgrade anytime.'}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto items-stretch">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative backdrop-blur-xl p-8 rounded-3xl flex flex-col justify-between transition-all duration-500 border ${plan.style}`}
                >
                  <div>
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#d2bbff] to-[#4cd7f6] text-[#051424] px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg whitespace-nowrap border border-white/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {isUz ? 'Eng ommabop' : isRu ? 'Самый популярный' : 'Most popular'}
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight font-['Sora']">{plan.name}</h3>
                      <p className="text-slate-400 text-xs font-light mb-4 min-h-[32px]">{plan.desc}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white tracking-tighter font-['Sora']">{plan.price}</span>
                        <span className="text-xs text-slate-400 font-medium">{plan.period}</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-3.5 mb-10 pt-4 border-t border-white/5">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-[#4cd7f6]' : 'text-slate-500'}`} />
                          <span className="text-sm text-slate-300 font-light">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => navigate('/tizimlashtirish')}
                    className={`w-full rounded-xl h-11 font-bold text-sm transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#d2bbff] to-[#4cd7f6] text-[#051424] hover:opacity-95'
                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {isUz ? 'Tarifni tanlash' : isRu ? 'Выбрать тариф' : 'Choose plan'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#010f1f] pt-16 pb-8 px-4 md:px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#122131] rounded-lg flex items-center justify-center border border-white/10">
                  <Globe className="w-5 h-5 text-[#d2bbff]" />
                </div>
                <span className="font-bold text-xl text-white tracking-tight font-['Sora']">UniPath<span className="text-[#d2bbff]">.</span></span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs font-light">
                {isUz ? "Har qanday biznesni raqamlashtiradigan kuchli White-Label SaaS platformasi." : isRu ? "Мощная White-Label SaaS платформа для цифровизации любого бизнеса." : "The all-in-one White-Label SaaS platform for any business vertical."}
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide text-xs uppercase">{isUz ? 'Platforma' : isRu ? 'Платформа' : 'Platform'}</h4>
              <ul className="space-y-3 text-xs font-light">
                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">{isUz ? 'Imkoniyatlar' : isRu ? 'Возможности' : 'Features'}</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors">{isUz ? 'Narxlar' : isRu ? 'Цены' : 'Pricing'}</a></li>
                <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">{isUz ? 'Qanday ishlaydi' : isRu ? 'Как работает' : 'How it works'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide text-xs uppercase">{isUz ? 'Kompaniya' : isRu ? 'Компания' : 'Company'}</h4>
              <ul className="space-y-3 text-xs font-light">
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">{isUz ? 'Biz haqimizda' : isRu ? 'О нас' : 'About'}</Link></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{isUz ? "Bog'lanish" : isRu ? 'Контакты' : 'Contact'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide text-xs uppercase">{isUz ? 'Hujjatlar' : isRu ? 'Юридическое' : 'Legal'}</h4>
              <ul className="space-y-3 text-xs font-light">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{isUz ? 'Maxfiylik siyosati' : isRu ? 'Конфиденциальность' : 'Privacy'}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{isUz ? 'Foydalanish shartlari' : isRu ? 'Условия использования' : 'Terms'}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-light">
            <p className="text-center md:text-left">© 2026 UniPath SaaS. {isUz ? 'Barcha huquqlar himoyalangan.' : isRu ? 'Все права защищены.' : 'All rights reserved.'}</p>
            <p className="font-semibold text-slate-400">unipath.me</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


