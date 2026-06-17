import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Charge {
  id: string;
  amount: number;
  currency: string;
  subject?: string;
  student_name?: string;
}

interface Props {
  charge: Charge | null;
  onClose: () => void;
  onDone?: () => void;
}

/** Admin/Accountant: charge'ni waive yoki adjust qilish (sabab + audit). */
const AdjustChargeModal = ({ charge, onClose, onDone }: Props) => {
  const [action, setAction] = useState<"waive" | "adjust">("adjust");
  const [newAmount, setNewAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (!charge) return null;

  const submit = async () => {
    if (reason.trim().length < 3) { toast.error("Sabab kiritilishi shart (min 3 belgi)"); return; }
    if (action === "adjust" && (!newAmount || Number(newAmount) < 0)) { toast.error("Yangi summa noto'g'ri"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("adjust_student_charge", {
      _charge_id: charge.id,
      _action: action,
      _new_amount: action === "adjust" ? Number(newAmount) : null,
      _reason: reason.trim(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(action === "waive" ? "Qarz bekor qilindi" : "Qarz o'zgartirildi");
    onDone?.();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-2xl p-5 w-full max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-warning" /></div>
              <h3 className="font-semibold">Qarzni o'zgartirish</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted/50"><X className="w-4 h-4" /></button>
          </div>

          <div className="glass p-2.5 rounded-lg text-xs">
            <p><b>{charge.student_name || "Talaba"}</b> · {charge.subject || "Fan"}</p>
            <p className="text-muted-foreground">Joriy summa: <b>{Number(charge.amount).toLocaleString()} {charge.currency}</b></p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setAction("adjust")}
              className={`glass px-3 py-2 rounded-lg text-xs ${action === "adjust" ? "bg-primary/15 text-primary" : ""}`}>
              ✏️ Summa o'zgartirish
            </button>
            <button onClick={() => setAction("waive")}
              className={`glass px-3 py-2 rounded-lg text-xs ${action === "waive" ? "bg-destructive/15 text-destructive" : ""}`}>
              ❌ Bekor qilish
            </button>
          </div>

          {action === "adjust" && (
            <div>
              <label className="text-[11px] text-muted-foreground">Yangi summa ({charge.currency})</label>
              <input type="number" min={0} value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                placeholder={String(charge.amount)} className="w-full glass px-3 py-2 rounded-lg text-sm bg-background mt-1" />
            </div>
          )}

          <div>
            <label className="text-[11px] text-muted-foreground">Sabab (audit log uchun) *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Masalan: To'lov chegirmasi, hujjat asosida bekor qilindi…"
              className="w-full glass px-3 py-2 rounded-lg text-sm bg-background mt-1 resize-none" />
          </div>

          <button onClick={submit} disabled={busy}
            className="w-full glass px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary/15 text-primary disabled:opacity-50">
            {busy ? "Saqlanmoqda…" : "Tasdiqlash"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdjustChargeModal;
