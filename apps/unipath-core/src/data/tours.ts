import samarkandImg from "@/assets/hero-samarkand.jpg";
import bukharaImg from "@/assets/bukhara-tour.jpg";
import khivaImg from "@/assets/khiva-tour.jpg";
import turkeyImg from "@/assets/turkey-tour.jpg";
import dubaiImg from "@/assets/dubai-tour.jpg";
import zominImg from "@/assets/zomin-tour.jpg";

export interface TourItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  id: string;
  title: string;
  destination: string;
  country: string;
  region: "uzbekistan" | "asia" | "europe" | "arab" | "international";
  duration: {
    days: number;
    nights: number;
  };
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  tourType: "family" | "group" | "luxury" | "budget" | "adventure";
  included: string[];
  excluded: string[];
  itinerary: TourItineraryDay[];
  availableDates: string[];
  maxPeople: number;
  operatorId: string;
  operatorName: string;
  featured: boolean;
  status: "pending" | "approved" | "rejected";
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: "uzbekistan" | "asia" | "europe" | "arab" | "international";
  image: string;
  tourCount: number;
}

export const destinations: Destination[] = [
  // O'zbekiston
  { id: "samarkand", name: "Samarqand", country: "O'zbekiston", region: "uzbekistan", image: samarkandImg, tourCount: 12 },
  { id: "bukhara", name: "Buxoro", country: "O'zbekiston", region: "uzbekistan", image: bukharaImg, tourCount: 8 },
  { id: "khiva", name: "Xiva", country: "O'zbekiston", region: "uzbekistan", image: khivaImg, tourCount: 6 },
  { id: "zomin", name: "Zomin", country: "O'zbekiston", region: "uzbekistan", image: zominImg, tourCount: 5 },
  
  // Osiyo
  { id: "thailand", name: "Tailand", country: "Bangkok, Phuket", region: "asia", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800", tourCount: 8 },
  { id: "malaysia", name: "Malayziya", country: "Kuala Lumpur", region: "asia", image: "https://images.unsplash.com/photo-1508062878650-88b52897f298?w=800", tourCount: 6 },
  { id: "singapore", name: "Singapur", country: "Singapur", region: "asia", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800", tourCount: 4 },
  { id: "indonesia", name: "Indoneziya", country: "Bali", region: "asia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", tourCount: 7 },
  
  // Yevropa
  { id: "turkey", name: "Turkiya", country: "Istanbul, Antalya", region: "europe", image: turkeyImg, tourCount: 15 },
  { id: "italy", name: "Italiya", country: "Rim, Venetsiya", region: "europe", image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800", tourCount: 5 },
  { id: "france", name: "Frantsiya", country: "Parij", region: "europe", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800", tourCount: 4 },
  { id: "spain", name: "Ispaniya", country: "Barselona, Madrid", region: "europe", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800", tourCount: 3 },
  
  // Arab davlatlari
  { id: "dubai", name: "Dubay", country: "BAA", region: "arab", image: dubaiImg, tourCount: 10 },
  { id: "saudi", name: "Saudiya", country: "Makka, Madina", region: "arab", image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800", tourCount: 8 },
  { id: "egypt", name: "Misr", country: "Qohira", region: "arab", image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800", tourCount: 6 },
  { id: "qatar", name: "Qatar", country: "Doha", region: "arab", image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800", tourCount: 4 },
];

export const tours: Tour[] = [
  // O'zbekiston turlari
  {
    id: "tour-1",
    title: "Samarqand - Qadimiy Shahar Sayohati",
    destination: "Samarqand",
    country: "O'zbekiston",
    region: "uzbekistan",
    duration: { days: 3, nights: 2 },
    price: 1500000,
    originalPrice: 1800000,
    image: samarkandImg,
    images: [samarkandImg, bukharaImg],
    rating: 4.9,
    reviewCount: 128,
    tourType: "group",
    included: [
      "Mehmonxonada yashash (2 tun)",
      "Nonushta",
      "Professional gid xizmati",
      "Transport xizmati",
      "Muzeylar kirish chiptalari",
    ],
    excluded: ["Tushlik va kechki ovqat", "Shaxsiy xarajatlar", "Sayohat sug'urtasi"],
    itinerary: [
      { day: 1, title: "Toshkentdan jo'nash", description: "Ertalab 07:00 da Toshkentdan jo'nash. Samarqandga yetib kelish va mehmonxonaga joylashish. Registon maydoniga sayohat." },
      { day: 2, title: "Shoh-i Zinda va Ulug'bek rasadxonasi", description: "Shoh-i Zinda maqbaralar majmuasi, Ulug'bek rasadxonasi va Bibi Xonim masjidini ziyorat qilish." },
      { day: 3, title: "Gur-i Amir va qaytish", description: "Amir Temur maqbarasini ziyorat. Mahalliy bozorda xarid. Toshkentga qaytish." },
    ],
    availableDates: ["2026-02-01", "2026-02-08", "2026-02-15", "2026-02-22"],
    maxPeople: 20,
    operatorId: "op-1",
    operatorName: "Silk Road Tours",
    featured: true,
    status: "approved",
  },
  {
    id: "tour-2",
    title: "Buxoro - Tarixiy Shaharga Sayohat",
    destination: "Buxoro",
    country: "O'zbekiston",
    region: "uzbekistan",
    duration: { days: 4, nights: 3 },
    price: 2200000,
    image: bukharaImg,
    images: [bukharaImg, samarkandImg],
    rating: 4.8,
    reviewCount: 94,
    tourType: "family",
    included: ["Mehmonxonada yashash (3 tun)", "Nonushta va tushlik", "Professional gid", "Barcha transport", "Muzey chiptalari"],
    excluded: ["Kechki ovqat", "Shaxsiy xarajatlar"],
    itinerary: [
      { day: 1, title: "Buxoroga kelish", description: "Toshkentdan tezkor poyezd orqali jo'nash. Mehmonxonaga joylashish." },
      { day: 2, title: "Ark qal'asi va Poi Kalon", description: "Ark qal'asi, Poi Kalon majmuasi, Ulug'bek madrasasi." },
      { day: 3, title: "Chor Minor va bozorlar", description: "Chor Minor, Lab-i Hovuz, an'anaviy hunarmandchilik." },
      { day: 4, title: "Qaytish", description: "Erkin vaqt va Toshkentga qaytish." },
    ],
    availableDates: ["2026-02-05", "2026-02-12", "2026-02-19"],
    maxPeople: 15,
    operatorId: "op-2",
    operatorName: "Heritage Travel UZ",
    featured: true,
    status: "approved",
  },
  {
    id: "tour-3",
    title: "Xiva - Qal'a Shahri Safari",
    destination: "Xiva",
    country: "O'zbekiston",
    region: "uzbekistan",
    duration: { days: 5, nights: 4 },
    price: 2800000,
    image: khivaImg,
    images: [khivaImg],
    rating: 4.7,
    reviewCount: 67,
    tourType: "adventure",
    included: ["Mehmonxona (4 tun)", "To'liq ovqatlanish", "Gid xizmati", "Transport", "Cho'l safari"],
    excluded: ["Ichimliklar", "Sovg'alar"],
    itinerary: [
      { day: 1, title: "Urganch aeroporti", description: "Urganch aeroportiga yetib kelish va Xivaga o'tish." },
      { day: 2, title: "Ichan Qal'a", description: "Ichan Qal'a ichki shaharini to'liq ko'rib chiqish." },
      { day: 3, title: "Dishan Qal'a", description: "Tashqi devorlar va atrofdagi joylar." },
      { day: 4, title: "Cho'l safari", description: "Qizilqum cho'liga bir kunlik safari." },
      { day: 5, title: "Qaytish", description: "Urganch orqali qaytish." },
    ],
    availableDates: ["2026-03-01", "2026-03-15", "2026-04-01"],
    maxPeople: 12,
    operatorId: "op-1",
    operatorName: "Silk Road Tours",
    featured: false,
    status: "approved",
  },
  {
    id: "tour-6",
    title: "Zomin - Tog' Sayohati",
    destination: "Zomin",
    country: "O'zbekiston",
    region: "uzbekistan",
    duration: { days: 2, nights: 1 },
    price: 800000,
    image: zominImg,
    images: [zominImg],
    rating: 4.6,
    reviewCount: 52,
    tourType: "budget",
    included: ["Yotoqxona (1 tun)", "Nonushta va tushlik", "Transport", "Milliy bog' kirish"],
    excluded: ["Kechki ovqat", "Qo'shimcha faoliyatlar"],
    itinerary: [
      { day: 1, title: "Zominga sayohat", description: "Toshkentdan jo'nash, Zomin milliy bog'iga kelish, tabiatda yurish." },
      { day: 2, title: "Tog' sayohati va qaytish", description: "Ertalab tog' yurishi, tushlikdan keyin Toshkentga qaytish." },
    ],
    availableDates: ["2026-02-01", "2026-02-08", "2026-02-15", "2026-02-22", "2026-03-01"],
    maxPeople: 30,
    operatorId: "op-2",
    operatorName: "Heritage Travel UZ",
    featured: false,
    status: "approved",
  },

  // Yevropa turlari
  {
    id: "tour-4",
    title: "Istanbul - Ikki Qit'a Sayohati",
    destination: "Istanbul",
    country: "Turkiya",
    region: "europe",
    duration: { days: 7, nights: 6 },
    price: 8500000,
    originalPrice: 9500000,
    image: turkeyImg,
    images: [turkeyImg],
    rating: 4.9,
    reviewCount: 215,
    tourType: "luxury",
    included: ["5 yulduzli mehmonxona", "Nonushta", "Aeroport transferi", "Professional gid", "Barcha sayohat xizmatlari", "Bosfor sayohati"],
    excluded: ["Aviachiptalar", "Viza", "Tushlik/Kechki ovqat"],
    itinerary: [
      { day: 1, title: "Istanbulga kelish", description: "Aeroportdan kutib olish va mehmonxonaga joylashish." },
      { day: 2, title: "Sultan Ahmet", description: "Oyasofya, Ko'k Masjid, Topkopi saroyi." },
      { day: 3, title: "Bosfor", description: "Bosfor bo'ylab sayohat, Ortakoy, Bebek." },
      { day: 4, title: "Grand Bazar", description: "Grand Bazar va Misir Bozori." },
      { day: 5, title: "Osiyo tomoni", description: "Kadiköy va Üsküdar." },
      { day: 6, title: "Erkin kun", description: "Mustaqil sayohat yoki dam olish." },
      { day: 7, title: "Qaytish", description: "Aeroportga transfer." },
    ],
    availableDates: ["2026-02-10", "2026-02-24", "2026-03-10", "2026-03-24"],
    maxPeople: 25,
    operatorId: "op-3",
    operatorName: "Global Tours International",
    featured: true,
    status: "approved",
  },
  {
    id: "tour-7",
    title: "Italiya - Rim va Venetsiya",
    destination: "Rim",
    country: "Italiya",
    region: "europe",
    duration: { days: 8, nights: 7 },
    price: 15000000,
    image: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800",
    images: ["https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800"],
    rating: 4.8,
    reviewCount: 89,
    tourType: "luxury",
    included: ["4 yulduzli mehmonxona", "Nonushta", "Transport", "Gid xizmati", "Muzey chiptalari"],
    excluded: ["Aviachiptalar", "Viza", "Ovqatlanish"],
    itinerary: [
      { day: 1, title: "Rimga kelish", description: "Aeroportdan kutib olish." },
      { day: 2, title: "Kolizey", description: "Kolizey va Rim forumi." },
      { day: 3, title: "Vatikan", description: "Vatikan muzeylari va Sistina kapellasi." },
      { day: 4, title: "Rim sayohati", description: "Trevi favvorasi, Ispan zinapoyasi." },
      { day: 5, title: "Venetsiyaga o'tish", description: "Poyezd orqali Venetsiyaga." },
      { day: 6, title: "Venetsiya", description: "San Marko maydoni, gondola sayohati." },
      { day: 7, title: "Murano va Burano", description: "Orollar sayohati." },
      { day: 8, title: "Qaytish", description: "Aeroportga transfer." },
    ],
    availableDates: ["2026-04-01", "2026-05-01", "2026-06-01"],
    maxPeople: 15,
    operatorId: "op-3",
    operatorName: "Global Tours International",
    featured: false,
    status: "approved",
  },

  // Arab davlatlari turlari
  {
    id: "tour-5",
    title: "Dubay - Hashamatli Dam Olish",
    destination: "Dubay",
    country: "BAA",
    region: "arab",
    duration: { days: 5, nights: 4 },
    price: 12000000,
    image: dubaiImg,
    images: [dubaiImg],
    rating: 4.8,
    reviewCount: 178,
    tourType: "luxury",
    included: ["5 yulduzli mehmonxona", "Nonushta", "Aeroport transferi", "Burj Khalifa chipta", "Cho'l safarisi", "Dubai Mall sayohati"],
    excluded: ["Aviachiptalar", "Viza", "Shaxsiy xarajatlar"],
    itinerary: [
      { day: 1, title: "Dubayga kelish", description: "VIP kutib olish va mehmonxonaga joylashish." },
      { day: 2, title: "Burj Khalifa", description: "Burj Khalifa va Dubai Mall." },
      { day: 3, title: "Cho'l safarisi", description: "4x4 mashinalarda cho'l safarisi, BBQ kechasi." },
      { day: 4, title: "Palm Jumeirah", description: "Palm oroli, Atlantis, sohil dam olishi." },
      { day: 5, title: "Qaytish", description: "Oxirgi xaridlar va aeroportga transfer." },
    ],
    availableDates: ["2026-02-15", "2026-03-01", "2026-03-15"],
    maxPeople: 20,
    operatorId: "op-3",
    operatorName: "Global Tours International",
    featured: true,
    status: "approved",
  },
  {
    id: "tour-8",
    title: "Umra Ziyorati - Makka va Madina",
    destination: "Makka",
    country: "Saudiya Arabistoni",
    region: "arab",
    duration: { days: 10, nights: 9 },
    price: 18000000,
    image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800",
    images: ["https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800"],
    rating: 5.0,
    reviewCount: 312,
    tourType: "group",
    included: ["Mehmonxona (Makkada 5 tun, Madinada 4 tun)", "Nonushta va kechki ovqat", "Transport", "Ziyorat gidi", "Umra xizmatlari"],
    excluded: ["Aviachiptalar", "Viza", "Tushlik"],
    itinerary: [
      { day: 1, title: "Jiddaga kelish", description: "Aeroportdan kutib olish, Makkaga o'tish." },
      { day: 2, title: "Umra", description: "Umra amallarini bajarish." },
      { day: 3, title: "Makka ziyorati", description: "Haramda ibodat." },
      { day: 4, title: "Makka ziyorati", description: "Jabal Nur, Jabal Rahma." },
      { day: 5, title: "Makka ziyorati", description: "Erkin ibodat." },
      { day: 6, title: "Madinaga o'tish", description: "Avtobusda Madinaga." },
      { day: 7, title: "Madina ziyorati", description: "Masjid Nabaviy." },
      { day: 8, title: "Madina ziyorati", description: "Uhud tog'i, Quba masjidi." },
      { day: 9, title: "Madina ziyorati", description: "Erkin ibodat." },
      { day: 10, title: "Qaytish", description: "Madinadan aeroportga." },
    ],
    availableDates: ["2026-03-01", "2026-04-01", "2026-05-01"],
    maxPeople: 40,
    operatorId: "op-4",
    operatorName: "Ziyorat Travel",
    featured: true,
    status: "approved",
  },
  {
    id: "tour-9",
    title: "Misr - Piramidalar Sayohati",
    destination: "Qohira",
    country: "Misr",
    region: "arab",
    duration: { days: 6, nights: 5 },
    price: 9500000,
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800",
    images: ["https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800"],
    rating: 4.7,
    reviewCount: 145,
    tourType: "adventure",
    included: ["4 yulduzli mehmonxona", "Nonushta", "Transport", "Gid", "Muzey chiptalari"],
    excluded: ["Aviachiptalar", "Viza", "Ovqatlanish"],
    itinerary: [
      { day: 1, title: "Qohiraga kelish", description: "Aeroportdan kutib olish." },
      { day: 2, title: "Piramidalar", description: "Giza piramidalari va Sfinks." },
      { day: 3, title: "Qohira muzeyi", description: "Misr muzeyi, Khan el-Khalili bozori." },
      { day: 4, title: "Aleksandriya", description: "Aleksandriya shahriga sayohat." },
      { day: 5, title: "Nil daryosi", description: "Nil bo'ylab sayohat." },
      { day: 6, title: "Qaytish", description: "Aeroportga transfer." },
    ],
    availableDates: ["2026-03-10", "2026-04-10", "2026-05-10"],
    maxPeople: 20,
    operatorId: "op-3",
    operatorName: "Global Tours International",
    featured: false,
    status: "approved",
  },

  // Osiyo turlari
  {
    id: "tour-10",
    title: "Tailand - Phuket Dam Olish",
    destination: "Phuket",
    country: "Tailand",
    region: "asia",
    duration: { days: 7, nights: 6 },
    price: 11000000,
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800",
    images: ["https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800"],
    rating: 4.8,
    reviewCount: 203,
    tourType: "luxury",
    included: ["4 yulduzli resort", "Nonushta", "Aeroport transferi", "Orol sayohati", "Thai massaj"],
    excluded: ["Aviachiptalar", "Viza", "Ovqatlanish"],
    itinerary: [
      { day: 1, title: "Phuketga kelish", description: "Aeroportdan kutib olish." },
      { day: 2, title: "Sohil dam olishi", description: "Patong sohilida dam olish." },
      { day: 3, title: "Phi Phi orollari", description: "Orollarga sayohat." },
      { day: 4, title: "Erkin kun", description: "Sohil dam olishi." },
      { day: 5, title: "Phuket shahri", description: "Old Town sayohati." },
      { day: 6, title: "James Bond oroli", description: "Phang Nga ko'rfaziga sayohat." },
      { day: 7, title: "Qaytish", description: "Aeroportga transfer." },
    ],
    availableDates: ["2026-02-20", "2026-03-20", "2026-04-20"],
    maxPeople: 20,
    operatorId: "op-3",
    operatorName: "Global Tours International",
    featured: true,
    status: "approved",
  },
  {
    id: "tour-11",
    title: "Malayziya - Kuala Lumpur",
    destination: "Kuala Lumpur",
    country: "Malayziya",
    region: "asia",
    duration: { days: 5, nights: 4 },
    price: 8000000,
    image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800",
    images: ["https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800"],
    rating: 4.6,
    reviewCount: 98,
    tourType: "family",
    included: ["4 yulduzli mehmonxona", "Nonushta", "Transport", "Gid xizmati"],
    excluded: ["Aviachiptalar", "Ovqatlanish"],
    itinerary: [
      { day: 1, title: "KL ga kelish", description: "Aeroportdan kutib olish." },
      { day: 2, title: "Petronas towers", description: "Petronas minoralariga sayohat." },
      { day: 3, title: "Batu g'orlari", description: "Batu caves ziyorati." },
      { day: 4, title: "Xaridlar", description: "Shopping va erkin vaqt." },
      { day: 5, title: "Qaytish", description: "Aeroportga transfer." },
    ],
    availableDates: ["2026-03-05", "2026-04-05", "2026-05-05"],
    maxPeople: 25,
    operatorId: "op-3",
    operatorName: "Global Tours International",
    featured: false,
    status: "approved",
  },
  {
    id: "tour-12",
    title: "Bali - Tropik Jannat",
    destination: "Bali",
    country: "Indoneziya",
    region: "asia",
    duration: { days: 8, nights: 7 },
    price: 13000000,
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
    images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800"],
    rating: 4.9,
    reviewCount: 267,
    tourType: "luxury",
    included: ["5 yulduzli villa", "Nonushta", "Aeroport transferi", "Spa xizmati", "Sayohatlar"],
    excluded: ["Aviachiptalar", "Viza", "Ovqatlanish"],
    itinerary: [
      { day: 1, title: "Baliga kelish", description: "VIP kutib olish." },
      { day: 2, title: "Ubud", description: "Ubud madaniyat markazi." },
      { day: 3, title: "Guruch teraslari", description: "Tegallalang guruch teraslari." },
      { day: 4, title: "Ma'badlar", description: "Tanah Lot, Uluwatu." },
      { day: 5, title: "Sohil", description: "Kuta sohilida dam olish." },
      { day: 6, title: "Spa kun", description: "To'liq spa dam olish." },
      { day: 7, title: "Erkin kun", description: "Mustaqil sayohat." },
      { day: 8, title: "Qaytish", description: "Aeroportga transfer." },
    ],
    availableDates: ["2026-04-15", "2026-05-15", "2026-06-15"],
    maxPeople: 12,
    operatorId: "op-3",
    operatorName: "Global Tours International",
    featured: true,
    status: "approved",
  },
];

export const tourTypes = [
  { id: "family", label: "Oilaviy", icon: "👨‍👩‍👧‍👦" },
  { id: "group", label: "Guruh", icon: "👥" },
  { id: "luxury", label: "Hashamatli", icon: "✨" },
  { id: "budget", label: "Arzon", icon: "💰" },
  { id: "adventure", label: "Sarguzasht", icon: "🏔️" },
];

const USD_RATE = 12850;

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
};

export const formatPriceUSD = (price: number): string => {
  return "$" + Math.round(price / USD_RATE).toLocaleString("en-US");
};
