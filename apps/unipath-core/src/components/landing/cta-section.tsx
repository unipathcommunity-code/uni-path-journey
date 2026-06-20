import { ArrowRight, Zap } from "lucide-react"
import type { Translation } from "@/lib/translations"
import { NetworkIllustration } from "./illustrations"
import { Reveal } from "./reveal"

export function CtaSection({ t, onGetStarted, onBookDemo }: { t: Translation; onGetStarted?: () => void; onBookDemo?: () => void }) {
  return (
    <section id="pricing" className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Reveal className="relative flex flex-col items-center text-center">
          <div className="absolute left-1/2 top-1/2 -z-10 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/15 blur-3xl" />
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Zap className="size-3.5 text-forest" />
            {t.cta.badge}
          </span>
          <h2 className="mt-5 max-w-3xl font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
            {t.cta.title}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
            {t.cta.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={onGetStarted}
              className="group inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-semibold text-forest shadow-md transition-all hover:-translate-y-0.5 hover:bg-lime-bright hover:shadow-lg"
            >
              {t.cta.primary}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onBookDemo ?? onGetStarted}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              {t.cta.secondary}
            </button>
          </div>

          <div className="relative mt-12 w-full max-w-3xl">
            <NetworkIllustration />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
