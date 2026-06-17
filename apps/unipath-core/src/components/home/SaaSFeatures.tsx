import { motion } from "framer-motion";
import { Palette, Globe2, Users, MessageSquare, BarChart3, CreditCard, Bot, ShieldCheck } from "lucide-react";

const features = [
  { icon: Palette, title: "O'z brendingiz", desc: "Logo, ranglar, font — sayt to'liq sizga tegishli ko'rinadi." },
  { icon: Globe2, title: "Subdomain yoki custom domen", desc: "kompaniyangiz.unitour.me yoki o'z domeningiz — birga ishlaydi." },
  { icon: Users, title: "Jamoa boshqaruvi", desc: "Owner va staff a'zolarini taklif qiling, huquqlarni cheklang." },
  { icon: MessageSquare, title: "Mijozlar bilan chat", desc: "Real-vaqt chat, lead form va telegram orqali xabarlar." },
  { icon: Bot, title: "Telegram bot integratsiya", desc: "Super admin sizga shaxsiy bot ulab beradi — buyurtmalar telegram'ga keladi." },
  { icon: BarChart3, title: "Aniq analitika", desc: "Sahifa ko'rishlari, lead'lar, daromad — hammasi bitta dashboard'da." },
  { icon: CreditCard, title: "Obuna rejasi", desc: "Free, Pro, Premium — kerakli funksiyalarni tanlang." },
  { icon: ShieldCheck, title: "Ma'lumot izolyatsiyasi", desc: "Boshqa kompaniyalar sizning bookings'lar va leads'larni hech qachon ko'rmaydi." },
];

const SaaSFeatures = () => {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Sizga kerakli barcha narsalar</h2>
          <p className="text-lg text-muted-foreground">
            Bitta platformada — sayt, CRM, telegram bot, to'lov va analitika.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group p-6 rounded-2xl bg-card border border-primary/10 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center mb-4 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SaaSFeatures;
