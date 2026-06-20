import { Check, ScanFace, Sparkles } from "lucide-react"
import type { Translation } from "@/lib/translations"
import { Reveal } from "./reveal"

export function AiVisionSection({ t }: { t: Translation }) {
  return (
    <section id="ai-vision" className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <Sparkles className="size-3.5 text-forest" />
                {t.aiVision.badge}
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 max-w-xl font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                {t.aiVision.title}
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                {t.aiVision.subtitle}
              </p>
            </Reveal>
            <ul className="mt-7 space-y-3">
              {t.aiVision.points.map((p, i) => (
                <Reveal key={p} delay={220 + i * 80}>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-lime text-forest">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-relaxed text-foreground">{p}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={560}>
              <p className="mt-7 inline-flex rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-forest">
                {t.aiVision.note}
              </p>
            </Reveal>
          </div>

          {/* Visual */}
          <Reveal delay={120} className="relative">
            <div className="absolute -right-10 top-1/2 -z-10 size-72 -translate-y-1/2 rounded-full bg-lime/20 blur-3xl" />
            <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-3xl border border-border bg-card shadow-md">
              {/* Scanning frame */}
              <div className="relative flex size-56 items-center justify-center rounded-2xl border-2 border-dashed border-lime/60">
                <ScanFace className="size-28 text-forest" strokeWidth={1.2} />
                {/* Corner accents */}
                <span className="absolute -left-1 -top-1 size-6 rounded-tl-2xl border-l-4 border-t-4 border-lime" />
                <span className="absolute -right-1 -top-1 size-6 rounded-tr-2xl border-r-4 border-t-4 border-lime" />
                <span className="absolute -bottom-1 -left-1 size-6 rounded-bl-2xl border-b-4 border-l-4 border-lime" />
                <span className="absolute -bottom-1 -right-1 size-6 rounded-br-2xl border-b-4 border-r-4 border-lime" />
              </div>
              <span className="absolute bottom-6 flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-forest shadow-sm">
                <span className="size-2 animate-pulse rounded-full bg-forest" />
                AI Check-in
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
