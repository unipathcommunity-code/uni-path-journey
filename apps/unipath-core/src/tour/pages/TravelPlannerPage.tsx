import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Plane, Loader2, Wand2, MapPin, Calendar, Clock, DollarSign, RefreshCw, Send, Check, Users, RotateCcw, Heart, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import PageTransition from "@/components/common/PageTransition";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

const PLANNER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-planner`;

const popularDestinations = [
  { name: "Istanbul", emoji: "🇹🇷", budget: 800 },
  { name: "Dubai", emoji: "🇦🇪", budget: 1200 },
  { name: "Samarkand", emoji: "🇺🇿", budget: 300 },
  { name: "Antalya", emoji: "🇹🇷", budget: 700 },
  { name: "Bangkok", emoji: "🇹🇭", budget: 600 },
  { name: "Sharm el-Sheikh", emoji: "🇪🇬", budget: 500 },
];

const TravelPlannerPage = () => {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("5");
  const [people, setPeople] = useState("2");
  const [interests, setInterests] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleGenerate = async () => {
    if (!destination.trim() || !budget.trim() || !days.trim()) {
      toast({ title: "Barcha maydonlarni to'ldiring", description: "Yo'nalish, byudjet va kunlar sonini kiriting", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: "Avval tizimga kiring", description: "AI sayohat rejasini olish uchun login qiling.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const resp = await fetch(PLANNER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ destination, budget: Number(budget), days: Number(days), people: Number(people), interests }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Xatolik yuz berdi" }));
        throw new Error(err.error || `Status: ${resp.status}`);
      }

      if (!resp.body) throw new Error("Stream mavjud emas");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const selectDestination = (dest: typeof popularDestinations[0]) => {
    setDestination(dest.name);
    setBudget(String(dest.budget));
  };

  return (
    <Layout>
      <PageTransition>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-10 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
            />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Wand2 className="h-4 w-4" />
                AI bilan sayohat rejasi
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Aqlli Sayohat <span className="text-primary">Rejalashtiruvchi</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Yo'nalish va byudjetingizni kiriting — sun'iy intellekt sizga mukammal sayohat rejasini tuzib beradi
              </p>
            </motion.div>

            {/* Quick Destinations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-2 mb-10"
            >
              {popularDestinations.map((dest) => (
                <button
                  key={dest.name}
                  onClick={() => selectDestination(dest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                    destination === dest.name
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-background/80 text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {dest.emoji} {dest.name}
                </button>
              ))}
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Card className="max-w-4xl mx-auto border-border/50 shadow-xl shadow-primary/5 bg-card/95 backdrop-blur-sm">
                <CardContent className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="lg:col-span-2">
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Yo'nalish
                      </Label>
                      <Input
                        placeholder="Masalan: Istanbul, Dubai, Tokyo..."
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Byudjet (USD)
                      </Label>
                      <Input
                        type="number"
                        placeholder="500"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="h-12 text-base"
                        min="100"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Kunlar soni
                      </Label>
                      <Input
                        type="number"
                        placeholder="5"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        className="h-12 text-base"
                        min="1"
                        max="30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Odamlar soni
                      </Label>
                      <Input
                        type="number"
                        placeholder="2"
                        value={people}
                        onChange={(e) => setPeople(e.target.value)}
                        className="h-12 text-base"
                        min="1"
                        max="20"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" />
                        Qiziqishlar (ixtiyoriy)
                      </Label>
                      <Input
                        placeholder="Tarix, tabiiy joylar, ovqatlanish..."
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    size="lg"
                    className="w-full h-14 text-base font-semibold gap-3 rounded-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        AI reja tuzmoqda...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5" />
                        Sayohat rejasini tuzing
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Scroll indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-8"
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronDown className="h-6 w-6 text-muted-foreground" />
                </motion.div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Result Section */}
        <AnimatePresence>
          {(result || isLoading) && (
            <motion.section
              ref={resultRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="py-12 md:py-16 bg-muted/30"
            >
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Plane className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Sayohat rejasi</h2>
                        <p className="text-sm text-muted-foreground">
                          {destination} • {days} kun • ${budget}
                        </p>
                      </div>
                    </div>
                    {result && !isLoading && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setResult(""); }}
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Qayta tuzish
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <Card className="border-border/50 shadow-lg">
                    <CardContent className="p-6 md:p-8">
                      {isLoading && !result && (
                        <div className="flex flex-col items-center py-16 gap-4">
                          <motion.div
                            animate={{ x: [0, 40, 0], y: [0, -20, 0], rotate: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="text-primary"
                          >
                            <Plane className="h-12 w-12" />
                          </motion.div>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-primary"
                                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground text-sm">AI sayohat rejangizni tuzmoqda...</p>
                        </div>
                      )}
                      
                      {result && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="prose prose-sm md:prose-base dark:prose-invert max-w-none
                            prose-headings:text-foreground prose-p:text-foreground/80
                            prose-strong:text-foreground prose-li:text-foreground/80
                            prose-table:text-foreground/80 prose-th:text-foreground
                            prose-td:border-border prose-th:border-border
                            prose-a:text-primary"
                        >
                          <ReactMarkdown>{result}</ReactMarkdown>
                        </motion.div>
                      )}

                      {isLoading && result && (
                        <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Davom etmoqda...</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </PageTransition>
    </Layout>
  );
};

export default TravelPlannerPage;
