"use client"

import { useState } from "react"
import { Boxes, ChevronDown, Globe, Menu, X } from "lucide-react"
import { languages, type Lang, type Translation } from "@/lib/translations"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"

export function Navbar({
  t,
  lang,
  setLang,
  onLogin,
  onGetStarted,
  onBookDemo,
}: {
  t: Translation
  lang: Lang
  setLang: (l: Lang) => void
  onLogin?: () => void
  onGetStarted?: () => void
  onBookDemo?: () => void
}) {
  const [langOpen, setLangOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const current = languages.find((l) => l.code === lang)!
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-full border border-border/70 bg-card/80 px-4 py-2.5 shadow-sm backdrop-blur-xl sm:px-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-lime text-forest shadow-sm">
            <Boxes className="size-5" strokeWidth={2.2} />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            UniPath
          </span>
        </a>

        {/* Center links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {t.nav.links.map((link) => (
            <a
              key={link.id}
              href={link.id === 'pricing' ? '/pricing' : `#${link.id}`}
              onClick={link.id === 'pricing' ? (e) => { e.preventDefault(); navigate('/pricing'); } : undefined}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              onBlur={() => setTimeout(() => setLangOpen(false), 150)}
              className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              aria-label="Change language"
            >
              <Globe className="size-4 text-muted-foreground" />
              <span>{current.short}</span>
              <ChevronDown
                className={`size-3.5 text-muted-foreground transition-transform ${langOpen ? "rotate-180" : ""}`}
              />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-lg">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onMouseDown={() => {
                      setLang(l.code)
                      setLangOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-secondary ${
                      l.code === lang ? "font-semibold text-forest" : "text-muted-foreground"
                    }`}
                  >
                    {l.label}
                    <span className="text-xs text-muted-foreground">{l.short}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {onBookDemo && (
            <button
              onClick={onBookDemo}
              className="hidden rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary lg:block"
            >
              {t.demo.trigger}
            </button>
          )}

          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden rounded-full bg-lime px-4 py-2 text-sm font-semibold text-forest shadow-sm transition-all hover:bg-lime-bright hover:shadow-md md:block"
            >
              {lang === 'uz' ? 'Boshqaruv paneli' : 'Dashboard'}
            </button>
          ) : (
            <>
              <button 
                onClick={onLogin}
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:block"
              >
                {t.nav.login}
              </button>
              <button 
                onClick={onGetStarted}
                className="hidden rounded-full bg-lime px-4 py-2 text-sm font-semibold text-forest shadow-sm transition-all hover:bg-lime-bright hover:shadow-md md:block"
              >
                {t.nav.getStarted}
              </button>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className="flex size-9 items-center justify-center rounded-full border border-border/70 text-foreground lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-7xl rounded-3xl border border-border bg-card p-4 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-1">
            {t.nav.links.map((link) => (
              <a
                key={link.id}
                href={link.id === 'pricing' ? '/pricing' : `#${link.id}`}
                onClick={(e) => {
                  setMobileOpen(false);
                  if (link.id === 'pricing') { e.preventDefault(); navigate('/pricing'); }
                }}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            {onBookDemo && (
              <button
                onClick={() => { setMobileOpen(false); onBookDemo(); }}
                className="mt-1 rounded-xl border border-border px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {t.demo.trigger}
              </button>
            )}
            <div className="mt-2 flex gap-2">
              {user ? (
                <button 
                  onClick={() => { setMobileOpen(false); navigate('/dashboard'); }}
                  className="flex-1 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-forest"
                >
                  {lang === 'uz' ? 'Boshqaruv paneli' : 'Dashboard'}
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => { setMobileOpen(false); onLogin?.(); }}
                    className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground"
                  >
                    {t.nav.login}
                  </button>
                  <button 
                    onClick={() => { setMobileOpen(false); onGetStarted?.(); }}
                    className="flex-1 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-forest"
                  >
                    {t.nav.getStarted}
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
