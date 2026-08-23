import React, { useState, useRef, useEffect } from 'react';
import { useTenant } from './TenantProvider';
import type { BusinessVertical } from './types';
import { VERTICAL_LABELS } from './verticals';

// ---------------------------------------------------------------------------
// Vertical icon (emoji fallback — no icon library dependency in the package)
// ---------------------------------------------------------------------------

const VERTICAL_ICONS: Record<BusinessVertical, string> = {
  consulting: '💼',
};

// ---------------------------------------------------------------------------
// AppEntry — represents one app/vertical the user can switch to
// ---------------------------------------------------------------------------

export interface AppEntry {
  /** Unique identifier — usually the vertical name or route prefix */
  id: string;
  label: string;
  icon: string;
  /** Absolute or relative path to navigate to */
  href: string;
}

// ---------------------------------------------------------------------------
// BranchSwitcher
// ---------------------------------------------------------------------------

export interface BranchSwitcherProps {
  /**
   * Current language for vertical labels. Defaults to 'en'.
   */
  lang?: 'uz' | 'ru' | 'en';
  /**
   * Additional app entries to show in the "switch app" section.
   * Omit or pass empty array to hide the section.
   */
  apps?: AppEntry[];
  /**
   * Called when the user selects an app entry (for SPA navigation).
   * If not provided, uses window.location.href.
   */
  onNavigate?: (href: string) => void;
  /** Extra CSS classes for the trigger button */
  className?: string;
  /** Whether to show the vertical indicator on the trigger button */
  showVertical?: boolean;
}

const LABELS = {
  branchSection: { uz: 'FILIAL', ru: 'ФИЛИАЛ', en: 'BRANCH' },
  appSection: { uz: 'ILOVA', ru: 'ПРИЛОЖЕНИЕ', en: 'APP' },
  noBranches: { uz: 'Filiallar yo\'q', ru: 'Нет филиалов', en: 'No branches' },
  switchBranch: { uz: 'Filialni almashtirish', ru: 'Переключить филиал', en: 'Switch branch' },
  main: { uz: 'ASOSIY', ru: 'ГЛАВНЫЙ', en: 'MAIN' },
} as const;

function t(key: keyof typeof LABELS, lang: 'uz' | 'ru' | 'en'): string {
  return LABELS[key][lang];
}

export function BranchSwitcher({
  lang = 'en',
  apps = [],
  onNavigate,
  className = '',
  showVertical = true,
}: BranchSwitcherProps) {
  const { activeTenant, activeBranch, availableBranches, switchBranch } = useTenant();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const vertical = activeTenant?.business_type ?? 'consulting';
  const verticalIcon = VERTICAL_ICONS[vertical as BusinessVertical] ?? '🏢';
  const verticalLabel = VERTICAL_LABELS[vertical as BusinessVertical]?.[lang] ?? vertical;
  const hasBranches = availableBranches.length > 0;
  const hasMultiBranch = availableBranches.length > 1;
  const hasApps = apps.length > 0;

  // Nothing to show — single branch, no apps → render a static label
  if (!hasMultiBranch && !hasApps) {
    return (
      <div className={['flex items-center gap-1.5 px-2 py-1.5', className].join(' ')}>
        {showVertical && <span className="text-sm">{verticalIcon}</span>}
        <span className="text-xs font-semibold truncate text-muted-foreground">
          {activeBranch?.name ?? activeTenant?.name ?? '—'}
        </span>
      </div>
    );
  }

  function handleNavigate(href: string) {
    setOpen(false);
    if (onNavigate) {
      onNavigate(href);
    } else if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  }

  function handleBranchSelect(id: string) {
    switchBranch(id);
    setOpen(false);
  }

  return (
    <div ref={ref} className={['relative', className].join(' ')}>
      {/* ── Trigger button ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t('switchBranch', lang)}
        className={[
          'flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left',
          'border-border/60 bg-background/60 hover:bg-accent/50',
          'transition-colors duration-150 max-w-[180px] sm:max-w-[220px]',
        ].join(' ')}
      >
        {showVertical && (
          <span className="text-base leading-none flex-shrink-0">{verticalIcon}</span>
        )}
        <span className="flex-1 min-w-0 text-xs sm:text-sm font-semibold truncate leading-tight">
          {activeBranch?.name ?? activeTenant?.name ?? '—'}
        </span>
        {/* Chevron */}
        <svg
          className={[
            'w-3.5 h-3.5 flex-shrink-0 text-muted-foreground transition-transform duration-150',
            open ? 'rotate-180' : '',
          ].join(' ')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────── */}
      {open && (
        <div
          role="listbox"
          className={[
            'absolute left-0 mt-2 w-64 rounded-xl border border-border',
            'bg-popover shadow-xl z-50 overflow-hidden',
            // CSS-only entrance — no framer-motion dependency
            'animate-in fade-in-0 slide-in-from-top-1 duration-150',
          ].join(' ')}
        >
          {/* Vertical badge */}
          {showVertical && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-muted/30">
              <span className="text-base">{verticalIcon}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {activeTenant?.name ?? '—'}
                </p>
                <p className="text-[9px] text-muted-foreground/70 truncate">{verticalLabel}</p>
              </div>
            </div>
          )}

          {/* Branch section */}
          {hasBranches && (
            <>
              <div className="px-3 pt-2 pb-1">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
                  {t('branchSection', lang)}
                </p>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {availableBranches.map((branch) => {
                  const isActive = activeBranch?.id === branch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleBranchSelect(branch.id)}
                      className={[
                        'w-full text-left px-3 py-2.5 flex items-center gap-2',
                        'transition-colors hover:bg-accent/50',
                        isActive ? 'bg-accent/70' : '',
                      ].join(' ')}
                    >
                      {/* Branch icon */}
                      <span className="text-sm text-muted-foreground flex-shrink-0">
                        🏢
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{branch.name}</p>
                        {branch.city && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            📍 {branch.city}
                          </p>
                        )}
                      </div>
                      {isActive && (
                        <svg
                          className="w-4 h-4 text-primary flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* App / vertical switch section */}
          {hasApps && (
            <>
              <div
                className={[
                  'px-3 pt-2 pb-1',
                  hasBranches ? 'border-t border-border/60 mt-1' : '',
                ].join(' ')}
              >
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
                  {t('appSection', lang)}
                </p>
              </div>
              <div className="pb-1">
                {apps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleNavigate(app.href)}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-accent/50"
                  >
                    <span className="text-base leading-none">{app.icon}</span>
                    <span className="text-sm font-medium">{app.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
