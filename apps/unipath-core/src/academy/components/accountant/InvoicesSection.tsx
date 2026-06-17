import { useState } from "react";
import { Plus, FileText, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string;
  description: string | null;
  amount: number;
  currency: string;
  status: string;
  issued_at: string;
  due_date: string | null;
  paid_at: string | null;
  student_id: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/15 text-primary",
  paid: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  pending: "bg-warning/15 text-warning",
};

interface Props {
  invoices: Invoice[];
  userId?: string;
  reload: () => void;
}

const InvoicesSection = ({ invoices, userId, reload }: Props) => {
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [newInv, setNewInv] = useState({ invoice_number: "", description: "", amount: 0, due_date: "" });

  const createInvoice = async () => {
    if (!newInv.invoice_number || !newInv.amount) {
      toast.error("Raqam va summa kerak");
      return;
    }
    const { error } = await supabase.from("invoices").insert({
      invoice_number: newInv.invoice_number,
      description: newInv.description,
      amount: newInv.amount,
      due_date: newInv.due_date || null,
      created_by: userId,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Hisob-faktura yaratildi");
      setShowNewInvoice(false);
      setNewInv({ invoice_number: "", description: "", amount: 0, due_date: "" });
      reload();
    }
  };

  const markPaid = async (id: string) => {
    const { error } = await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("To'landi"); reload(); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setShowNewInvoice(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yangi hisob
        </button>
      </div>

      {showNewInvoice && (
        <div className="glass-strong p-4 rounded-xl space-y-3">
          <h3 className="font-heading font-bold">Yangi hisob-faktura</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Hisob raqami (INV-001)" value={newInv.invoice_number} onChange={(e) => setNewInv({ ...newInv, invoice_number: e.target.value })} className="px-3 py-2 rounded-lg bg-background border border-border text-sm" />
            <input type="number" placeholder="Summa (UZS)" value={newInv.amount || ''} onChange={(e) => setNewInv({ ...newInv, amount: Number(e.target.value) })} className="px-3 py-2 rounded-lg bg-background border border-border text-sm" />
          </div>
          <input placeholder="Tavsif" value={newInv.description} onChange={(e) => setNewInv({ ...newInv, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm" />
          <input type="date" value={newInv.due_date} onChange={(e) => setNewInv({ ...newInv, due_date: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm" />
          <div className="flex gap-2">
            <button onClick={createInvoice} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Yaratish</button>
            <button onClick={() => setShowNewInvoice(false)} className="px-4 py-2 rounded-lg bg-muted text-sm">Bekor</button>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="glass p-8 text-center rounded-xl">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Hozircha hisob-fakturalar yo'q</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr><th className="text-left p-3">№</th><th className="text-left p-3">Tavsif</th><th className="text-right p-3">Summa</th><th className="text-center p-3">Status</th><th className="text-center p-3">Sana</th><th></th></tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border/50">
                  <td className="p-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="p-3">{inv.description || '—'}</td>
                  <td className="p-3 text-right font-semibold">{Number(inv.amount).toLocaleString()} <span className="text-xs text-muted-foreground">{inv.currency}</span></td>
                  <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[inv.status]}`}>{inv.status}</span></td>
                  <td className="p-3 text-center text-xs text-muted-foreground">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                  <td className="p-3 text-right">
                    {inv.status !== "paid" && (
                      <button onClick={() => markPaid(inv.id)} className="text-xs px-2 py-1 rounded bg-success/20 text-success hover:bg-success/30">
                        <CheckCircle2 className="w-3 h-3 inline" /> To'landi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoicesSection;
export { STATUS_COLORS };
export type { Invoice };
