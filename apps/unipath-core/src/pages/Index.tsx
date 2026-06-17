import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { PRICING_PLANS } from '@/core/constants/pricing';
import { LandingPage } from '@/components/landing/landing-page';
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
  const { user } = useAuth();
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
              {user ? (
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 px-5 rounded-lg transition-all hover:scale-[1.02]"
                >
                  {isUz ? 'Boshqaruv paneli' : 'Dashboard'}
                </Button>
              ) : (
                <>
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
                </>
              )}
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
              {user ? (
                <Button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                  className="w-full h-11 bg-primary text-white hover:bg-primary/90 rounded-xl text-sm font-bold shadow-lg"
                >
                  {isUz ? 'Boshqaruv paneli' : 'Dashboard'}
                </Button>
              ) : (
                <>
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
                </>
              )}
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
export default function Index({ forceSaaS }: { forceSaaS?: boolean } = {}) {
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
  return (
    <LandingPage 
      onLogin={() => navigate('/auth')} 
      onGetStarted={() => navigate('/tizimlashtirish')} 
    />
  );
}
