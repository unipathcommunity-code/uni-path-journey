import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FnStatus = "ok" | "degraded" | "down";

interface FnResult {
  name: string;
  status: FnStatus;
  http_status: number;
  latency_ms: number;
  error?: string;
}

interface HealthResponse {
  checked_at: string;
  overall: FnStatus | "healthy";
  functions: FnResult[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const statusMeta: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  ok: { color: "text-emerald-500", icon: CheckCircle2, label: "OK" },
  healthy: { color: "text-emerald-500", icon: CheckCircle2, label: "Healthy" },
  degraded: { color: "text-amber-500", icon: AlertTriangle, label: "Degraded" },
  down: { color: "text-rose-500", icon: XCircle, label: "Down" },
};

export default function EdgeHealthPanel() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/edge-health`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: ANON,
          Authorization: `Bearer ${ANON}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as HealthResponse;
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
    const i = setInterval(run, 60_000);
    return () => clearInterval(i);
  }, [run]);

  const overall = data?.overall ?? "healthy";
  const meta = statusMeta[overall] ?? statusMeta.healthy;
  const OverallIcon = meta.icon;

  return (
    <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Edge Function Health</h3>
            <p className="text-xs text-muted-foreground">
              {data?.checked_at
                ? `Last check: ${new Date(data.checked_at).toLocaleTimeString()}`
                : "Pinging…"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`gap-1 ${meta.color}`}>
            <OverallIcon className="w-3 h-3" />
            {meta.label}
          </Badge>
          <Button size="sm" variant="outline" onClick={run} disabled={loading}>
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-rose-500 mb-3">Health endpoint error: {error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <AnimatePresence mode="popLayout">
          {(data?.functions ?? []).map((f, idx) => {
            const m = statusMeta[f.status] ?? statusMeta.down;
            const Icon = m.icon;
            return (
              <motion.div
                key={f.name}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.02 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${m.color}`} />
                  <span className="text-sm font-mono truncate">{f.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{f.latency_ms}ms</span>
                  <Badge variant="secondary" className="text-xs">
                    {f.http_status || "—"}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!data && loading && (
          <div className="col-span-full flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Checking edge runtime…
          </div>
        )}
      </div>
    </Card>
  );
}
