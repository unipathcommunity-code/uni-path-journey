import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const SaaSHero = () => {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28 bg-gradient-to-b from-primary/[0.04] via-background to-background">
      {/* Subtle grid background */}
      <div className="absolute inset-0 -z-10 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] -z-10" />

      <div className="container-custom">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Tour kompaniyalar uchun #1 platforma
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]"
            >
              Tour kompaniyangiz uchun
              <span className="block mt-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                tayyor sayt va CRM
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg text-muted-foreground mt-6 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Brendingiz, tour'laringiz, mijozlaringiz — bitta panelda. 5 daqiqada
              o'z saytingizni oching, telegram bot ulang, buyurtmalarni qabul qiling.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <Link to="/register-company">
                <Button size="lg" className="h-12 px-7 rounded-xl text-sm font-semibold gap-2 shadow-lg shadow-primary/25 group w-full sm:w-auto">
                  Bepul boshlash
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="h-12 px-7 rounded-xl text-sm font-semibold w-full sm:w-auto">
                  Kirish
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-6 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-muted-foreground"
            >
              {["Karta talab qilinmaydi", "14 kun bepul", "Istalgan vaqt bekor qilish"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-6 relative"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 to-blue-500/20 rounded-3xl blur-2xl opacity-60" />

              {/* Browser frame */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
                {/* Browser top bar */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border/50">
                  <div className="w-3 h-3 rounded-full bg-red-400/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                  <div className="w-3 h-3 rounded-full bg-green-400/70" />
                  <div className="ml-3 flex-1 max-w-[220px] bg-background/70 rounded-md px-3 py-1 text-[10px] text-muted-foreground font-mono">
                    unitour.me/silkroad
                  </div>
                </div>

                {/* Site preview */}
                <div className="bg-gradient-to-b from-background to-muted/30">
                  {/* Top nav */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-blue-600" />
                      <span className="font-bold text-sm">Silk Road Tours</span>
                    </div>
                    <div className="hidden sm:flex gap-3 text-[11px] text-muted-foreground">
                      <span>Turlar</span><span>Aloqa</span>
                    </div>
                    <div className="text-[10px] bg-primary text-primary-foreground px-2.5 py-1 rounded-md font-semibold">
                      Bog'lanish
                    </div>
                  </div>

                  {/* Hero strip */}
                  <div className="relative h-28 sm:h-32 bg-gradient-to-tr from-primary/80 to-blue-500/80 flex items-end p-4">
                    <div className="text-white">
                      <div className="text-[10px] opacity-90">Samarqand · 5 kun</div>
                      <div className="font-bold text-sm sm:text-base">Buyuk Ipak Yo'li</div>
                    </div>
                  </div>

                  {/* Tour cards */}
                  <div className="grid grid-cols-3 gap-2 p-3">
                    {[
                      { c: "from-amber-300 to-amber-500", t: "Buxoro" },
                      { c: "from-emerald-300 to-emerald-500", t: "Xiva" },
                      { c: "from-rose-300 to-rose-500", t: "Toshkent" },
                    ].map((x) => (
                      <div key={x.t} className="rounded-lg overflow-hidden border border-border/40 bg-card">
                        <div className={`h-12 bg-gradient-to-br ${x.c}`} />
                        <div className="p-2">
                          <div className="text-[10px] font-semibold">{x.t}</div>
                          <div className="text-[9px] text-muted-foreground">3 kun · $199</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                    {[
                      { l: "Turlar", v: "24" },
                      { l: "Mijozlar", v: "412" },
                      { l: "Reyting", v: "4.9★" },
                    ].map((s) => (
                      <div key={s.l} className="text-center bg-muted/40 rounded-md py-2">
                        <div className="text-sm font-bold text-primary">{s.v}</div>
                        <div className="text-[9px] text-muted-foreground">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <motion.div
                initial={{ opacity: 0, y: 20, x: -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -left-3 sm:-left-6 top-20 bg-card rounded-xl shadow-xl border border-border/50 p-3 flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold">Yangi buyurtma!</div>
                  <div className="text-[10px] text-muted-foreground">+2 kishi · Samarqand</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ delay: 0.7 }}
                className="absolute -right-3 sm:-right-6 bottom-12 bg-card rounded-xl shadow-xl border border-border/50 p-3 flex items-center gap-2"
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <div>
                  <div className="text-[11px] font-semibold">5.0 reyting</div>
                  <div className="text-[10px] text-muted-foreground">+12 yangi izoh</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SaaSHero;
