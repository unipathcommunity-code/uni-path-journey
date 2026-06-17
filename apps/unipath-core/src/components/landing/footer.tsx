import { AtSign, Boxes, Globe, MessageCircle, Send, Share2 } from "lucide-react"
import type { Translation } from "@/lib/translations"

const socials = [Send, MessageCircle, Share2, Globe, AtSign]

export function Footer({ t, onGetStarted }: { t: Translation; onGetStarted?: () => void }) {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand + subscribe */}
          <div>
            <a href="#" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-lime text-forest">
                <Boxes className="size-5" strokeWidth={2.2} />
              </span>
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                UniPath
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t.footer.tagline}
            </p>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onGetStarted?.();
              }}
              className="mt-6 flex max-w-sm items-center gap-2 rounded-full border border-border bg-background p-1.5"
            >
              <input
                type="email"
                placeholder={t.footer.emailPlaceholder}
                aria-label={t.footer.emailPlaceholder}
                className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-forest transition-colors hover:bg-lime-bright"
              >
                {t.footer.getStarted}
              </button>
            </form>
            <div className="mt-6 flex gap-2">
              {socials.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-forest"
                  aria-label="Social link"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {t.footer.columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-heading text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <div className="flex gap-5">
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              {t.footer.privacy}
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              {t.footer.terms}
            </a>
          </div>
          <p className="text-xs text-muted-foreground">{t.footer.rights}</p>
        </div>
      </div>
    </footer>
  )
}
