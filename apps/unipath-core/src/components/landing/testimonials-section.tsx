"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, MessageSquareQuote, Quote } from "lucide-react"
import type { Translation } from "@/lib/translations"

export function TestimonialsSection({ t }: { t: Translation }) {
  const items = t.testimonials.items
  const [index, setIndex] = useState(0)
  const perView = 2
  const maxStart = Math.max(0, items.length - perView)

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(maxStart, i + 1))

  const visible = items.slice(index, index + perView)

  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <MessageSquareQuote className="size-3.5 text-forest" />
            {t.testimonials.badge}
          </span>
          <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
            {t.testimonials.title}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prev}
            disabled={index === 0}
            className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            aria-label="Previous testimonials"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            onClick={next}
            disabled={index >= maxStart}
            className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            aria-label="Next testimonials"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {visible.map((item) => (
          <figure
            key={item.name}
            className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-sm"
          >
            <Quote className="size-9 fill-lime text-lime" />
            <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground text-pretty">
              {item.quote}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
              <span className="flex size-11 items-center justify-center rounded-full bg-lime/20 font-heading text-sm font-bold text-forest">
                {item.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
