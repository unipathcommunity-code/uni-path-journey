/**
 * MeshBackground — animated gradient-mesh backdrop for the glassmorphism shell.
 * Tints itself from the active theme (`--primary` / `--primary-glow`), so the
 * theme-color picker re-colours it automatically. Sits behind everything.
 */
export function MeshBackground({ dark = false }: { dark?: boolean }) {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className={`absolute inset-0 ${dark ? 'bg-[#050508]' : 'bg-[hsl(240,44%,96%)]'}`} />
      <div className="up-mesh up-mesh-1" />
      <div className="up-mesh up-mesh-2" />
      <div className="up-mesh up-mesh-3" />
      <style>{`
        .up-mesh { position: absolute; border-radius: 9999px; filter: blur(90px); opacity: ${dark ? 0.32 : 0.48}; }
        .up-mesh-1 { width: 46vw; height: 46vw; left: -10vw; top: -12vw;
          background: radial-gradient(circle, hsl(var(--primary) / 0.9), transparent 68%); animation: upDrift1 28s ease-in-out infinite; }
        .up-mesh-2 { width: 38vw; height: 38vw; right: -6vw; top: 2vw;
          background: radial-gradient(circle, hsl(var(--primary-glow, var(--primary)) / 0.8), transparent 68%); animation: upDrift2 32s ease-in-out infinite; }
        .up-mesh-3 { width: 42vw; height: 42vw; left: 28vw; bottom: -18vw;
          background: radial-gradient(circle, hsl(var(--primary) / 0.7), transparent 68%); animation: upDrift3 36s ease-in-out infinite; }
        @keyframes upDrift1 { 50% { transform: translate(10vw, 9vh) scale(1.12); } }
        @keyframes upDrift2 { 50% { transform: translate(-9vw, 11vh) scale(1.08); } }
        @keyframes upDrift3 { 50% { transform: translate(7vw, -8vh) scale(1.14); } }
        @media (prefers-reduced-motion: reduce) { .up-mesh { animation: none !important; } }
      `}</style>
    </div>
  );
}
