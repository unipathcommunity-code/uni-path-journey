"use client"

import { useApp } from "@/contexts/AppContext"
import { translations, type Lang, type Translation } from "@/lib/translations"
import { Navbar } from "./navbar"
import { Hero } from "./hero"
import { ModulesSection } from "./modules-section"
import { TeamsSection } from "./teams-section"
import { FeaturesSection } from "./features-section"
import { CtaSection } from "./cta-section"
import { TestimonialsSection } from "./testimonials-section"
import { Footer } from "./footer"

export interface LandingPageProps {
  onLogin?: () => void
  onGetStarted?: () => void
}

export function LandingPage({ onLogin, onGetStarted }: LandingPageProps) {
  const { language, setLanguage } = useApp()
  const lang = (language === "uz" || language === "ru" || language === "en" ? language : "en") as Lang
  const setLang = (l: Lang) => setLanguage(l)
  const t = translations[lang] as Translation

  // Existing translation flags, kept for compatibility across the app.
  const isUz = lang === "uz"
  const isRu = lang === "ru"
  const isEn = lang === "en"
  void isUz
  void isRu
  void isEn

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Soft ambient background gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 right-0 size-[32rem] rounded-full bg-lime/10 blur-3xl" />
        <div className="absolute top-[40%] -left-40 size-[30rem] rounded-full bg-lime/10 blur-3xl" />
      </div>

      <div className="px-4 sm:px-6">
        <Navbar t={t} lang={lang} setLang={setLang} onLogin={onLogin} onGetStarted={onGetStarted} />
      </div>

      <main>
        <Hero t={t} onGetStarted={onGetStarted} />
        <ModulesSection t={t} onGetStarted={onGetStarted} />
        <TeamsSection t={t} />
        <FeaturesSection t={t} />
        <CtaSection t={t} onGetStarted={onGetStarted} />
        <TestimonialsSection t={t} />
      </main>

      <Footer t={t} onGetStarted={onGetStarted} />
    </div>
  )
}

