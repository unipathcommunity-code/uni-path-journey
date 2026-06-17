import type { CSSProperties } from "react"

/* ---------------- Isometric cube primitive ---------------- */
type CubeProps = {
  cx: number
  cy: number
  s: number // half-diagonal (footprint)
  h: number // height
  top?: string
  left?: string
  right?: string
  className?: string
  style?: CSSProperties
}

function IsoCube({
  cx,
  cy,
  s,
  h,
  top = "var(--c-top)",
  left = "var(--c-left)",
  right = "var(--c-right)",
  className,
  style,
}: CubeProps) {
  // top face rhombus points
  const t = `${cx},${cy - s / 2}`
  const r = `${cx + s},${cy}`
  const b = `${cx},${cy + s / 2}`
  const l = `${cx - s},${cy}`
  return (
    <g className={className} style={style}>
      {/* left/front face */}
      <polygon points={`${l} ${b} ${cx},${cy + s / 2 + h} ${cx - s},${cy + h}`} fill={left} />
      {/* right/front face */}
      <polygon points={`${b} ${r} ${cx + s},${cy + h} ${cx},${cy + s / 2 + h}`} fill={right} />
      {/* top face */}
      <polygon points={`${t} ${r} ${b} ${l}`} fill={top} />
    </g>
  )
}

const palette = {
  white: { top: "#ffffff", left: "#eef1ee", right: "#e2e7e2" },
  lime: { top: "#b7f24a", left: "#86d61f", right: "#6cb40f" },
  mint: { top: "#d7f7b0", left: "#aee860", right: "#93d63f" },
}

/* ---------------- Hero scene ---------------- */
export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`iso-scene ${className}`}>
      <svg viewBox="0 0 460 420" className="h-auto w-full overflow-visible" role="img" aria-label="UniPath isometric workspace illustration">
        {/* base platform */}
        <g className="anim-float-soft">
          <IsoCube cx={230} cy={250} s={150} h={22} {...palette.white} />
        </g>

        {/* central lime cube */}
        <g className="anim-float" style={{ transformOrigin: "230px 150px" }}>
          <IsoCube cx={230} cy={150} s={56} h={64} {...palette.lime} />
        </g>

        {/* small cubes */}
        <g className="anim-float-soft" style={{ animationDelay: "0.6s" }}>
          <IsoCube cx={120} cy={200} s={30} h={34} {...palette.mint} />
        </g>
        <g className="anim-float" style={{ animationDelay: "1.1s" }}>
          <IsoCube cx={340} cy={210} s={26} h={28} {...palette.white} />
        </g>
        <g className="anim-float-soft" style={{ animationDelay: "0.3s" }}>
          <IsoCube cx={300} cy={300} s={22} h={20} {...palette.lime} />
        </g>

        {/* floating card with bars */}
        <g className="anim-float" style={{ animationDelay: "0.9s" }}>
          <g transform="translate(70 70) skewY(26.57)">
            <rect x="0" y="0" width="120" height="78" rx="10" fill="#ffffff" stroke="#e2e7e2" />
            <rect x="14" y="50" width="14" height="18" rx="3" fill="#cfe9a6" />
            <rect x="36" y="38" width="14" height="30" rx="3" fill="#aee860" />
            <rect x="58" y="26" width="14" height="42" rx="3" fill="#86d61f" />
            <rect x="80" y="44" width="14" height="24" rx="3" fill="#cfe9a6" />
            <rect x="14" y="14" width="56" height="8" rx="4" fill="#eef1ee" />
          </g>
        </g>

        {/* floating card with lines (doc) */}
        <g className="anim-float-soft" style={{ animationDelay: "1.4s" }}>
          <g transform="translate(300 90) skewY(-26.57)">
            <rect x="0" y="0" width="96" height="68" rx="10" fill="#ffffff" stroke="#e2e7e2" />
            <circle cx="18" cy="20" r="7" fill="#aee860" />
            <rect x="32" y="15" width="48" height="6" rx="3" fill="#eef1ee" />
            <rect x="14" y="38" width="68" height="5" rx="2.5" fill="#eef1ee" />
            <rect x="14" y="50" width="50" height="5" rx="2.5" fill="#eef1ee" />
          </g>
        </g>
      </svg>
    </div>
  )
}

/* ---------------- Assistant / robot scene ---------------- */
export function AssistantIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 360 280" className="h-auto w-full overflow-visible" role="img" aria-label="UniPath assistant illustration">
        {/* pulsing rings */}
        <circle cx="180" cy="120" r="50" fill="none" stroke="#aee860" strokeWidth="2" style={{ transformOrigin: "180px 120px", animation: "up-pulse-ring 3s ease-out infinite" }} />
        <circle cx="180" cy="120" r="50" fill="none" stroke="#aee860" strokeWidth="2" style={{ transformOrigin: "180px 120px", animation: "up-pulse-ring 3s ease-out infinite 1.5s" }} />

        {/* pedestal */}
        <g className="anim-float-soft">
          <IsoCube cx={180} cy={210} s={92} h={20} {...palette.white} />
          <IsoCube cx={180} cy={188} s={54} h={16} {...palette.mint} />
        </g>

        {/* sphere */}
        <g className="anim-float" style={{ transformOrigin: "180px 120px" }}>
          <ellipse cx="180" cy="172" rx="46" ry="14" fill="#86d61f" opacity="0.25" />
          <circle cx="180" cy="118" r="46" fill="#9ade2e" />
          <circle cx="180" cy="118" r="46" fill="url(#sphereShade)" />
          <ellipse cx="166" cy="100" rx="16" ry="11" fill="#c9f06f" opacity="0.7" />
          {/* face dots */}
          <circle cx="168" cy="116" r="5" fill="#2c4a14" />
          <circle cx="192" cy="116" r="5" fill="#2c4a14" />
          <path d="M168 132 q12 9 24 0" stroke="#2c4a14" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        {/* orbiting cards */}
        <g className="anim-float-soft" style={{ animationDelay: "0.8s" }}>
          <rect x="40" y="70" width="58" height="40" rx="8" fill="#ffffff" stroke="#e2e7e2" />
          <rect x="50" y="80" width="34" height="5" rx="2.5" fill="#eef1ee" />
          <rect x="50" y="92" width="24" height="5" rx="2.5" fill="#aee860" />
        </g>
        <g className="anim-float" style={{ animationDelay: "1.2s" }}>
          <rect x="262" y="60" width="58" height="40" rx="8" fill="#ffffff" stroke="#e2e7e2" />
          <circle cx="278" cy="80" r="9" fill="#aee860" />
          <rect x="294" y="76" width="20" height="5" rx="2.5" fill="#eef1ee" />
          <rect x="294" y="86" width="14" height="5" rx="2.5" fill="#eef1ee" />
        </g>

        <defs>
          <radialGradient id="sphereShade" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#9ade2e" stopOpacity="0" />
            <stop offset="100%" stopColor="#5c9e0c" stopOpacity="0.55" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}

/* ---------------- Network / connected scene ---------------- */
export function NetworkIllustration({ className = "" }: { className?: string }) {
  const nodes = [
    { cx: 140, cy: 250, s: 34, h: 30, ...palette.white },
    { cx: 300, cy: 250, s: 34, h: 30, ...palette.white },
    { cx: 460, cy: 250, s: 34, h: 30, ...palette.white },
    { cx: 620, cy: 250, s: 34, h: 30, ...palette.white },
  ]
  return (
    <div className={`iso-scene ${className}`}>
      <svg viewBox="0 0 760 360" className="h-auto w-full overflow-visible" role="img" aria-label="UniPath connected platform illustration">
        {/* base */}
        <g className="anim-float-soft">
          <IsoCube cx={380} cy={250} s={300} h={16} {...palette.white} />
        </g>

        {/* connection paths */}
        <g fill="none" stroke="#aee860" strokeWidth="3" strokeLinecap="round">
          <path className="anim-dash" d="M140 250 L300 250" />
          <path className="anim-dash" style={{ animationDelay: "0.3s" }} d="M300 250 L460 250" />
          <path className="anim-dash" style={{ animationDelay: "0.6s" }} d="M460 250 L620 250" />
          <path className="anim-dash" style={{ animationDelay: "0.45s" }} d="M380 150 L300 250" />
          <path className="anim-dash" style={{ animationDelay: "0.75s" }} d="M380 150 L460 250" />
        </g>

        {/* node pillars */}
        {nodes.map((n, i) => (
          <g key={i} className="anim-float" style={{ animationDelay: `${i * 0.35}s` }}>
            <IsoCube {...n} />
            <circle cx={n.cx} cy={n.cy - 18} r="6" fill="#86d61f" />
          </g>
        ))}

        {/* central hub cube */}
        <g className="anim-float" style={{ transformOrigin: "380px 110px" }}>
          <IsoCube cx={380} cy={110} s={56} h={60} {...palette.lime} />
        </g>

        {/* floating panel */}
        <g className="anim-float-soft" style={{ animationDelay: "1s" }}>
          <g transform="translate(560 70) skewY(-26.57)">
            <rect x="0" y="0" width="110" height="74" rx="10" fill="#ffffff" stroke="#e2e7e2" />
            <rect x="14" y="48" width="14" height="18" rx="3" fill="#cfe9a6" />
            <rect x="34" y="34" width="14" height="32" rx="3" fill="#aee860" />
            <rect x="54" y="42" width="14" height="24" rx="3" fill="#86d61f" />
            <rect x="14" y="16" width="50" height="7" rx="3.5" fill="#eef1ee" />
          </g>
        </g>
      </svg>
    </div>
  )
}
