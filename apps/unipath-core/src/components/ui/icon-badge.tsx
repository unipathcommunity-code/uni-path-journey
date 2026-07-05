import * as React from 'react';
import { cn } from '@/lib/utils';

// ─── Soft-3D gradient icon badge ─────────────────────────────────────────────
// A glossy, depth-styled container for a lucide icon. Modern "soft 3D" look that
// works in both light and dark themes (white glyph on a coloured gradient).
// Usage: <IconBadge tone="emerald" icon={<Wallet />} />

export type IconTone =
  | 'primary' | 'emerald' | 'amber' | 'rose' | 'blue'
  | 'purple' | 'sky' | 'pink' | 'indigo' | 'slate' | 'orange' | 'teal';

const TONES: Record<IconTone, string> = {
  primary: 'from-primary/70 to-primary shadow-primary/40',
  emerald: 'from-emerald-400 to-emerald-600 shadow-emerald-500/40',
  amber:   'from-amber-400 to-amber-500 shadow-amber-500/40',
  rose:    'from-rose-400 to-rose-600 shadow-rose-500/40',
  blue:    'from-blue-400 to-blue-600 shadow-blue-500/40',
  purple:  'from-purple-400 to-purple-600 shadow-purple-500/40',
  sky:     'from-sky-400 to-sky-600 shadow-sky-500/40',
  pink:    'from-pink-400 to-pink-600 shadow-pink-500/40',
  indigo:  'from-indigo-400 to-indigo-600 shadow-indigo-500/40',
  slate:   'from-slate-500 to-slate-700 shadow-slate-500/40',
  orange:  'from-orange-400 to-orange-600 shadow-orange-500/40',
  teal:    'from-teal-400 to-teal-600 shadow-teal-500/40',
};

const SIZES = {
  sm: 'w-9 h-9 rounded-xl [&_svg]:w-4 [&_svg]:h-4',
  md: 'w-11 h-11 rounded-2xl [&_svg]:w-5 [&_svg]:h-5',
  lg: 'w-14 h-14 rounded-2xl [&_svg]:w-7 [&_svg]:h-7',
};

export interface IconBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  tone?: IconTone;
  size?: keyof typeof SIZES;
}

export function IconBadge({ icon, tone = 'primary', size = 'md', className, ...props }: IconBadgeProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center text-white',
        'bg-gradient-to-br shadow-lg ring-1 ring-white/25 overflow-hidden',
        'transition-transform duration-200 hover:scale-[1.06] active:scale-95',
        // top gloss highlight
        "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/40 before:to-transparent before:opacity-70",
        // bottom inner shade for depth
        "after:absolute after:inset-x-0 after:bottom-0 after:h-1/3 after:bg-black/10",
        SIZES[size],
        TONES[tone],
        className,
      )}
      {...props}
    >
      <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">{icon}</span>
    </div>
  );
}
