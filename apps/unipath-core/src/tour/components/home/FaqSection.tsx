import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "UniTour qanday ishlaydi?",
    answer:
      "UniTour — tour kompaniyalar uchun SaaS platforma. Ro'yxatdan o'ting, kompaniyangiz uchun sayt va boshqaruv panelini oling. Tour'larni qo'shing, mijozlarni qabul qiling, telegram bot ulang — hammasi bitta joyda.",
  },
  {
    question: "Hech qanday texnik bilim kerakmi?",
    answer:
      "Yo'q. UniTour'ning vizual editor'i orqali siz logo, ranglar va matnlarni 5 daqiqada sozlaysiz. Kod yozish, dizayn yoki dasturchilar yollash kerak emas.",
  },
  {
    question: "Mening saytim qaysi manzilda ochiladi?",
    answer:
      "Bepul rejada — unitour.me/kompaniyangiz. Pro va Premium rejalarda esa o'z domeningizni (masalan: silkroadtours.uz) bog'lashingiz mumkin.",
  },
  {
    question: "Telegram bot qanday ishlaydi?",
    answer:
      "Pro va Premium rejalarda super admin sizning kompaniya uchun shaxsiy telegram bot tayyorlab beradi. Mijozlar bot orqali tour ko'radi, narxlarni so'raydi va to'g'ridan-to'g'ri buyurtma qiladi.",
  },
  {
    question: "Boshqa kompaniyalar mening ma'lumotlarimni ko'ra oladimi?",
    answer:
      "Yo'q. Sizning tour'lar, mijozlar, buyurtmalar va daromadingiz faqat sizning jamoangizga ko'rinadi. UniTour qat'iy ma'lumot izolyatsiyasini ta'minlaydi.",
  },
  {
    question: "Bepul rejada nima cheklov bor?",
    answer:
      "Bepul rejada: 5 ta tour, subdomain (kompaniyangiz.unitour.me), asosiy CRM va analitika. Pro rejaga o'tsangiz — cheksiz tour, custom domen, telegram bot, AI va kengaytirilgan funksiyalar ochiladi.",
  },
  {
    question: "Obunani istalgan vaqt bekor qila olamanmi?",
    answer:
      "Ha. Hech qanday majburiyat yo'q — istalgan vaqt admin paneldan obunani to'xtatishingiz mumkin. Ma'lumotlaringiz Bepul rejada saqlanib qoladi.",
  },
  {
    question: "Qo'llab-quvvatlash qanday ishlaydi?",
    answer:
      "Bepul foydalanuvchilar email orqali yordam oladi (24 soat ichida javob). Pro va Premium foydalanuvchilarga ustuvor telegram qo'llab-quvvatlash va shaxsiy menejer biriktiriladi.",
  },
];

const FaqSection = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container-custom">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            Ko'p beriladigan savollar
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">Savollar va Javoblar</h2>
          <p className="text-muted-foreground text-lg">
            Boshlashdan oldin bilishingiz kerak bo'lgan hamma narsa
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background border border-border/50 rounded-xl px-5 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-sm sm:text-base font-medium text-left hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
