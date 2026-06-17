import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CtaBanner = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-blue-700 p-10 md:p-16 text-center"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold mb-5 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Bugun 14 kunlik bepul sinov
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
              Tour kompaniyangizni bugun raqamlashtiring
            </h2>
            <p className="text-primary-foreground/85 text-base md:text-lg mb-8 leading-relaxed">
              5 daqiqada o'z brendingiz bilan sayt, professional CRM, telegram bot va
              to'lov tizimi — barchasi bitta panelda. Karta talab qilinmaydi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register-company" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 rounded-2xl px-8 h-14 text-base font-bold w-full sm:w-auto shadow-xl"
                >
                  Bepul boshlash
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-primary-foreground hover:bg-white/10 rounded-2xl px-8 h-14 text-base font-semibold w-full bg-transparent"
                >
                  Kirish
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaBanner;
