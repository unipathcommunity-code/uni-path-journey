import { Briefcase, Building2, LucideIcon } from 'lucide-react';

// Visual identity for the one vertical this platform serves, so every
// super-admin surface renders a tenant consistently.
export interface VerticalStyle {
  icon: LucideIcon;
  grad: string;   // card accent gradient (tailwind)
  text: string;   // accent text colour
  ring: string;   // border/ring colour
}

export const CONSULTING_STYLE: VerticalStyle = {
  icon: Briefcase,
  grad: 'from-blue-500/25 to-blue-500/5',
  text: 'text-blue-400',
  ring: 'border-blue-500/20',
};

export const verticalStyle = (v?: string | null): VerticalStyle =>
  v === 'consulting' || !v
    ? CONSULTING_STYLE
    : { icon: Building2, grad: 'from-white/10 to-transparent', text: 'text-white/60', ring: 'border-white/10' };

/** Impersonate a tenant from any super-admin surface (preserves branding/config). */
export function impersonateTenant(t: { config?: any } & Record<string, any>) {
  const payload = {
    ...t,
    business_type: 'consulting',
    config: {
      ...(t.config || {}),
      business_type: 'consulting',
      modules: { ...((t.config as any)?.modules || {}), consulting: true },
    },
  };
  localStorage.setItem('active_tenant', JSON.stringify(payload));
  window.location.href = '/admin';
}
