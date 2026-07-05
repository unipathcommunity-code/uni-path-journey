import {
  Briefcase, Plane, GraduationCap, BedDouble, UtensilsCrossed, Pill, Dumbbell,
  Factory, Wrench, HeartPulse, Car, Gem, Baby, BookOpen, Scissors, Trophy,
  Building2, LucideIcon,
} from 'lucide-react';

// Per-vertical visual identity — one source of truth so every super-admin surface
// renders each business type with a consistent icon + colour (a restaurant looks
// like a restaurant, a hotel like a hotel, etc.).
export interface VerticalStyle {
  icon: LucideIcon;
  grad: string;   // card accent gradient (tailwind)
  text: string;   // accent text colour
  ring: string;   // border/ring colour
}

export const VERTICAL_STYLE: Record<string, VerticalStyle> = {
  consulting:    { icon: Briefcase,       grad: 'from-blue-500/25 to-blue-500/5',       text: 'text-blue-400',    ring: 'border-blue-500/20' },
  tour:          { icon: Plane,           grad: 'from-sky-500/25 to-sky-500/5',         text: 'text-sky-400',     ring: 'border-sky-500/20' },
  academy:       { icon: GraduationCap,   grad: 'from-violet-500/25 to-violet-500/5',   text: 'text-violet-400',  ring: 'border-violet-500/20' },
  hotel:         { icon: BedDouble,       grad: 'from-indigo-500/25 to-indigo-500/5',   text: 'text-indigo-400',  ring: 'border-indigo-500/20' },
  restaurant:    { icon: UtensilsCrossed, grad: 'from-orange-500/25 to-orange-500/5',   text: 'text-orange-400',  ring: 'border-orange-500/20' },
  pharmacy:      { icon: Pill,            grad: 'from-emerald-500/25 to-emerald-500/5', text: 'text-emerald-400', ring: 'border-emerald-500/20' },
  gym:           { icon: Dumbbell,        grad: 'from-rose-500/25 to-rose-500/5',       text: 'text-rose-400',    ring: 'border-rose-500/20' },
  manufacturing: { icon: Factory,         grad: 'from-slate-500/25 to-slate-500/5',     text: 'text-slate-300',   ring: 'border-slate-500/20' },
  auto_service:  { icon: Wrench,          grad: 'from-amber-500/25 to-amber-500/5',     text: 'text-amber-400',   ring: 'border-amber-500/20' },
  clinic:        { icon: HeartPulse,      grad: 'from-teal-500/25 to-teal-500/5',       text: 'text-teal-400',    ring: 'border-teal-500/20' },
  parking:       { icon: Car,             grad: 'from-cyan-500/25 to-cyan-500/5',       text: 'text-cyan-400',    ring: 'border-cyan-500/20' },
  wedding_hall:  { icon: Gem,             grad: 'from-pink-500/25 to-pink-500/5',       text: 'text-pink-400',    ring: 'border-pink-500/20' },
  kindergarten:  { icon: Baby,            grad: 'from-yellow-500/25 to-yellow-500/5',   text: 'text-yellow-400',  ring: 'border-yellow-500/20' },
  library:       { icon: BookOpen,        grad: 'from-lime-500/25 to-lime-500/5',       text: 'text-lime-400',    ring: 'border-lime-500/20' },
  cosmetics:     { icon: Scissors,        grad: 'from-fuchsia-500/25 to-fuchsia-500/5', text: 'text-fuchsia-400', ring: 'border-fuchsia-500/20' },
  stadium:       { icon: Trophy,          grad: 'from-green-500/25 to-green-500/5',     text: 'text-green-400',   ring: 'border-green-500/20' },
  car_showroom:  { icon: Car,             grad: 'from-red-500/25 to-red-500/5',         text: 'text-red-400',     ring: 'border-red-500/20' },
};

export const verticalStyle = (v?: string | null): VerticalStyle =>
  (v && VERTICAL_STYLE[v]) || { icon: Building2, grad: 'from-white/10 to-transparent', text: 'text-white/60', ring: 'border-white/10' };

/** Impersonate a tenant from any super-admin surface (preserves branding/config). */
export function impersonateTenant(t: { business_type?: string | null; vertical?: string | null; config?: any } & Record<string, any>) {
  const bt = t.business_type || t.vertical || 'consulting';
  const payload = {
    ...t,
    business_type: bt,
    config: {
      ...(t.config || {}),
      business_type: bt,
      modules: { ...((t.config as any)?.modules || {}), [bt]: true },
    },
  };
  localStorage.setItem('active_tenant', JSON.stringify(payload));
  window.location.href = '/admin';
}
