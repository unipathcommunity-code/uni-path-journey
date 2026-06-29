import { ArrowRight, Briefcase, GraduationCap, Layers, Plane, Plug, UtensilsCrossed, Bed, Gem } from "lucide-react"
import type { Translation } from "@/lib/translations"
import { Reveal } from "./reveal"

const cardIcons = [Briefcase, GraduationCap, Plane, UtensilsCrossed, Bed, Gem, Plug]

export function ModulesSection({ t, onGetStarted }: { t: Translation; onGetStarted?: () => void }) {
  return (
    <section id="core" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <Layers className="size-3.5 text-forest" />
          {t.modules.badge}
        </span>
        <h2 className="mt-5 max-w-3xl font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
          {t.modules.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
          {t.modules.subtitle}
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {t.modules.cards.map((card, i) => {
          const Icon = cardIcons[i]
          const highlighted = "highlighted" in card && card.highlighted

          if (highlighted) {
            return (
              <Reveal
                key={card.title}
                delay={i * 100}
                className="relative flex flex-col rounded-3xl bg-gradient-to-br from-lime-bright to-lime p-7 shadow-lg shadow-lime/30 transition-transform hover:-translate-y-1 lg:-mt-4 lg:mb-4"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-card/90 text-forest shadow-sm">
                  <Icon className="size-5" />
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-forest/70">
                  {card.tag}
                </p>
                <h3 className="mt-1.5 font-heading text-xl font-bold text-forest">{card.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-forest/80">{card.desc}</p>
                <button 
                  onClick={onGetStarted}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-lime transition-opacity hover:opacity-90"
                >
                  {"cta" in card ? card.cta : ""}
                  <ArrowRight className="size-4" />
                </button>
              </Reveal>
            )
          }

          return (
            <Reveal
              key={card.title}
              delay={i * 100}
              className="group flex flex-col rounded-3xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-lime hover:shadow-md"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-forest transition-colors group-hover:bg-lime/20">
                <Icon className="size-5" />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {card.tag}
              </p>
              <h3 className="mt-1.5 font-heading text-xl font-bold text-foreground">{card.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
