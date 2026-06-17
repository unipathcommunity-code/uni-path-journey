import { Bell, FileText, LayoutGrid, Send, Users, TrendingUp } from "lucide-react"
import type { Translation } from "@/lib/translations"
import { Reveal } from "./reveal"

export function FeaturesSection({ t }: { t: Translation }) {
  const f = t.features

  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <LayoutGrid className="size-3.5 text-forest" />
          {f.badge}
        </span>
        <h2 className="mt-5 max-w-3xl font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
          {f.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
          {f.subtitle}
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {/* Column 1: Smart CRM Kanban */}
        <Reveal as="div" className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="rounded-2xl bg-secondary/50 p-4">
            <div className="grid grid-cols-3 gap-2">
              {[f.kanban.lead, f.kanban.applied, f.kanban.closed].map((col, ci) => (
                <div key={col} className="rounded-xl bg-card p-2.5 shadow-sm">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {col}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {Array.from({ length: 3 - ci }).map((_, k) => (
                      <div
                        key={k}
                        className={`h-7 rounded-md ${ci === 2 ? "bg-lime/30" : "bg-secondary"}`}
                      >
                        <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/20" style={{ margin: "6px" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <span className="mt-6 flex size-10 items-center justify-center rounded-xl bg-lime/15 text-forest">
            <Users className="size-5" />
          </span>
          <h3 className="mt-4 font-heading text-lg font-bold text-foreground">{f.cards[0].title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.cards[0].desc}</p>
        </Reveal>

        {/* Column 2: Financial dashboard */}
        <Reveal as="div" delay={120} className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md lg:-mt-4">
          <div className="rounded-2xl bg-secondary/50 p-4">
            <div className="flex items-end justify-between gap-2 px-1" style={{ height: "120px" }}>
              {[55, 35, 70, 45, 85, 60, 95].map((h, i) => (
                <div key={i} className="flex h-full flex-1 flex-col justify-end gap-1">
                  <div
                    className="w-full origin-bottom rounded-t-md bg-lime"
                    style={{ height: `${h}%`, animation: `up-bar-grow 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s both` }}
                  />
                  <div
                    className="w-full origin-bottom rounded-b-md bg-forest/25"
                    style={{ height: `${h * 0.35}%`, animation: `up-bar-grow 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.08 + 0.1}s both` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-card px-3 py-2 shadow-sm">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="size-2 rounded-full bg-lime" /> {f.finance.income}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="size-2 rounded-full bg-forest/40" /> {f.finance.expenses}
              </span>
              <span className="text-xs font-bold text-forest">{f.finance.profit} +24%</span>
            </div>
          </div>
          <span className="mt-6 flex size-10 items-center justify-center rounded-xl bg-lime/15 text-forest">
            <TrendingUp className="size-5" />
          </span>
          <h3 className="mt-4 font-heading text-lg font-bold text-foreground">{f.cards[1].title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.cards[1].desc}</p>
        </Reveal>

        {/* Column 3: AI & Automation */}
        <Reveal as="div" delay={240} className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex flex-col gap-2 rounded-2xl bg-secondary/50 p-4">
            <div className="flex items-center gap-2.5 rounded-xl bg-card p-3 shadow-sm">
              <span className="flex size-8 items-center justify-center rounded-lg bg-lime/20 text-forest">
                <Send className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">Telegram</p>
                <p className="text-[10px] text-muted-foreground">{f.automation.sent}</p>
              </div>
              <span className="rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-bold text-forest">
                128
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-card p-3 shadow-sm">
              <span className="flex size-8 items-center justify-center rounded-lg bg-lime/20 text-forest">
                <FileText className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">Invoice #2026-041</p>
                <p className="text-[10px] text-muted-foreground">{f.automation.invoice}</p>
              </div>
              <Bell className="size-3.5 text-lime" />
            </div>
            <div className="h-2 w-3/4 rounded-full bg-muted-foreground/15" />
            <div className="h-2 w-1/2 rounded-full bg-muted-foreground/15" />
          </div>
          <span className="mt-6 flex size-10 items-center justify-center rounded-xl bg-lime/15 text-forest">
            <Bell className="size-5" />
          </span>
          <h3 className="mt-4 font-heading text-lg font-bold text-foreground">{f.cards[2].title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.cards[2].desc}</p>
        </Reveal>
      </div>
    </section>
  )
}
