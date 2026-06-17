import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { LineChart as LineIcon, TrendingUp, Activity, AlertTriangle } from "lucide-react";

interface Props {
  branchId: string;
  branchName: string;
  staffCount: number;
}

/**
 * Deterministic pseudo-random series derived from a string seed (branch id).
 * No backend call — fast, predictable per-branch demo of AI insights.
 */
const seededSeries = (seed: string, len: number, base: number, variance: number) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const out: { i: string; v: number }[] = [];
  let v = base;
  for (let i = 0; i < len; i++) {
    h = (h * 1664525 + 1013904223) | 0;
    const n = ((h >>> 0) % 1000) / 1000; // 0..1
    v = Math.max(0, v + (n - 0.5) * variance);
    out.push({ i: `M${i + 1}`, v: Math.round(v) });
  }
  return out;
};

const BranchInsights = ({ branchId, branchName, staffCount }: Props) => {
  // Revenue forecast: 6 historic months + 3 forecast months (in millions UZS)
  const revenue = seededSeries(branchId + "rev", 9, 18, 7);
  const lastReal = revenue[5].v;
  const lastForecast = revenue[8].v;
  const growthPct = lastReal === 0 ? 0 : Math.round(((lastForecast - lastReal) / lastReal) * 100);

  // Staff burnout (0..100 — higher = more burnout risk)
  const burnoutBase = Math.min(85, 35 + staffCount * 4);
  const burnout = seededSeries(branchId + "burn", 8, burnoutBase, 12).map((p) => ({
    ...p,
    v: Math.min(100, Math.max(5, p.v)),
  }));
  const burnoutNow = burnout[burnout.length - 1].v;
  const burnoutLevel: "low" | "medium" | "high" =
    burnoutNow < 40 ? "low" : burnoutNow < 65 ? "medium" : "high";

  const burnoutColor =
    burnoutLevel === "low" ? "success" : burnoutLevel === "medium" ? "warning" : "destructive";
  const burnoutLabel =
    burnoutLevel === "low" ? "Past" : burnoutLevel === "medium" ? "O'rtacha" : "Yuqori";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 pt-3 border-t border-border/60 space-y-3"
    >
      {/* Revenue forecast */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <LineIcon className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
              AI · DAROMAD BASHORATI
            </span>
          </div>
          <div
            className={`text-[10px] font-bold flex items-center gap-0.5 ${
              growthPct >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            <TrendingUp className={`w-3 h-3 ${growthPct < 0 ? "rotate-180" : ""}`} />
            {growthPct >= 0 ? "+" : ""}
            {growthPct}%
          </div>
        </div>
        <div className="h-14 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenue} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id={`rev-${branchId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="i" hide />
              <Tooltip
                cursor={{ stroke: "hsl(var(--accent))", strokeOpacity: 0.3 }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                  padding: "4px 8px",
                }}
                formatter={(v: any) => [`${v}M UZS`, "Daromad"]}
                labelFormatter={() => ""}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke="hsl(var(--accent))"
                strokeWidth={1.8}
                fill={`url(#rev-${branchId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>6 oy oldin</span>
          <span className="text-accent font-semibold">3 oy bashorat</span>
        </div>
      </div>

      {/* Staff burnout */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-warning" />
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
              XODIMLAR HOLATI
            </span>
          </div>
          <div
            className={`text-[10px] font-bold flex items-center gap-1 text-${burnoutColor}`}
          >
            {burnoutLevel === "high" && <AlertTriangle className="w-3 h-3" />}
            {burnoutLabel} · {burnoutNow}
          </div>
        </div>
        <div className="h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={burnout} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id={`burn-${branchId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`hsl(var(--${burnoutColor}))`} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={`hsl(var(--${burnoutColor}))`} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="i" hide />
              <Tooltip
                cursor={{ stroke: `hsl(var(--${burnoutColor}))`, strokeOpacity: 0.3 }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                  padding: "4px 8px",
                }}
                formatter={(v: any) => [`${v}/100`, "Charchoq"]}
                labelFormatter={() => ""}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={`hsl(var(--${burnoutColor}))`}
                strokeWidth={1.8}
                fill={`url(#burn-${branchId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default BranchInsights;
