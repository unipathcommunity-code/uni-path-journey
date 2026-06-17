import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Globe, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  AlertCircle,
  Scissors,
  Loader2,
  GraduationCap,
  Bed,
  Pill,
  UtensilsCrossed,
  Dumbbell,
  Factory,
  Car,
  Wrench,
  Music,
  Library,
  HeartPulse,
  Tag,
  ShoppingBag,
  MapPin,
  Clock,
  DollarSign,
  Heart,
  Baby,
  BookOpen,
  Trophy,
  Plane
} from 'lucide-react';
import { THEME_PRESETS, injectTheme } from '@/lib/themes';

/** Default theme per vertical — auto-selected when business type is clicked */
const VERTICAL_DEFAULT_THEME: Record<string, string> = {
  consulting:    'blue',
  tour:          'blue',
  academy:       'emerald',
  hotel:         'purple',
  restaurant:    'amber',
  clinic:        'rose',
  gym:           'amber',
  manufacturing: 'blue',
  parking:       'blue',
  auto_service:  'amber',
  wholesale:     'blue',
  wedding_hall:  'rose',
  kindergarten:  'emerald',
  library:       'purple',
  stadium:       'emerald',
  cosmetics:     'rose',
  pharmacy:      'blue',
  car_showroom:  'blue',
};

const BUSINESS_TYPES = [
  { id: 'consulting', name: 'Konsalting (Consulting)', icon: Building, desc: 'Arizalar, hujjatlar va mijozlar oqimi boshqaruvi.' },
  { id: 'tour', name: 'Turistik Kompaniya (Tour)', icon: Plane, desc: 'Turlar boshqaruvi, bron qilishlar, va hamkorlar oqimi boshqaruvi.' },
  { id: 'academy', name: 'Akademiya (NOVA)', icon: GraduationCap, desc: 'Guruhlar, animated QR davomat, va NovaCoins loyallik tizimi boshqaruvi.' },
  { id: 'hotel', name: 'Mehmonxona (Hotel)', icon: Bed, desc: 'Xonalar jadvali, bron qilish va mijozlar hisob-kitoblari.' },
  { id: 'restaurant', name: 'Restoran (Restaurant)', icon: UtensilsCrossed, desc: 'Stollar xaritasi, taomlar menyusi va buyurtmalar navbati.' },
  { id: 'pharmacy', name: 'Dorixona (Pharmacy)', icon: Pill, desc: 'Dori-darmonlar inventari, yaroqlilik muddati va savdo.' },
  { id: 'gym', name: 'Sport Zali (Gym)', icon: Dumbbell, desc: 'A\'zolik paketlari, FaceID kirish va murabbiylar jadvali.' },
  { id: 'manufacturing', name: 'Ishlab Chiqarish (Manufacturing)', icon: Factory, desc: 'BOM (xomashyo), ishlab chiqarish bosqichlari va ishbay oyliklar.' },
  { id: 'auto_service', name: 'Avtoservis (Auto)', icon: Wrench, desc: 'Avtomobillar ta\'mirlash navbati va usta ish taqsimoti.' },
  { id: 'clinic', name: 'Klinika (Clinic)', icon: HeartPulse, desc: 'Bemorlar qabuli, shifokorlar va navbatlarni boshqarish.' },
  { id: 'parking', name: 'Avtoturargoh (Parking)', icon: Car, desc: 'Avtoturargoh sessiyalari va band joylarni nazorat qilish.' },
  { id: 'wedding_hall', name: 'To\'yxona (Wedding Hall)', icon: Heart, desc: 'Tadbirlar, to\'ylar, bandliklar jadvali va menyu hisobi.' },
  { id: 'kindergarten', name: 'Bog\'cha (Kindergarten)', icon: Baby, desc: 'Bolalar ro\'yxati, davomomat, guruhlar va to\'lovlar.' },
  { id: 'library', name: 'Kutubxona (Library)', icon: BookOpen, desc: 'Kitoblar fondi, a\'zolar, berilgan va qaytarilgan kitoblar.' },
  { id: 'cosmetics', name: 'Kosmetika (Cosmetics)', icon: Scissors, desc: 'Mahsulotlar zaxirasi, sotuvlar, yaroqlilik muddati va ogohlantirishlar.' },
  { id: 'stadium', name: 'Stadion (Stadium)', icon: Trophy, desc: 'Sport maydonlari bandligi va soatlik ijara nazorati.' },
  { id: 'car_showroom', name: 'Avtosalon (Car Dealership)', icon: Car, desc: 'Avtomobillar zaxirasi, lizing va shartnomalar, test-drayv boshqaruvi.' }
];

import { PRICING_PLANS } from '@/core/constants/pricing';

const getPlansForVertical = (vertical: string) => {
  const v = String(vertical || 'consulting').toLowerCase().trim();

  if (v === 'academy') {
    return [
      {
        id: 'Repetitor Starter',
        name: 'Repetitor Starter',
        price: '99 000',
        currency: 'UZS',
        desc: 'Yakka repetitor va individual o\'qituvchilar uchun',
        features: ['30 o\'quvchi', '1 ustoz', '5/18 faol modul', 'Guruhlar boshqaruvi', 'QR davomat']
      },
      {
        id: 'Repetitor Pro',
        name: 'Repetitor Pro',
        price: '199 000',
        currency: 'UZS',
        popular: true,
        desc: 'Professional repetitorlar va kichik guruhlar uchun',
        features: ['80 o\'quvchi', '1 ustoz', '12/18 faol modul', 'Ota-ona oynasi', 'To\'lovlar nazorati']
      },
      {
        id: 'Kurs Xona',
        name: 'Kurs Xona',
        price: '299 000',
        currency: 'UZS',
        desc: 'Kichik kurs xonalari va maxsus to\'garaklar uchun',
        features: ['100 o\'quvchi', '3 ta dars xonasi', '6/18 faol modul', 'Moliya va hisobot', 'Telegram Bot']
      },
      {
        id: 'Center Starter',
        name: 'Center Starter',
        price: '499 000',
        currency: 'UZS',
        desc: 'Kichik o\'quv markazlari va o\'quv kurslari uchun',
        features: ['200 o\'quvchi', '5 ustoz', '8/18 faol modul', 'Telegram xabarnomalar', 'Moliya nazorati']
      },
      {
        id: 'Center Pro',
        name: 'Center Pro',
        price: '799 000',
        currency: 'UZS',
        desc: 'Rivojlanayotgan o\'quv markazlari uchun eng yaxshi tanlov',
        features: ['500 o\'quvchi', '15 ustoz', '16/18 faol modul', 'Biometrik FaceID', 'Keng analitika']
      },
      {
        id: 'Center Premium',
        name: 'Center Premium',
        price: '1 299 000',
        currency: 'UZS',
        desc: 'Katta o\'quv markazlari va ko\'p filialli tarmoqlar uchun',
        features: ['1000 o\'quvchi', '40 ustoz', 'Barcha modullar yoqilgan', 'Custom Domain', '24/7 VIP ko\'mak']
      },
      {
        id: 'Academy Enterprise',
        name: 'Academy Enterprise',
        price: '1 990 000',
        currency: 'UZS',
        desc: 'Yirik ta\'lim akademiyalari va o\'quv muassasalari uchun',
        features: ['2000 o\'quvchi', 'Cheksiz ustozlar', 'NovaCoins loyallik do\'koni', 'Custom SMS Gateway', 'SLA kafolati']
      },
      {
        id: 'School Basic',
        name: 'School Basic',
        price: '2 990 000',
        currency: 'UZS',
        desc: 'Xususiy maktablar va litseylar uchun maxsus boshqaruv tizimi',
        features: ['3000 o\'quvchi', '100 ustoz', 'Dars jadvali generatori', 'SMS debt gateway', 'Dedicated server']
      }
    ];
  }

  if (v === 'tour') {
    return [
      {
        id: 'Tour Starter',
        name: 'Tour Starter',
        price: '149 000',
        currency: 'UZS',
        desc: 'Yangi boshlayotgan turistik agentliklar uchun',
        features: ['50 ta faol buyurtma', '2 ta xodim boshqaruvi', 'Turlar katalogi', 'Invoys PDF yaratish', 'Mijozlar bazasi (CRM)']
      },
      {
        id: 'Tour Pro',
        name: 'Tour Pro',
        price: '349 000',
        currency: 'UZS',
        popular: true,
        desc: 'Tez o\'sayotgan turizm agentliklari uchun',
        features: ['250 ta faol buyurtma', '10 ta xodim boshqaruvi', 'Komissiya & Markup nazorati', 'Telegram Bot va veb-sayt ulanishi', 'Buxgalteriya va hisobotlar']
      },
      {
        id: 'Tour Premium',
        name: 'Tour Premium',
        price: '799 000',
        currency: 'UZS',
        desc: 'Katta va faol turistik kompaniyalar uchun',
        features: ['1000 ta faol buyurtma', '30 ta xodim boshqaruvi', 'GDS Flight & Hotel integratsiyasi', 'API va xalqaro hamkorlik tizimi', 'SMS debt gateway integratsiyasi']
      },
      {
        id: 'Tour Enterprise',
        name: 'Tour Enterprise',
        price: '1 499 000',
        currency: 'UZS',
        desc: 'Cheksiz filiallar va yirik turistik tarmoqlar uchun',
        features: ['Cheksiz buyurtmalar', 'Cheksiz xodimlar boshqaruvi', '100% Ma\'lumotlar izolyatsiyasi', 'Custom Domain ulanishi', 'SLA barqarorlik kafolati']
      }
    ];
  }

  if (v === 'car_showroom') {
    return [
      {
        id: 'Showroom Starter',
        name: 'Showroom Starter',
        price: '249 000',
        currency: 'UZS',
        desc: 'Kichik avtosalonlar yoki dilerlik do\'konlari uchun',
        features: ['50 ta avtomobil limiti', '2 ta xodim boshqaruvi', 'Test-drive taqvimi', 'Standard CRM', 'Shartnomalar PDF']
      },
      {
        id: 'Showroom Pro',
        name: 'Showroom Pro',
        price: '549 000',
        currency: 'UZS',
        popular: true,
        desc: 'Professional avtosalonlar va dilerlik tarmoqlari uchun',
        features: ['250 ta avtomobil limiti', '10 ta xodim boshqaruvi', 'Lizing & Kredit kalkulyatori', 'Batafsil savdo tahlili', 'Telegram Bot xabarnomalari']
      },
      {
        id: 'Showroom Enterprise',
        name: 'Showroom Enterprise',
        price: '1 299 000',
        currency: 'UZS',
        desc: 'Yirik dilerlik markazlari va ko\'p filialli tarmoqlar uchun',
        features: ['Cheksiz avtomobillar', 'Cheksiz xodimlar boshqaruvi', 'Custom domain', 'Avtoservis tizimi integratsiyasi', 'SLA barqarorlik kafolati']
      }
    ];
  }

  if (v === 'hotel') {
    return [
      {
        id: 'Hotel Starter',
        name: 'Hostel / Kichik Mehmonxona',
        price: '199 000',
        currency: 'UZS',
        desc: 'Hostellar, mehmon uylari va kichik mehmonxonalar uchun',
        features: ['15 ta xona limiti', '3 ta xodim boshqaruvi', 'Xonalar jadvali & Bron', 'Standard CRM', 'Invoys PDF yaratish']
      },
      {
        id: 'Hotel Pro',
        name: 'Boutique Hotel',
        price: '499 000',
        currency: 'UZS',
        popular: true,
        desc: 'O\'rta kattalikdagi butik mehmonxonalar uchun',
        features: ['50 ta xona limiti', '15 ta xodim boshqaruvi', 'Xonalarni tozalash jadvali', 'Restoran & POS integratsiyasi', 'Telegram Bot ogohlantirishlari']
      },
      {
        id: 'Hotel Premium',
        name: 'Premium Hotel',
        price: '999 000',
        currency: 'UZS',
        desc: 'Katta mehmonxonalar va dam olish maskanlari uchun',
        features: ['150 ta xona limiti', '40 ta xodim boshqaruvi', 'Channel Manager integratsiyasi', 'Batafsil moliya va audit', 'Custom domain & brendlash']
      },
      {
        id: 'Hotel Enterprise',
        name: 'Resort Enterprise',
        price: '1 990 000',
        currency: 'UZS',
        desc: 'Ko\'p filialli yirik mehmonxona tarmoqlari uchun',
        features: ['Cheksiz xonalar', 'Cheksiz xodimlar', '100% Ma\'lumotlar izolyatsiyasi', 'API va hamkorlar tizimi', 'SLA barqarorlik kafolati']
      }
    ];
  }

  if (v === 'restaurant') {
    return [
      {
        id: 'Restaurant Starter',
        name: 'Kafe / Qahvaxona',
        price: '149 000',
        currency: 'UZS',
        desc: 'Kichik kafelar, qahvaxonalar va fast-food shoxobchalari uchun',
        features: ['1 ta kassa (POS)', 'Stollar xaritasi', 'Raqamli menyu (QR)', 'Buyurtmalar navbati', 'Standard hisobotlar']
      },
      {
        id: 'Restaurant Pro',
        name: 'Restoran Pro',
        price: '399 000',
        currency: 'UZS',
        popular: true,
        desc: 'Professional restoran va kafe-barlar uchun',
        features: ['3 ta kassa (POS)', 'Oshpaz ekrani (Kitchen Display)', 'Ofitsiantlar mobil ilovasi', 'Omborxona va kalkulyatsiya', 'Telegram Bot integratsiyasi']
      },
      {
        id: 'Restaurant Enterprise',
        name: 'Restoran Tarmog\'i',
        price: '899 000',
        currency: 'UZS',
        desc: 'Yirik restoran tarmoqlari va umumiy ovqatlanish markazlari uchun',
        features: ['Cheksiz kassalar', 'Filiallararo ombor integratsiyasi', 'Yetkazib berish boshqaruvi', 'Keng moliyaviy tahlil', 'Custom domain & 24/7 VIP yordam']
      }
    ];
  }

  if (v === 'pharmacy') {
    return [
      {
        id: 'Pharmacy Starter',
        name: 'Yakka Dorixona',
        price: '199 000',
        currency: 'UZS',
        desc: 'Kichik yakka tartibdagi dorixonalar uchun',
        features: ['10 000 ta dori limiti', '2 ta kassir boshqaruvi', 'Standard savdo oynasi', 'Yaroqlilik muddati nazorati', 'Barcode scanner integratsiyasi']
      },
      {
        id: 'Pharmacy Pro',
        name: 'Dorixona Pro',
        price: '499 000',
        currency: 'UZS',
        popular: true,
        desc: 'Professional dorixonalar uchun to\'liq boshqaruv',
        features: ['50 000 ta dori limiti', '10 ta kassir boshqaruvi', 'Yetkazib beruvchilar bazasi', 'Avtomatik buyurtma tizimi', 'Soliq & Chek integratsiyasi']
      },
      {
        id: 'Pharmacy Enterprise',
        name: 'Dorixona Tarmog\'i',
        price: '1 199 000',
        currency: 'UZS',
        desc: 'Yirik dorixona tarmoqlari va markaziy omborxonalar uchun',
        features: ['Cheksiz dori limiti', 'Cheksiz filiallar & kassirlar', 'Markaziy ombor nazorati', 'Keng dorixona analitikasi', 'Custom domain & SLA kafolati']
      }
    ];
  }

  if (v === 'gym') {
    return [
      {
        id: 'Gym Starter',
        name: 'Fitness Studiya',
        price: '149 000',
        currency: 'UZS',
        desc: 'Kichik fitness studiyalar va yoga markazlari uchun',
        features: ['150 ta faol a\'zo', '3 ta murabbiy boshqaruvi', 'A\'zolik paketlari', 'Standard CRM', 'Darslar jadvali']
      },
      {
        id: 'Gym Pro',
        name: 'Fitness Club Pro',
        price: '399 000',
        currency: 'UZS',
        popular: true,
        desc: 'Kattaroq fitness klublari va sport zallari uchun',
        features: ['500 ta faol a\'zo', '15 ta murabbiy boshqaruvi', 'QR / FaceID kirish nazorati', 'Shkafchalar nazorati', 'Telegram bildirishnomalar']
      },
      {
        id: 'Gym Enterprise',
        name: 'Sport Kompleks Premium',
        price: '899 000',
        currency: 'UZS',
        desc: 'Yirik sport majmualari va ko\'p tarmoqli fitness zanjirlari uchun',
        features: ['Cheksiz faol a\'zolar', 'Cheksiz murabbiylar', 'Hovuz/Spa band qilish modullari', 'Batafsil moliya va HR', 'Custom Domain & VIP yordam']
      }
    ];
  }

  if (v === 'manufacturing') {
    return [
      {
        id: 'Mfg Starter',
        name: 'Kichik Sex / Ustaxona',
        price: '299 000',
        currency: 'UZS',
        desc: 'Kichik ishlab chiqarish sexlari va xususiy ustaxonalar uchun',
        features: ['Xomashyo ombori', 'BOM (Mahsulot tarkibi)', 'Oddiy ishlab chiqarish bosqichlari', 'Tayyor mahsulot hisobi', 'Invoyslar PDF']
      },
      {
        id: 'Mfg Pro',
        name: 'Zavod Pro',
        price: '799 000',
        currency: 'UZS',
        popular: true,
        desc: 'Professional zavodlar va ishlab chiqarish korxonalari uchun',
        features: ['Ko\'p bosqichli ishlab chiqarish', 'Ishbay oylik hisobi', 'Mahsulot tannarxi kalkulyatori', 'Omborlararo transfer', 'Sifat nazorati (QA) moduli']
      },
      {
        id: 'Mfg Enterprise',
        name: 'Sanoat Enterprise',
        price: '1 699 000',
        currency: 'UZS',
        desc: 'Yirik sanoat korxonalari va ko\'p sexli kombinatlar uchun',
        features: ['Cheksiz xomashyo va mahsulotlar', 'Ta\'minot zanjiri boshqaruvi', 'Barcode/RFID nazorati', 'Dastgohlar yuklama tahlili', 'SLA kafolati & VIP yordam']
      }
    ];
  }

  if (v === 'auto_service') {
    return [
      {
        id: 'Auto Starter',
        name: 'Kichik Avtoservis',
        price: '149 000',
        currency: 'UZS',
        desc: 'Kichik ustaxonalar va shinalar montaji nuqtalari uchun',
        features: ['3 ta ta\'mirlash boksi', 'Navbatlar boshqaruvi', 'Mijozlar bazasi', 'Ehtiyot qismlar hisobi', 'Cheklar PDF']
      },
      {
        id: 'Auto Pro',
        name: 'Auto Kompleks Pro',
        price: '399 000',
        currency: 'UZS',
        popular: true,
        desc: 'Katta avtoservislar va texnik xizmat ko\'rsatish markazlari uchun',
        features: ['10 ta ta\'mirlash boksi', 'Usta ish taqsimoti', 'Ehtiyot qismlar ombori (Kalkulyatsiya)', 'Telegram Bot bildirishnomalar', 'Standard CRM Pipeline']
      },
      {
        id: 'Auto Enterprise',
        name: 'Dilerlik Servisi',
        price: '899 000',
        currency: 'UZS',
        desc: 'Yirik servis markazlari va dilerlik texnik tarmoqlari uchun',
        features: ['Cheksiz ta\'mirlash bokslari', 'Avtomatlashtirilgan hisob-kitoblar', 'SMS debt gateway integratsiyasi', 'Moliya va to\'liq audit', 'Custom domain & SLA kafolati']
      }
    ];
  }

  if (v === 'clinic') {
    return [
      {
        id: 'Clinic Starter',
        name: 'Shifokorlik Kabineti',
        price: '199 000',
        currency: 'UZS',
        desc: 'Yakka shifokorlar va xususiy kichik kabinetlar uchun',
        features: ['3 ta shifokor limiti', 'Bemorlar navbati taqvimi', 'Elektron tibbiy kartalar', 'Kassir & To\'lovlar', 'Invoys PDF']
      },
      {
        id: 'Clinic Pro',
        name: 'Klinika Pro',
        price: '599 000',
        currency: 'UZS',
        popular: true,
        desc: 'Professional xususiy klinikalar va tashxis markazlari uchun',
        features: ['15 ta shifokor limiti', 'Bemorlarni qabul qilish navbati', 'Retsept va yo\'llanmalar', 'Laboratoriya integratsiyasi', 'Telegram Bot ogohlantirishlari']
      },
      {
        id: 'Clinic Enterprise',
        name: 'Klinika Markazi',
        price: '1 299 000',
        currency: 'UZS',
        desc: 'Ko\'p tarmoqli yirik klinikalar va kasalxonalar uchun',
        features: ['Cheksiz shifokorlar', 'Dorixona moduli integratsiyasi', 'Batafsil shifokorlar analitikasi', 'Custom domain & RLS ma\'lumotlar himoyasi', 'SLA barqarorlik kafolati']
      }
    ];
  }

  if (v === 'parking') {
    return [
      {
        id: 'Parking Starter',
        name: 'Kichik Parking',
        price: '99 000',
        currency: 'UZS',
        desc: 'Kichik ochiq avtoturargohlar uchun',
        features: ['1 ta kirish to\'sig\'i (shlagbaum)', 'Soatbay to\'lov hisoblagichi', 'Band joylar nazorati', 'Mijozlar ro\'yxati', 'Standard hisobotlar']
      },
      {
        id: 'Parking Pro',
        name: 'Parking Pro',
        price: '249 000',
        currency: 'UZS',
        popular: true,
        desc: 'Professional yopiq va ko\'p qavatli parkinglar uchun',
        features: ['3 ta kirish to\'sig\'i', 'Kamera (ANPR) integratsiyasi', 'Abonementlar nazorati', 'SMS debt gateway integratsiyasi', 'Telegram Bot boshqaruvi']
      },
      {
        id: 'Parking Enterprise',
        name: 'Smart Parking Enterprise',
        price: '599 000',
        currency: 'UZS',
        desc: 'Aeroportlar, savdo markazlari va yirik parking tarmoqlari uchun',
        features: ['Cheksiz kirish to\'siqlari', 'Smart datchiklar xaritasi', 'Avtomatik to\'lov terminallari', 'Batafsil moliyaviy tahlil', 'SLA kafolati & VIP yordam']
      }
    ];
  }

  if (v === 'wedding_hall') {
    return [
      {
        id: 'Wedding Starter',
        name: 'Kichik To\'yxona',
        price: '299 000',
        currency: 'UZS',
        desc: 'Kichik tadbirlar zallari va kafelar uchun',
        features: ['Tadbirlar bandlik taqvimi', 'Menyu konstruktori', 'Mijozlar bazasi', 'Avans to\'lovlari hisobi', 'Hisobotlar PDF']
      },
      {
        id: 'Wedding Pro',
        name: 'To\'yxona Pro',
        price: '699 000',
        currency: 'UZS',
        popular: true,
        desc: 'Professional tantanalar zallari va to\'yxonalar uchun',
        features: ['Ko\'p zalli taqvim boshqaruvi', 'Xomashyo & Mahsulotlar ombori', 'Taomlar kalkulyatsiyasi', 'Hamkorlar (musiqachilar/boshlovchilar) bazasi', 'Telegram Bot ogohlantirishlari']
      },
      {
        id: 'Wedding Enterprise',
        name: 'Tantanalar Saroyi',
        price: '1 399 000',
        currency: 'UZS',
        desc: 'Hashamatli tantanalar saroylari va restoran majmualari uchun',
        features: ['Cheksiz tadbirlar & zallar', '3D stollar joylashuv xaritasi', 'Batafsil HR va moliya nazorati', 'Custom domain & VIP yordam', 'SLA barqarorlik kafolati']
      }
    ];
  }

  if (v === 'kindergarten') {
    return [
      {
        id: 'Kdg Starter',
        name: 'Oilaviy Bog\'cha',
        price: '149 000',
        currency: 'UZS',
        desc: 'Oilaviy bog\'chalar va kichik guruhlar uchun',
        features: ['30 ta bola limiti', '2 ta tarbiyachi boshqaruvi', 'Davomat tizimi', 'Ota-onalar bilan bog\'lanish', 'To\'lovlar hisobi']
      },
      {
        id: 'Kdg Pro',
        name: 'Bog\'cha Pro',
        price: '399 000',
        currency: 'UZS',
        popular: true,
        desc: 'Xususiy bog\'chalar va bolalar markazlari uchun',
        features: ['100 ta bola limiti', '10 ta tarbiyachi boshqaruvi', 'Guruhlar va dars jadvallari', 'Taomnoma (ovqatlanish) hisobi', 'Telegram Bot xabarnomalari']
      },
      {
        id: 'Kdg Enterprise',
        name: 'Bog\'cha Tarmog\'i',
        price: '899 000',
        currency: 'UZS',
        desc: 'Yirik bog\'cha tarmoqlari va xususiy maktabgacha ta\'lim muassasalari uchun',
        features: ['Cheksiz bolalar & tarbiyachilar', 'Avtomatik oylik billing to\'lovlari', 'Bolalar rivojlanish hisobotlari', 'Custom domain & brending', 'SLA barqarorlik kafolati']
      }
    ];
  }

  if (v === 'library') {
    return [
      {
        id: 'Lib Starter',
        name: 'Book Cafe / Kutubxona',
        price: '99 000',
        currency: 'UZS',
        desc: 'Kitob kafelari va kichik xususiy kutubxonalar uchun',
        features: ['1000 ta kitob limiti', 'Kitobxon a\'zolik kartalari', 'Kitob berish va qaytarish', 'Muddati o\'tganlik ogohlantirishlari', 'Standard hisobotlar']
      },
      {
        id: 'Lib Pro',
        name: 'Kutubxona Pro',
        price: '249 000',
        currency: 'UZS',
        popular: true,
        desc: 'Professional kutubxonalar va maktab kutubxonalari uchun',
        features: ['10 000 ta kitob limiti', 'Barcode/QR tizimi', 'Kutubxona navbatlar taqvimi', 'Kitobxonlar jarimalari hisobi', 'Telegram Bot integratsiyasi']
      },
      {
        id: 'Lib Enterprise',
        name: 'Kutubxonalar Tarmog\'i',
        price: '599 000',
        currency: 'UZS',
        desc: 'Yirik davlat va xususiy kutubxona tarmoqlari uchun',
        features: ['Cheksiz kitoblar', 'Raqamli kutubxona (E-book) moduli', 'Filiallararo kitob qidiruv tizimi', 'Custom domain ulanishi', 'SLA barqarorlik kafolati']
      }
    ];
  }

  if (v === 'cosmetics') {
    return [
      {
        id: 'Cosmetics Starter',
        name: 'Kichik Do\'kon',
        price: '149 000',
        currency: 'UZS',
        desc: 'Kichik kosmetika do\'konlari va orollar uchun',
        features: ['1 ta kassa (POS)', 'Mahsulotlar ombori', 'Standard CRM', 'Yaroqlilik muddati nazorati', 'Barcode scanner integratsiyasi']
      },
      {
        id: 'Cosmetics Pro',
        name: 'Kosmetika Pro',
        price: '349 000',
        currency: 'UZS',
        popular: true,
        desc: 'Professional kosmetika do\'konlari uchun to\'liq boshqaruv',
        features: ['3 ta kassa (POS)', 'Mijozlar loyallik tizimi (Bonuslar)', 'Brendlar bo\'yicha zaxira tahlili', 'Telegram Bot integratsiyasi', 'Buxgalteriya va hisobotlar']
      },
      {
        id: 'Cosmetics Enterprise',
        name: 'Do\'konlar Tarmog\'i',
        price: '799 000',
        currency: 'UZS',
        desc: 'Yirik kosmetika do\'konlari zanjirlari va tarqatuvchilar uchun',
        features: ['Cheksiz kassalar & do\'konlar', 'Markaziy ulgurji ombor', 'Avtomatik buyurtmalar va yetkazib berish', 'Custom domain & 24/7 VIP yordam', 'SLA barqarorlik kafolati']
      }
    ];
  }

  if (v === 'stadium') {
    return [
      {
        id: 'Stadium Starter',
        name: 'Yakka Stadion',
        price: '129 000',
        currency: 'UZS',
        desc: 'Kichik yakka tartibdagi sun\'iy qoplamali stadionlar uchun',
        features: ['1 ta maydon limiti', 'Soatbay bandlik taqvimi', 'Mijozlar ro\'yxati', 'Yoritish & Dush xizmatlari hisobi', 'Invoyslar PDF']
      },
      {
        id: 'Stadium Pro',
        name: 'Sport Majmuasi Pro',
        price: '299 000',
        currency: 'UZS',
        popular: true,
        desc: 'Kattaroq sport majmualari va ko\'p maydonli stadionlar uchun',
        features: ['5 ta maydon limiti', 'Kiyinish xonalari taqsimoti', 'Mijozlar avans to\'lovlari nazorati', 'Telegram Bot integratsiyasi', 'Standard CRM Pipeline']
      },
      {
        id: 'Stadium Enterprise',
        name: 'Stadiumlar Zanjiri',
        price: '699 000',
        currency: 'UZS',
        desc: 'Yirik sport arenalari va stadionlar zanjirlari uchun',
        features: ['Cheksiz maydonlar', 'Onlayn band qilish vidjeti', 'Mijozlar loyallik tizimi', 'SMS debt gateway integratsiyasi', 'Custom domain & SLA kafolati']
      }
    ];
  }

  // Default / Consulting / UniPath
  return [
    {
      id: 'Consulting Starter',
      name: 'Consulting Starter',
      price: '199 000',
      currency: 'UZS',
      desc: 'Kichik konsalting va viza markazlari uchun',
      features: ['100 ta arizachi limiti', '3 ta xodim boshqaruvi', 'Hujjatlarni avtomatlashtirish', 'E\'lonlar taxtasi', 'Standard CRM Pipeline']
    },
    {
      id: 'Consulting Pro',
      name: 'Consulting Pro',
      price: '499 000',
      currency: 'UZS',
      popular: true,
      desc: 'Professional konsalting agentliklari uchun',
      features: ['500 ta arizachi limiti', '15 ta xodim boshqaruvi', 'Chet el universitetlari API sinxronizatsiyasi', 'Buxgalteriya va to\'lovlar nazorati', 'Telegram Bot va bildirishnomalar']
    },
    {
      id: 'Consulting Premium',
      name: 'Consulting Premium',
      price: '1 199 000',
      currency: 'UZS',
      desc: 'Yirik konsalting tarmoqlari va agentliklari uchun',
      features: ['1500 ta arizachi limiti', '40 ta xodim boshqaruvi', 'Hamkor xalqaro universitetlar portali', 'Mentor va kutib olish modullari', 'Custom branding va rang sxemalari']
    },
    {
      id: 'Office Enterprise',
      name: 'Office Enterprise',
      price: '2 499 000',
      currency: 'UZS',
      desc: 'Transmilliy va yirik korporativ tarmoqlar uchun',
      features: ['Cheksiz arizachilar', 'Cheksiz xodimlar boshqaruvi', 'Custom Domain ulanishi', 'VIP 24/7 bag\'ishlangan yordam', 'SLA kafolati va yuqori xavfsizlik']
    }
  ];
};

export default function Systematize() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    subdomain: '',
    businessType: 'consulting',
    plan: 'Consulting Pro',
    branchName: 'Main Branch / Bosh Filial',
    branchAddress: 'Tashkent, Uzbekistan',
    timezone: 'Asia/Tashkent',
    currency: 'UZS',
    themeColor: 'emerald'
  });

  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  useEffect(() => {
    async function loadPlans() {
      setIsLoadingPlans(true);
      try {
        const { data, error } = await (supabase as any)
          .from('pricing_plans')
          .select('*')
          .eq('vertical', formData.businessType);
        
        let activePlans = [];
        if (error) throw error;
        if (data && data.length > 0) {
          activePlans = data.map((item: any) => ({
            id: item.name,
            name: item.name,
            price: item.price,
            currency: item.currency,
            desc: item.description,
            features: Array.isArray(item.features) ? item.features : [],
            popular: !!item.popular
          }));
          setDbPlans(activePlans);
        } else {
          activePlans = getPlansForVertical(formData.businessType);
          setDbPlans(activePlans);
        }

        const planExists = activePlans.some(p => p.id === formData.plan);
        if (!planExists && activePlans.length > 0) {
          const popularPlan = activePlans.find(p => p.popular) || activePlans[0];
          setFormData(prev => ({ ...prev, plan: popularPlan.id }));
        }
      } catch (err) {
        const fallbackPlans = getPlansForVertical(formData.businessType);
        setDbPlans(fallbackPlans);
        const planExists = fallbackPlans.some(p => p.id === formData.plan);
        if (!planExists && fallbackPlans.length > 0) {
          const popularPlan = fallbackPlans.find(p => p.popular) || fallbackPlans[0];
          setFormData(prev => ({ ...prev, plan: popularPlan.id }));
        }
      } finally {
        setIsLoadingPlans(false);
      }
    }
    loadPlans();
  }, [formData.businessType]);

  // Check subdomain availability
  useEffect(() => {
    if (!formData.subdomain || formData.subdomain.length < 3) {
      setSubdomainStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setSubdomainStatus('checking');
      try {
        const { data, error } = await (supabase as any)
          .from('tenants')
          .select('id')
          .eq('subdomain', formData.subdomain.toLowerCase())
          .maybeSingle();

        if (error) throw error;
        setSubdomainStatus(data ? 'taken' : 'available');
      } catch (err) {
        console.error('Subdomain validation error:', err);
        setSubdomainStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.subdomain]);

  // Live apply theme during preview selection
  useEffect(() => {
    injectTheme(formData.themeColor);
  }, [formData.themeColor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (subdomainStatus === 'taken') {
      toast({
        title: 'Xatolik',
        description: 'Bu subdomen allaqachon band. Boshqa subdomen tanlang.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the tenant first with status Pending to allow superadmin approval
      const { data: tenant, error: tenantError } = await (supabase as any)
        .from('tenants')
        .insert({
          name: formData.companyName,
          subdomain: formData.subdomain.toLowerCase(),
          status: 'pending',
          plan: formData.plan,
          owner_name: formData.ownerName,
          owner_email: formData.email,
          owner_phone: formData.phone,
          vertical: formData.businessType,
          config: {
            business_type: formData.businessType,
            branding: {
              theme_color: formData.themeColor,
              currency: formData.currency,
              timezone: formData.timezone
            },
            modules: {
              // Exactly one vertical is true — matches formData.businessType
              consulting:    formData.businessType === 'consulting',
              tour:          formData.businessType === 'tour',
              academy:       formData.businessType === 'academy',
              hotel:         formData.businessType === 'hotel',
              restaurant:    formData.businessType === 'restaurant',
              pharmacy:      formData.businessType === 'pharmacy',
              gym:           formData.businessType === 'gym',
              manufacturing: formData.businessType === 'manufacturing',
              auto_service:  formData.businessType === 'auto_service',
              clinic:        formData.businessType === 'clinic',
              parking:       formData.businessType === 'parking',
              wedding_hall:  formData.businessType === 'wedding_hall',
              kindergarten:  formData.businessType === 'kindergarten',
              library:       formData.businessType === 'library',
              cosmetics:     formData.businessType === 'cosmetics',
              stadium:       formData.businessType === 'stadium',
              car_showroom:  formData.businessType === 'car_showroom',
              ai_camera:     formData.plan !== 'Starter',
              billing:       true
            }
          }
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 2. Register Owner User first (this creates the auth session)
      const { data: signUpData, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.ownerName,
        {
          tenant_id: tenant.id,
          role: 'owner'
        }
      );

      if (signUpError) throw signUpError;

      // 3. Insert the initial Branch AFTER signup so RLS sees authenticated user
      // Wait a moment for session to propagate
      await new Promise(resolve => setTimeout(resolve, 800));

      let branchId: string | null = null;
      try {
        const { data: branch, error: branchError } = await (supabase as any)
          .from('branches')
          .insert({
            tenant_id: tenant.id,
            name: formData.branchName || formData.companyName + ' - Asosiy filial',
            address: formData.branchAddress || '',
            timezone: formData.timezone,
            currency: formData.currency
          })
          .select()
          .single();

        if (!branchError && branch) {
          branchId = branch.id;
          // Update profile with branch_id
          if (signUpData?.user?.id) {
            await (supabase as any).from('profiles')
              .update({ branch_id: branchId })
              .eq('user_id', signUpData.user.id);
          }
        }
      } catch (branchErr) {
        // Branch creation failed but registration succeeded — branch can be created later
        console.warn('Branch creation skipped:', branchErr);
      }

      toast({
        title: 'Muvaffaqiyatli ro\'yxatdan o\'tildi!',
        description: 'Sizning so\'rovingiz muvaffaqiyatli yuborildi. Super admin tasdiqlashini kuting.'
      });

      // Navigate to pending approval screen after successful registration
      navigate('/pending-approval');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Xatolik yuz berdi',
        description: error.message || 'Iltimos, qaytadan urinib ko\'ring',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground selection:bg-primary/30 font-sans overflow-x-hidden relative flex flex-col justify-between">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[130px]" />
        <div className="absolute inset-0 noise-overlay opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#0A0A0A]/40 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-20 px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/auth" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Kirish
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-4xl">
          {/* Progress indicators */}
          <div className="flex items-center justify-between max-w-xl mx-auto mb-10">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= 1 ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white/40'}`}>
                1
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-white' : 'text-white/40'}`}>Biznes</span>
            </div>
            <div className="flex-1 h-[2px] bg-white/5 mx-4" />
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= 2 ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white/40'}`}>
                2
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-white' : 'text-white/40'}`}>Tariflar</span>
            </div>
            <div className="flex-1 h-[2px] bg-white/5 mx-4" />
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= 3 ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white/40'}`}>
                3
              </div>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-white' : 'text-white/40'}`}>Sozlash</span>
            </div>
            <div className="flex-1 h-[2px] bg-white/5 mx-4" />
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= 4 ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white/40'}`}>
                4
              </div>
              <span className={`text-sm font-medium ${step >= 4 ? 'text-white' : 'text-white/40'}`}>Egalik</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Biznes turini tanlang</h1>
                  <p className="text-white/60 max-w-lg mx-auto">UNI platformasi orqali boshqarmoqchi bo‘lgan biznes modelingizni belgilang.</p>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {BUSINESS_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.id}
                        onClick={() => {
                          const defaultTheme = VERTICAL_DEFAULT_THEME[type.id] || 'emerald';
                          let defaultPlan = 'Consulting Pro';
                          if (type.id === 'academy') defaultPlan = 'Tutor Pro';
                          else if (type.id === 'tour') defaultPlan = 'Tour Pro';
                          else if (type.id === 'car_showroom') defaultPlan = 'Showroom Pro';
                          
                          setFormData({ 
                            ...formData, 
                            businessType: type.id, 
                            themeColor: defaultTheme,
                            plan: defaultPlan
                          });
                          injectTheme(defaultTheme);
                        }}
                        className={`cursor-pointer border p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between hover:bg-[#151515] ${
                          formData.businessType === type.id
                            ? 'border-primary bg-primary/5 shadow-[0_0_25px_rgba(var(--primary),0.15)]'
                            : 'border-white/5 bg-[#111111]/80 hover:border-white/10'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            formData.businessType === type.id ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-white'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm">{type.name}</h3>
                            <p className="text-white/50 text-xs mt-1 leading-relaxed">{type.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setStep(2)}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  >
                    Davom etish <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Tarif rejangizni tanlang</h1>
                  <p className="text-white/60 max-w-lg mx-auto">Sizning biznesingizga to'g'ri keladigan eng maqbul tarif rejasini tanlang va professional boshqaruvga ega bo'ling.</p>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {isLoadingPlans ? (
                    <div className="col-span-full flex justify-center py-12">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  ) : dbPlans.length === 0 ? (
                    <div className="col-span-full text-center text-white/40 text-sm py-12">Tariflar topilmadi</div>
                  ) : (
                    dbPlans.map((p) => {
                      const isSelected = formData.plan === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setFormData({ ...formData, plan: p.id })}
                          className={`relative cursor-pointer border p-6 rounded-[2rem] transition-all duration-300 flex flex-col justify-between hover:bg-[#151515] ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(var(--primary),0.15)] ring-1 ring-primary/20'
                              : 'border-white/5 bg-[#111111]/80 hover:border-white/10'
                          }`}
                        >
                          {p.popular && (
                            <span className="absolute -top-3 right-6 bg-primary text-primary-foreground text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                              Mashhur
                            </span>
                          )}
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-extrabold text-white text-lg">{p.name}</h3>
                              <p className="text-white/50 text-xs mt-1 leading-relaxed min-h-[32px]">{p.desc}</p>
                            </div>
                            
                            <div className="py-2">
                              <span className="text-3xl font-black text-white">{p.price}</span>
                              <span className="text-white/40 text-xs ml-1 font-semibold">{p.currency}/oy</span>
                            </div>

                            <div className="border-t border-white/5 pt-4 space-y-2">
                              {p.features.map((feat: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 text-xs">
                                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                  <span className="text-white/70 leading-normal">{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-6">
                            <Button
                              className={`w-full font-bold rounded-xl h-11 transition-all ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/95'
                                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                              }`}
                            >
                              {isSelected ? "Tanlandi" : "Tanlash"}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button 
                    onClick={() => setStep(1)}
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-6 py-6"
                  >
                    <ArrowLeft className="mr-2 w-5 h-5" /> Orqaga
                  </Button>

                  <Button 
                    onClick={() => setStep(3)}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  >
                    Davom etish <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-3 text-white">Tizim va Filial Sozlamalari</h1>
                  <p className="text-white/60">Tizimingiz qaysi nom hamda sozlamalarda joylashishini belgilang.</p>
                </div>

                <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 grid md:grid-cols-2 gap-6">
                  
                  {/* General */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-white/90 text-sm border-b border-white/5 pb-2">Kompaniya</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-white/80 font-medium text-xs">Kompaniya nomi</Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="companyName"
                          type="text"
                          placeholder="Masalan: Grand Hotel, Uni Academy"
                          className="pl-11 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50 text-sm"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subdomain" className="text-white/80 font-medium text-xs">Maxsus subdomen</Label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="subdomain"
                          type="text"
                          placeholder="grand-hotel"
                          className="pl-11 pr-24 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50 font-mono text-sm"
                          value={formData.subdomain}
                          onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.replace(/[^a-zA-Z0-9-]/g, '') })}
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-mono font-medium text-xs">
                          .unipath.me
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 px-1 text-[10px]">
                        {subdomainStatus === 'checking' && (
                          <span className="text-white/40 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Tekshirilmoqda...
                          </span>
                        )}
                        {subdomainStatus === 'available' && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Band emas va foydalanishga tayyor
                          </span>
                        )}
                        {subdomainStatus === 'taken' && (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Afsuski, bu subdomen band
                          </span>
                        )}
                        {subdomainStatus === 'idle' && (
                          <span className="text-white/30">Kamida 3 ta belgi kiriting</span>
                        )}
                      </div>
                    </div>

                    {/* Theme Preset Selection */}
                    <div className="space-y-2">
                      <Label className="text-white/80 font-medium text-xs">Brending (Mavzu rangi)</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {THEME_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, themeColor: p.id })}
                            className={`h-10 rounded-xl border flex items-center justify-center transition-all ${
                              formData.themeColor === p.id ? 'border-white bg-white/10 scale-105' : 'border-white/5 bg-[#171717]'
                            }`}
                            title={p.nameUz}
                          >
                            <span 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: p.colorHex }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Branch & Localization */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-white/90 text-sm border-b border-white/5 pb-2">Bosh Filial (Bosh ofis)</h3>

                    <div className="space-y-2">
                      <Label htmlFor="branchName" className="text-white/80 font-medium text-xs">Filial nomi</Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="branchName"
                          type="text"
                          className="pl-11 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50 text-sm"
                          value={formData.branchName}
                          onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branchAddress" className="text-white/80 font-medium text-xs">Manzil</Label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="branchAddress"
                          type="text"
                          className="pl-11 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50 text-sm"
                          value={formData.branchAddress}
                          onChange={(e) => setFormData({ ...formData, branchAddress: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-white/80 font-medium text-xs">Vaqt hududi</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <select
                            id="timezone"
                            className="w-full pl-9 pr-3 h-12 bg-[#171717] border border-white/10 rounded-xl text-white focus:border-primary/50 text-xs appearance-none"
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          >
                            <option value="Asia/Tashkent">Toshkent (GMT+5)</option>
                            <option value="Asia/Dubai">Dubay (GMT+4)</option>
                            <option value="Europe/London">London (GMT+0)</option>
                            <option value="America/New_York">Nyu York (GMT-5)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currency" className="text-white/80 font-medium text-xs">Asosiy valyuta</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <select
                            id="currency"
                            className="w-full pl-9 pr-3 h-12 bg-[#171717] border border-white/10 rounded-xl text-white focus:border-primary/50 text-xs appearance-none"
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          >
                            <option value="UZS">So‘m (UZS)</option>
                            <option value="USD">AQSH Dollari (USD)</option>
                            <option value="EUR">Yevro (EUR)</option>
                            <option value="RUB">Rubl (RUB)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-between items-center pt-4">
                  <Button 
                    onClick={() => setStep(2)}
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-6 py-6"
                  >
                    <ArrowLeft className="mr-2 w-5 h-5" /> Orqaga
                  </Button>
                  
                  <Button 
                    onClick={() => setStep(4)}
                    disabled={!formData.companyName || formData.subdomain.length < 3 || subdomainStatus !== 'available' || !formData.branchName}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-40"
                  >
                    Davom etish <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="max-w-xl mx-auto space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-3 text-white">Egalik va Login Sozlamalari</h1>
                  <p className="text-white/60">Tizim egasi (Super Admin huquqidagi admin) ma'lumotlarini to'ldiring.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName" className="text-white/80 font-medium">To'liq ism va familiyangiz</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          id="ownerName"
                          type="text"
                          placeholder="John Doe"
                          className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          value={formData.ownerName}
                          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80 font-medium">Email manzilingiz (Login uchun)</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@mail.com"
                          className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white/80 font-medium">Telefon raqam</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+998 (90) 123-45-67"
                          className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pass" className="text-white/80 font-medium">Parol yarating</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          id="pass"
                          type="password"
                          placeholder="••••••••"
                          className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </Card>

                  <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl text-sm">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-white/70 leading-relaxed">
                      "UNI" tizimi avtomatik tarzda to‘liq yig‘iladi va barcha tanlangan biznes modullari, filiallar va oylik billing boshqaruvi sozlanadi.
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      type="button"
                      onClick={() => setStep(3)}
                      variant="ghost"
                      className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-6 py-6"
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="mr-2 w-5 h-5" /> Orqaga
                    </Button>
                    
                    <Button 
                      type="submit"
                      disabled={isSubmitting || !formData.ownerName || !formData.email || !formData.phone || formData.password.length < 6}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-40 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Yozilmoqda...
                        </>
                      ) : (
                        <>
                          Onboardingni Yakunlash <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5">
        <div className="container mx-auto px-6 text-center text-sm text-white/40">
          © 2026 UniPath SaaS. Barcha huquqlar himoyalangan.
        </div>
      </footer>
    </div>
  );
}
