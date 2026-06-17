import { Wallet } from "lucide-react";
import { STATUS_COLORS } from "./InvoicesSection";

interface Salary {
  id: string;
  staff_user_id: string;
  period_month: string;
  base_amount: number;
  bonus_amount: number;
  deductions: number;
  status: string;
  paid_at: string | null;
}

const SalariesSection = ({ salaries }: { salaries: Salary[] }) => (
  <div className="glass rounded-xl overflow-hidden">
    {salaries.length === 0 ? (
      <div className="p-8 text-center"><Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">Maoshlar hali kiritilmagan</p></div>
    ) : (
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr><th className="text-left p-3">Xodim</th><th className="text-left p-3">Davr</th><th className="text-right p-3">Asosiy</th><th className="text-right p-3">Bonus</th><th className="text-right p-3">Ushlanma</th><th className="text-right p-3">Jami</th><th className="text-center p-3">Status</th></tr>
        </thead>
        <tbody>
          {salaries.map((s) => (
            <tr key={s.id} className="border-t border-border/50">
              <td className="p-3 font-mono text-xs">{s.staff_user_id.slice(0, 8)}…</td>
              <td className="p-3">{new Date(s.period_month).toLocaleDateString('uz', { year: 'numeric', month: 'long' })}</td>
              <td className="p-3 text-right">{Number(s.base_amount).toLocaleString()}</td>
              <td className="p-3 text-right text-success">+{Number(s.bonus_amount).toLocaleString()}</td>
              <td className="p-3 text-right text-destructive">-{Number(s.deductions).toLocaleString()}</td>
              <td className="p-3 text-right font-semibold">{(Number(s.base_amount) + Number(s.bonus_amount) - Number(s.deductions)).toLocaleString()}</td>
              <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[s.status]}`}>{s.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default SalariesSection;
export type { Salary };
