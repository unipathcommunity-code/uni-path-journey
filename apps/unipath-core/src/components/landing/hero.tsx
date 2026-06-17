import { ArrowRight, BarChart3, Cpu, Rocket, Search } from "lucide-react"
import type { Translation } from "@/lib/translations"
import { HeroIllustration } from "./illustrations"
import { Reveal } from "./reveal"

const metricIcons = [Search, BarChart3, Cpu]

export function Hero({ t, onGetStarted }: { t: Translation; onGetStarted?: () => void }) {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Illustration */}
        <div className="relative order-2 lg:order-1">
          <div className="absolute -left-10 top-1/2 -z-10 size-72 -translate-y-1/2 rounded-full bg-lime/25 blur-3xl" />
          <HeroIllustration />
        </div>

        {/* Content */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Rocket className="size-3.5 text-forest" />
              {t.hero.badge}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.08] tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
              {t.hero.title}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t.hero.description}
            </p>
          </Reveal>
          <Reveal delay={240}>
            <button 
              onClick={onGetStarted}
              className="group mt-7 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-semibold text-forest shadow-md transition-all hover:-translate-y-0.5 hover:bg-lime-bright hover:shadow-lg"
            >
              {t.hero.cta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Reveal>

          {/* Metrics */}
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {t.hero.metrics.map((m, i) => {
              const Icon = metricIcons[i]
              return (
                <Reveal key={m.title} delay={320 + i * 100}>
                  <div className="flex flex-col gap-2">
                    <span className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-forest shadow-sm">
                      <Icon className="size-5" />
                    </span>
                    <p className="text-sm font-semibold text-foreground">{m.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{m.desc}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
