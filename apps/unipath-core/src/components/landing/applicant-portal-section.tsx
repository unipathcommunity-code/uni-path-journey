import { Check, Sparkles } from "lucide-react"
import type { Translation } from "@/lib/translations"
import { Reveal } from "./reveal"

/**
 * Replaces the old AI-camera attendance section. Face recognition at a
 * classroom door belonged to the academy product; a consulting agency's
 * equivalent story is the applicant watching their own file move.
 */
export function ApplicantPortalSection({ t }: { t: Translation }) {
  const steps = t.applicantPortal.steps

  return (
    <section id="applicant-portal" className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <Sparkles className="size-3.5 text-forest" />
                {t.applicantPortal.badge}
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 max-w-xl font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                {t.applicantPortal.title}
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                {t.applicantPortal.subtitle}
              </p>
            </Reveal>
            <ul className="mt-7 space-y-3">
              {t.applicantPortal.points.map((p, i) => (
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
                {t.applicantPortal.note}
              </p>
            </Reveal>
          </div>

          {/* Visual: the pipeline as the applicant sees it */}
          <Reveal delay={120} className="relative">
            <div className="absolute -right-10 top-1/2 -z-10 size-72 -translate-y-1/2 rounded-full bg-lime/20 blur-3xl" />
            <div className="relative mx-auto w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.applicantPortal.cardLabel}
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-foreground">
                {t.applicantPortal.cardName}
              </p>

              <ol className="mt-6 space-y-0">
                {steps.map((step, i) => {
                  const done = i < 3
                  const current = i === 3
                  return (
                    <li key={step} className="flex gap-3">
                      {/* rail */}
                      <div className="flex flex-col items-center">
                        <span
                          className={[
                            "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            done
                              ? "bg-lime text-forest"
                              : current
                                ? "bg-forest text-white ring-4 ring-lime/30"
                                : "border border-border bg-card text-muted-foreground",
                          ].join(" ")}
                        >
                          {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                        </span>
                        {i < steps.length - 1 && (
                          <span
                            className={[
                              "w-0.5 flex-1",
                              done ? "bg-lime" : "bg-border",
                            ].join(" ")}
                            style={{ minHeight: "1.75rem" }}
                          />
                        )}
                      </div>
                      {/* label */}
                      <span
                        className={[
                          "pb-6 text-sm",
                          current
                            ? "font-semibold text-foreground"
                            : done
                              ? "text-foreground/70"
                              : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {step}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
