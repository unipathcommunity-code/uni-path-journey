import { motion } from "framer-motion";
import {
  Coins, ShoppingBag, Star, Gift, Shirt, Award, Coffee, Ticket, TrendingUp,
  Wallet as WalletIcon, History, Calendar, CircleCheck, BookOpen, Palette,
  Sticker, Frame, Crown, Trophy, Bot, Film, Library,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { useState, type ComponentType } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Tab = "wallet" | "store" | "history";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "merch" | "digital" | "partner";
  Icon: ComponentType<{ className?: string }>;
  /** Tailwind colour token ("primary", "accent", "warning", "success") */
  tone: string;
  popular?: boolean;
}

const STORE_ITEMS: StoreItem[] = [
  { id: "1", name: "NOVA Hoodie",        description: "Premium tikilgan hoodie",      price: 500, category: "merch",   Icon: Shirt,   tone: "primary",  popular: true },
  { id: "2", name: "NOVA Sticker Pack",  description: "10 ta gologramma stiker",       price: 50,  category: "merch",   Icon: Sticker, tone: "accent" },
  { id: "3", name: "NOVA T-Shirt",       description: "Cheklangan kolleksiya",         price: 300, category: "merch",   Icon: Shirt,   tone: "warning" },
  { id: "4", name: "Galaxy Badge",       description: "Maxsus profil nishoni",          price: 150, category: "digital", Icon: Award,   tone: "primary",  popular: true },
  { id: "5", name: "Mentor Tema: Neon",  description: "Yordamchi uchun yangi tema",     price: 200, category: "digital", Icon: Bot,     tone: "accent" },
  { id: "6", name: "Profil Ramka: Oltin", description: "Premium oltin chegara",         price: 100, category: "digital", Icon: Frame,   tone: "warning" },
  { id: "7", name: "Kafe Kuponi",         description: "Nova Café'da bepul ichimlik",   price: 80,  category: "partner", Icon: Coffee,  tone: "warning",  popular: true },
  { id: "8", name: "Kinoteatr Chiptasi",  description: "CineStar'da 50% chegirma",      price: 120, category: "partner", Icon: Film,    tone: "primary" },
  { id: "9", name: "Kitob Do'koni",       description: "ReadMore'dan 20% chegirma",     price: 100, category: "partner", Icon: Library, tone: "accent" },
];

const EARNING_HISTORY = [
  { reason: "100% davomat — 12-hafta",          amount: 50, date: "2026-03-27" },
  { reason: "Uy vazifasi: Algebra 8-bob",       amount: 20, date: "2026-03-26" },
  { reason: "Yashil status — Fizika",            amount: 30, date: "2026-03-25" },
  { reason: "Mukammal test natijasi",            amount: 40, date: "2026-03-24" },
  { reason: "100% davomat — 11-hafta",          amount: 50, date: "2026-03-20" },
  { reason: "Uy vazifasi: Adabiyot insho",       amount: 20, date: "2026-03-19" },
];

const categoryFilters = [
  { key: "all",     label: "Barchasi",  icon: ShoppingBag },
  { key: "merch",   label: "Mahsulot",  icon: Shirt },
  { key: "digital", label: "Raqamli",   icon: Award },
  { key: "partner", label: "Mukofot",   icon: Gift },
];

const tabsMeta: { key: Tab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "wallet",  label: "Hamyon",  icon: WalletIcon },
  { key: "store",   label: "Do'kon",  icon: ShoppingBag },
  { key: "history", label: "Tarix",   icon: History },
];

const earnRules: {
  title: string;
  coins: string;
  Icon: ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { title: "100% davomat",   coins: "+50/hafta",  Icon: Calendar,    color: "bg-success/10 border-success/20 text-success" },
  { title: "Yashil status",  coins: "+30/fan",     Icon: CircleCheck, color: "bg-primary/10 border-primary/20 text-primary" },
  { title: "Bajarilgan vazifa", coins: "+20/topshiriq", Icon: BookOpen, color: "bg-accent/10 border-accent/20 text-accent" },
];

const NovaStore = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("wallet");
  const [storeFilter, setStoreFilter] = useState("all");

  const balance = 720;
  const totalEarned = 1240;

  const filteredItems = storeFilter === "all" ? STORE_ITEMS : STORE_ITEMS.filter((i) => i.category === storeFilter);

  const handlePurchase = (item: StoreItem) => {
    if (balance < item.price) {
      toast.error("NovaCoin yetarli emas!");
      return;
    }
    toast.success(`Sotib olindi: ${item.name}`);
  };

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-warning/5 blur-[150px] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 sm:gap-4 mb-6 z-10 relative">
        <BackButton to="/app" />
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-gradient-primary">Nova-Store</h1>
            <p className="text-xs text-muted-foreground">Mehnatga — mukofot</p>
          </div>
        </div>
        {/* Balance badge */}
        <div className="glass-strong px-4 py-2 flex items-center gap-2">
          <Coins className="w-4 h-4 text-warning" />
          <span className="font-bold font-heading text-warning">{balance}</span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 z-10 relative">
        {tabsMeta.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              tab === key ? "bg-warning text-warning-foreground" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {tab === "wallet" && (
          <div className="space-y-6">
            {/* Balance Card */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-primary/5" />
              <div className="relative z-10">
                <Coins className="w-12 h-12 text-warning mx-auto mb-3" />
                <p className="text-xs text-muted-foreground mb-1">Joriy balans</p>
                <p className="text-5xl font-bold font-heading text-warning mb-1">{balance}</p>
                <p className="text-xs text-muted-foreground">NovaCoins</p>
                <div className="mt-6 flex justify-center gap-6 text-sm">
                  <div>
                    <p className="text-success font-bold">{totalEarned}</p>
                    <p className="text-xs text-muted-foreground">Jami topilgan</p>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <p className="text-accent font-bold">{totalEarned - balance}</p>
                    <p className="text-xs text-muted-foreground">Jami sarflangan</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* How to Earn */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-strong p-6">
              <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" /> Qanday topish mumkin
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {earnRules.map((item, i) => {
                  const Icon = item.Icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className={`p-4 rounded-xl border ${item.color}`}
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs font-bold mt-1">{item.coins}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {tab === "store" && (
          <div>
            {/* Filters */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {categoryFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStoreFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    storeFilter === f.key ? "bg-warning/20 text-warning border border-warning/30" : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"
                  }`}
                >
                  <f.icon className="w-3.5 h-3.5" />
                  {f.label}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item, i) => {
                const Icon = item.Icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                    className="glass-strong overflow-hidden group cursor-pointer relative"
                  >
                    {item.popular && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-[10px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" /> Mashhur
                      </div>
                    )}
                    <div className="p-5">
                      <div className={`w-12 h-12 rounded-xl bg-${item.tone}/15 flex items-center justify-center mb-3`}>
                        <Icon className={`w-6 h-6 text-${item.tone}`} />
                      </div>
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-warning" />
                          <span className="font-bold text-warning">{item.price}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePurchase(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            balance >= item.price
                              ? "bg-primary text-primary-foreground glow-primary"
                              : "bg-muted text-muted-foreground cursor-not-allowed"
                          }`}
                        >
                          {balance >= item.price ? "Sotib olish" : "Yetarli emas"}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "history" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-6">
            <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" /> Topishlar tarixi
            </h2>
            <div className="space-y-3">
              {EARNING_HISTORY.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border"
                >
                  <div>
                    <p className="text-sm font-medium">{entry.reason}</p>
                    <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-success font-bold text-sm">
                    <Coins className="w-4 h-4 text-warning" />
                    +{entry.amount}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NovaStore;
