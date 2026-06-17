import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFeatureToggles } from "@/hooks/useFeatureToggles";

const NewsletterSection = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (!isFeatureEnabled("newsletter")) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Iltimos, to'g'ri email kiriting");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: trimmed });

      if (error) {
        if (error.code === "23505") {
          toast.info("Bu email allaqachon obuna qilingan!");
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        toast.success("Muvaffaqiyatli obuna bo'ldingiz! 🎉");
      }
      setEmail("");
    } catch {
      toast.error("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-20 bg-primary/5">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Mail className="h-4 w-4" />
            Newsletter
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Eng yaxshi takliflardan xabardor bo'ling
          </h2>
          <p className="text-muted-foreground mb-8">
            Maxsus chegirmalar, yangi turlar va foydali sayohat maslahatlari — to'g'ridan-to'g'ri emailingizga
          </p>

          {subscribed ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center gap-2 text-primary font-semibold"
            >
              <CheckCircle className="h-6 w-6" />
              Obuna muvaffaqiyatli! Rahmat!
            </motion.div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Email manzilingiz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                maxLength={255}
                required
              />
              <Button type="submit" disabled={loading} className="gap-2">
                <Send className="h-4 w-4" />
                {loading ? "..." : "Obuna"}
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Spam yubormadik. Istalgan vaqt obunani bekor qilishingiz mumkin.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
