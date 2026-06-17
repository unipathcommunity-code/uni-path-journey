import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  Globe, 
  Shield, 
  Target, 
  Award,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Linkedin,
  Youtube,
  Send,
  Facebook
} from 'lucide-react';
export default function About() {
  const { language, activeTenant } = useApp();
  const t = useTranslation(language);

  const features = [
    {
      icon: Globe,
      title: language === 'uz' ? "Global ta'lim" : language === 'ru' ? "Глобальное образование" : "Global Education",
      desc: language === 'uz' ? "12+ davlatda 500+ universitet" : language === 'ru' ? "500+ университетов в 12+ странах" : "500+ universities in 12+ countries",
    },
    {
      icon: Shield,
      title: language === 'uz' ? "Ishonchli va shaffof" : language === 'ru' ? "Надежный и прозрачный" : "Trusted & Transparent",
      desc: language === 'uz' ? "Hamma jarayonlar ko'rinadi" : language === 'ru' ? "Все процессы видны" : "All processes are visible",
    },
    {
      icon: Target,
      title: language === 'uz' ? "Step-by-step yo'riqnoma" : language === 'ru' ? "Пошаговое руководство" : "Step-by-step Guide",
      desc: language === 'uz' ? "Hech narsa o'tkazib yuborilmaydi" : language === 'ru' ? "Ничего не будет пропущено" : "Nothing will be missed",
    },
    {
      icon: Award,
      title: language === 'uz' ? "AI yordamchi" : language === 'ru' ? "ИИ помощник" : "AI Assistant",
      desc: language === 'uz' ? "SOP, CV va ariza tayyorlash" : language === 'ru' ? "Подготовка SOP, CV и заявки" : "SOP, CV and application prep",
    },
  ];

  const steps = [
    { num: 1, title: language === 'uz' ? "Davlatni tanlang" : language === 'ru' ? "Выберите страну" : "Select Country" },
    { num: 2, title: language === 'uz' ? "Ro'yxatdan o'ting" : language === 'ru' ? "Зарегистрируйтесь" : "Create Account" },
    { num: 3, title: language === 'uz' ? "Universitetni tanlang" : language === 'ru' ? "Выберите университет" : "Choose University" },
    { num: 4, title: language === 'uz' ? "Hujjatlarni yuklang" : language === 'ru' ? "Загрузите документы" : "Upload Documents" },
    { num: 5, title: language === 'uz' ? "Ariza yuboring" : language === 'ru' ? "Отправьте заявку" : "Submit Application" },
    { num: 6, title: language === 'uz' ? "Qabul xatini oling" : language === 'ru' ? "Получите приглашение" : "Receive Admission" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16 px-4">
          <Logo />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                {language === 'uz' ? "Kirish" : language === 'ru' ? "Войти" : "Login"}
              </Button>
            </Link>
            <Link to="/onboarding">
              <Button size="sm" className="gap-2">
                {language === 'uz' ? "Boshlash" : language === 'ru' ? "Начать" : "Get Started"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center max-w-3xl mx-auto animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <Rocket className="w-4 h-4" />
              <span>{t.aboutTitle.replace('UniPath', activeTenant?.name || 'UniPath')}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {language === 'uz' ? "Xorijiy ta'limga eng oson yo'l" : language === 'ru' ? "Самый простой путь к зарубежному образованию" : "The Easiest Path to Study Abroad"}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              {t.aboutDescription.replace('UniPath', activeTenant?.name || 'UniPath')}
            </p>

            {/* Founder - Only show if we have an owner name */}
            {activeTenant?.owner_name && (
              <div className="flex items-center justify-center mt-8">
                <div className="flex items-center gap-4 p-6 bg-card rounded-2xl border border-border/50 shadow-card">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">
                      {language === 'uz' ? "Asoschisi" : language === 'ru' ? "Основатель" : "Founder"}
                    </p>
                    <h3 className="text-xl font-semibold text-foreground">
                      {activeTenant.owner_name}
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {language === 'uz' ? `Nega ${activeTenant?.name || 'UniPath'}?` : language === 'ru' ? `Почему ${activeTenant?.name || 'UniPath'}?` : `Why ${activeTenant?.name || 'UniPath'}?`}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="card-hover border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {language === 'uz' ? "Qanday ishlaydi?" : language === 'ru' ? "Как это работает?" : "How It Works?"}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {steps.map((step) => (
              <div key={step.num} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  {step.num}
                </div>
                <span className="font-medium text-foreground">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {language === 'uz' ? "Sayohatingizni hozir boshlang" : language === 'ru' ? "Начните свое путешествие сейчас" : "Start Your Journey Today"}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {language === 'uz' ? `Minglab talabalar ${activeTenant?.name || 'UniPath'} orqali orzularini amalga oshirdi` : language === 'ru' ? `Тысячи студентов осуществили свои мечты через ${activeTenant?.name || 'UniPath'}` : `Thousands of students achieved their dreams through ${activeTenant?.name || 'UniPath'}`}
          </p>
          <Link to="/onboarding">
            <Button size="lg" className="gap-2 shadow-glow">
              <GraduationCap className="w-5 h-5" />
              {language === 'uz' ? "Boshlash" : language === 'ru' ? "Начать" : "Get Started"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Social Links */}
      <section className="py-12 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {language === 'uz' ? "Bizni kuzatib boring" : language === 'ru' ? "Следите за нами" : "Follow Us"}
            </h2>
            <p className="text-muted-foreground">
              {language === 'uz' ? "Ijtimoiy tarmoqlarda bizga qo'shiling" : language === 'ru' ? "Присоединяйтесь к нам в социальных сетях" : "Join us on social media"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a 
              href="https://www.linkedin.com/in/unipath-community-70868a372" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-[#0077B5] hover:bg-[#006396] text-white rounded-xl transition-colors shadow-lg"
            >
              <Linkedin className="w-5 h-5" />
              <span className="font-medium">LinkedIn</span>
            </a>
            <a 
              href="https://youtube.com/@uni_path" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-xl transition-colors shadow-lg"
            >
              <Youtube className="w-5 h-5" />
              <span className="font-medium">YouTube</span>
            </a>
            <a 
              href="https://t.me/UniPath_official" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-[#0088CC] hover:bg-[#006699] text-white rounded-xl transition-colors shadow-lg"
            >
              <Send className="w-5 h-5" />
              <span className="font-medium">Telegram</span>
            </a>
            <a 
              href="https://www.facebook.com/share/1Bp3MFfGsP/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl transition-colors shadow-lg"
            >
              <Facebook className="w-5 h-5" />
              <span className="font-medium">Facebook</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} {activeTenant?.name || 'UniPath'}. {language === 'uz' ? "Barcha huquqlar himoyalangan." : language === 'ru' ? "Все права защищены." : "All rights reserved."}</p>
        </div>
      </footer>
    </div>
  );
}
