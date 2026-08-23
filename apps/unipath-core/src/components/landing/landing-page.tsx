"use client"

import { useState } from "react"
import { useApp } from "@/contexts/AppContext"
import { translations, type Lang, type Translation } from "@/lib/translations"
import { Navbar } from "./navbar"
import { Hero } from "./hero"
import { StatsSection } from "./stats-section"
import { ModulesSection } from "./modules-section"
import { ApplicantPortalSection } from "./applicant-portal-section"
import { TeamsSection } from "./teams-section"
import { FeaturesSection } from "./features-section"
import { CtaSection } from "./cta-section"
import { TestimonialsSection } from "./testimonials-section"
import { DemoRequestDialog } from "./demo-request-dialog"
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
  const [demoOpen, setDemoOpen] = useState(false)
  const openDemo = () => setDemoOpen(true)

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
        <Navbar t={t} lang={lang} setLang={setLang} onLogin={onLogin} onGetStarted={onGetStarted} onBookDemo={openDemo} />
      </div>

      <main>
        <Hero t={t} onGetStarted={onGetStarted} />
        <StatsSection t={t} />
        <ModulesSection t={t} onGetStarted={onGetStarted} />
        <ApplicantPortalSection t={t} />
        <TeamsSection t={t} />
        <FeaturesSection t={t} />
        <CtaSection t={t} onGetStarted={onGetStarted} onBookDemo={openDemo} />
        <TestimonialsSection t={t} />
      </main>

      <Footer t={t} onGetStarted={onGetStarted} />

      <DemoRequestDialog t={t} open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  )
}

