import type { Translation } from "@/lib/translations"
import { Reveal } from "./reveal"

export function StatsSection({ t }: { t: Translation }) {
  return (
    <section className="relative mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <div className="rounded-3xl border border-border bg-card/60 px-6 py-10 shadow-sm backdrop-blur-sm sm:px-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.stats.items.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <div className="flex flex-col items-center text-center">
                <span className="font-heading text-4xl font-bold tracking-tight text-forest sm:text-5xl">
                  {s.value}
                </span>
                <p className="mt-2 max-w-[14rem] text-sm leading-relaxed text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
