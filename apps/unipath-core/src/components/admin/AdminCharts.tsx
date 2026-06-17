import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

interface AdminChartsProps {
  payments: any[];
  attendance: any[];
  roles: any[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

const AdminCharts = ({ payments, attendance, roles }: AdminChartsProps) => {
  const { t } = useLanguage();

  // Monthly revenue data
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueData = months.map((month, i) => {
    const monthPayments = payments.filter((p) => {
      const d = new Date(p.created_at);
      return d.getMonth() === i;
    });
    const paid = monthPayments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount), 0);
    const pending = monthPayments.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);
    return { month, paid: paid / 1000, pending: pending / 1000 };
  });

  // Weekly attendance data
  const days = [
    t("admin.chart_mon"), t("admin.chart_tue"), t("admin.chart_wed"),
    t("admin.chart_thu"), t("admin.chart_fri"), t("admin.chart_sat")
  ];
  const attendanceData = days.map((day, i) => {
    const dayRecords = attendance.filter((a) => {
      const d = new Date(a.created_at);
      return d.getDay() === (i + 1);
    });
    const present = dayRecords.filter((a: any) => a.status === "present").length;
    const absent = dayRecords.filter((a: any) => a.status === "absent").length;
    const late = dayRecords.filter((a: any) => a.status === "late").length;
    return { day, present, absent, late };
  });

  // Role distribution
  const roleData = [
    { name: t("admin.students"), value: roles.filter((r: any) => r.role === "student").length },
    { name: t("admin.teachers"), value: roles.filter((r: any) => r.role === "teacher").length },
    { name: t("nav.parent"), value: roles.filter((r: any) => r.role === "parent").length },
    { name: "Admin", value: roles.filter((r: any) => r.role === "admin").length },
  ].filter(d => d.value > 0);

  const totalRevenue = payments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalDebt = payments.filter((p: any) => p.status !== "paid").reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-strong p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("admin.chart_revenue")}</h3>
            <p className="text-[10px] text-muted-foreground">{t("admin.chart_monthly")}</p>
          </div>
        </div>
        <div className="flex gap-4 mb-3 mt-2">
          <div className="text-center">
            <p className="text-lg font-bold text-success">{(totalRevenue / 1000000).toFixed(1)}M</p>
            <p className="text-[10px] text-muted-foreground">{t("admin.chart_collected")}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-destructive">{(totalDebt / 1000000).toFixed(1)}M</p>
            <p className="text-[10px] text-muted-foreground">{t("admin.chart_outstanding")}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
            <Area type="monotone" dataKey="paid" stroke="hsl(var(--success))" fill="url(#colorPaid)" strokeWidth={2} />
            <Area type="monotone" dataKey="pending" stroke="hsl(var(--warning))" fill="url(#colorPending)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Attendance Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="glass-strong p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("admin.chart_attendance")}</h3>
            <p className="text-[10px] text-muted-foreground">{t("admin.chart_weekly")}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
            <Bar dataKey="present" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="late" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Role Distribution — compact, no overlapping labels */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-strong p-5 lg:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">{t("admin.chart_distribution")}</h3>
            <p className="text-[10px] text-muted-foreground">{t("admin.chart_by_role")}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{roleData.reduce((s, d) => s + d.value, 0)}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Jami</div>
          </div>
        </div>
        {roleData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Ma'lumot yo'q</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {roleData.map((d, i) => {
                const total = roleData.reduce((s, r) => s + r.value, 0);
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 truncate">{d.name}</span>
                    <span className="font-semibold tabular-nums">{d.value}</span>
                    <span className="text-muted-foreground tabular-nums w-9 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminCharts;
