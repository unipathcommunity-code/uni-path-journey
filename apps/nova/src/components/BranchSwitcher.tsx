import { useState, useRef, useEffect } from "react";
import { Building2, Check, ChevronDown, MapPin } from "lucide-react";
import { useBranch } from "@/hooks/useBranch";
import { motion, AnimatePresence } from "framer-motion";

/**
 * BranchSwitcher
 * Compact dropdown shown in DashboardHeader for users that have access to
 * more than one branch. Persisted via useBranch (localStorage).
 */
const BranchSwitcher = () => {
  const { branches, activeBranch, setActiveBranchId } = useBranch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (branches.length <= 1) return null; // nothing to switch

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass px-2.5 py-2 rounded-xl border border-warning/40 hover:bg-warning/10 transition flex items-center gap-1.5 max-w-[160px] sm:max-w-[220px]"
        title="Filialni almashtirish"
      >
        <Building2 className="w-4 h-4 text-warning flex-shrink-0" />
        <span className="text-xs sm:text-sm font-semibold truncate">
          {activeBranch?.name || "Filial"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-2 w-64 glass-strong rounded-xl border border-border shadow-xl z-50 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-border/60">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
                FILIAL TANLASH
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {branches.map((b) => {
                const isActive = activeBranch?.id === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBranchId(b.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2 transition hover:bg-warning/10 ${
                      isActive ? "bg-warning/15" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate">{b.name}</span>
                        {b.is_main && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-warning/20 text-warning font-bold">
                            MAIN
                          </span>
                        )}
                      </div>
                      {b.city && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {b.city}
                        </p>
                      )}
                    </div>
                    {isActive && <Check className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BranchSwitcher;
