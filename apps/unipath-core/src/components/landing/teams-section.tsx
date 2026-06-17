"use client"

import { useState } from "react"
import { Check, GraduationCap, Plane, Briefcase, ShieldCheck, Workflow } from "lucide-react"
import type { Translation } from "@/lib/translations"
import { AssistantIllustration } from "./illustrations"

const tabIcons = [GraduationCap, Plane, Briefcase, ShieldCheck]

export function TeamsSection({ t }: { t: Translation }) {
  const [active, setActive] = useState(0)
  const tab = t.teams.tabs[active]

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Workflow className="size-3.5 text-forest" />
            {t.teams.badge}
          </span>
          <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
            {t.teams.title}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            {t.teams.subtitle}
          </p>

          {/* Tabs */}
          <div className="mt-8 flex flex-col gap-2">
            {t.teams.tabs.map((tabItem, i) => {
              const Icon = tabIcons[i]
              const isActive = i === active
              return (
                <button
                  key={tabItem.label}
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                    isActive
                      ? "border-lime bg-lime/10 text-forest shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-lime/50 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`flex size-8 items-center justify-center rounded-lg ${
                      isActive ? "bg-lime text-forest" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  {tabItem.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: illustration + dynamic detail */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-secondary/50 py-4">
            <div className="absolute left-1/2 top-1/2 -z-0 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/20 blur-2xl" />
            <AssistantIllustration className="relative mx-auto w-full max-w-sm" />
          </div>
          <h3 key={tab.heading} className="mt-6 font-heading text-xl font-bold text-foreground" style={{ animation: "up-rise 0.5s ease-out" }}>
            {tab.heading}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tab.desc}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {tab.points.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-lime/20 text-forest">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-sm leading-snug text-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
