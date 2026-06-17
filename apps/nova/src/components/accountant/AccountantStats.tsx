import { motion } from "framer-motion";
import { TrendingUp, Clock, Receipt, Wallet } from "lucide-react";

interface Props {
  totalRevenue: number;
  pending: number;
  overdue: number;
  totalSalaries: number;
}

const AccountantStats = ({ totalRevenue, pending, overdue, totalSalaries }: Props) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 rounded-xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="w-3 h-3" /> Daromad</div>
      <div className="text-2xl font-bold font-heading text-success">{totalRevenue.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">UZS</div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass p-4 rounded-xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> Kutilmoqda</div>
      <div className="text-2xl font-bold font-heading text-warning">{pending.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">UZS</div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-4 rounded-xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Receipt className="w-3 h-3" /> Muddati o'tgan</div>
      <div className="text-2xl font-bold font-heading text-destructive">{overdue}</div>
      <div className="text-xs text-muted-foreground">ta hisob</div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass p-4 rounded-xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="w-3 h-3" /> Maosh fond (oy)</div>
      <div className="text-2xl font-bold font-heading">{totalSalaries.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">UZS</div>
    </motion.div>
  </div>
);

export default AccountantStats;
