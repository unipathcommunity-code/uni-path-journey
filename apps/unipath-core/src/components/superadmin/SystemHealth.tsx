import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Activity, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type State = "checking" | "ok" | "fail";

interface Check {
  key: string;
  label: string;
  state: State;
  detail?: string;
}

const INITIAL: Check[] = [
  { key: "db", label: "Ma'lumotlar bazasi (Supabase)", state: "checking" },
  { key: "auth", label: "Autentifikatsiya / sessiya", state: "checking" },
  { key: "fn_create", label: "Edge fn: admin-create-user", state: "checking" },
  { key: "fn_verify", label: "Edge fn: verify-domain", state: "checking" },
];

/**
 * SystemHealth — honest, real status of the platform's moving parts. Each row is
 * a live probe (no fakery): green = ishlaydi, red = ishlamaydi. Edge functions
 * are detected as deployed when they respond (even with a validation error);
 * a network/fetch failure means they are not deployed yet.
 */
export function SystemHealth() {
  const [checks, setChecks] = useState<Check[]>(INITIAL);
  const [running, setRunning] = useState(false);

  const set = (key: string, state: State, detail?: string) =>
    setChecks((prev) => prev.map((c) => (c.key === key ? { ...c, state, detail } : c)));

  const probeFunction = async (name: string, key: string) => {
    try {
      const { error } = await supabase.functions.invoke(name, { body: {} });
      // A deployed function that ran returns a validation HTTP error → still "up".
      if (!error || error.name === "FunctionsHttpError") {
        set(key, "ok", "Javob bermoqda");
      } else {
        set(key, "fail", "Deploy qilinmagan");
      }
    } catch {
      set(key, "fail", "Erishib bo'lmadi");
    }
  };

  const runChecks = async () => {
    setRunning(true);
    setChecks(INITIAL);

    // 1. DB
    try {
      const { error } = await supabase.from("tenants").select("id", { count: "exact", head: true });
      set("db", error ? "fail" : "ok", error ? error.message : "Ulangan");
    } catch (e: any) {
      set("db", "fail", e?.message);
    }

    // 2. Auth session
    try {
      const { data } = await supabase.auth.getSession();
      set("auth", data?.session ? "ok" : "fail", data?.session ? "Sessiya faol" : "Sessiya yo'q");
    } catch (e: any) {
      set("auth", "fail", e?.message);
    }

    // 3 + 4. Edge functions
    await Promise.all([
      probeFunction("admin-create-user", "fn_create"),
      probeFunction("verify-domain", "fn_verify"),
    ]);

    setRunning(false);
  };

  useEffect(() => { runChecks(); /* eslint-disable-next-line */ }, []);

  const allOk = checks.every((c) => c.state === "ok");
  const anyFail = checks.some((c) => c.state === "fail");

  return (
    <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${anyFail ? "text-rose-500" : allOk ? "text-emerald-500" : "text-amber-500"}`} />
          <h3 className="text-sm font-bold text-white">Tizim holati</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            anyFail ? "bg-rose-500/10 text-rose-400" : allOk ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
          }`}>
            {anyFail ? "Muammo bor" : allOk ? "Hammasi ishlaydi" : "Tekshirilmoqda"}
          </span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-white/50 hover:text-white" onClick={runChecks} disabled={running}>
          <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {checks.map((c) => (
          <div key={c.key} className="flex items-center gap-2 px-3 py-2 bg-black/20 rounded-xl">
            {c.state === "checking" ? <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
              : c.state === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              : <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">{c.label}</p>
              {c.detail && <p className="text-[10px] text-white/40 truncate">{c.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
