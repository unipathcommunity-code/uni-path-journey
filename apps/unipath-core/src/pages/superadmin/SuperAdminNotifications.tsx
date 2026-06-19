import { useState, useEffect } from "react";
import {
  Send,
  Info,
  Users,
  Search,
  MessageSquare,
  Megaphone,
  Hourglass,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdminStats, verticalLabel } from "@/hooks/useSuperAdminStats";

interface SentBroadcast {
  id: string;
  title: string;
  message: string;
  target: string;
  recipients: number;
  date: string;
}

const TARGET_ROLES: Record<string, string[] | null> = {
  all: null, // everyone
  admins: ["owner", "admin"],
  students: ["student", "user"],
};

const TARGET_LABELS: Record<string, string> = {
  all: "Barcha foydalanuvchilar",
  admins: "Firma egalari (Adminlar)",
  students: "Talabalar",
};

export default function SuperAdminNotifications() {
  const { toast } = useToast();
  const { data: stats } = useSuperAdminStats();

  const [searchQuery, setSearchQuery] = useState("");
  const [broadcasts, setBroadcasts] = useState<SentBroadcast[]>([]);
  const [supportCount, setSupportCount] = useState<number | null>(null);

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastType, setBroadcastType] = useState("info");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from("support_tickets").select("*", { count: "exact", head: true });
      setSupportCount(count ?? 0);
    })();
  }, []);

  // Real "system alerts" derived from actual platform state.
  const pendingTenants = (stats?.tenants || []).filter((t) => t.status === "pending");

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      toast({ title: "Xatolik", description: "Iltimos, barcha maydonlarni to'ldiring.", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      // Resolve target recipients from real profiles
      let query = supabase.from("profiles").select("user_id");
      const roles = TARGET_ROLES[broadcastTarget];
      if (roles) query = query.in("role", roles);
      const { data: targets, error: targetErr } = await query;
      if (targetErr) throw targetErr;

      const userIds = (targets || []).map((t: any) => t.user_id).filter(Boolean);
      if (userIds.length === 0) {
        toast({ title: "Qabul qiluvchi yo'q", description: "Tanlangan guruhda foydalanuvchi topilmadi.", variant: "destructive" });
        return;
      }

      const rows = userIds.map((uid) => ({
        user_id: uid,
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType,
        category: "broadcast",
      }));

      const { error: insertErr } = await supabase.from("notifications").insert(rows);
      if (insertErr) throw insertErr;

      setBroadcasts((prev) => [
        {
          id: `b-${Date.now()}`,
          title: broadcastTitle,
          message: broadcastMessage,
          target: TARGET_LABELS[broadcastTarget],
          recipients: userIds.length,
          date: new Date().toISOString().split("T")[0],
        },
        ...prev,
      ]);

      setBroadcastTitle("");
      setBroadcastMessage("");
      toast({
        title: "E'lon yuborildi!",
        description: `${userIds.length} ta foydalanuvchiga bildirishnoma jo'natildi.`,
      });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "Yuborishda xatolik.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const filteredBroadcasts = broadcasts.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.message.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const statCards = [
    { label: "Tasdiq kutayotgan firmalar", value: pendingTenants.length, sub: "Ko'rib chiqish kerak", icon: Hourglass, color: "text-amber-500" },
    { label: "Bu sessiyada yuborilgan", value: broadcasts.length, sub: "E'lonlar (broadcast)", icon: Send, color: "text-emerald-500" },
    { label: "Faol foydalanuvchilar", value: stats?.totals.users ?? 0, sub: "Jami auditoriya", icon: Users, color: "text-blue-400" },
    { label: "Yordam so'rovlari", value: supportCount ?? "—", sub: "Support tickets", icon: MessageSquare, color: "text-purple-500" },
  ];

  return (
    <div className="text-foreground font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bildirishnomalar</h1>
        <p className="text-white/50 mt-1 text-sm">
          Platforma holatini kuzatish va foydalanuvchilarga real bildirishnomalar yuborish
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-muted/10 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{s.value}</div>
              <p className="text-xs text-white/40 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Broadcast form + history */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Yangi e'lon yuborish (Broadcast)
              </CardTitle>
              <CardDescription className="text-xs text-white/50">
                Tanlangan guruhdagi har bir foydalanuvchiga real bildirishnoma yoziladi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/70 font-semibold">Mavzu / Sarlavha</label>
                  <Input
                    placeholder="Masalan: Tizim yangilanishi..."
                    className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70 font-semibold">Kimlarga (Target)</label>
                    <select
                      className="w-full bg-black/50 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value)}
                    >
                      <option value="all">Barcha foydalanuvchilar</option>
                      <option value="admins">Firma egalari (Adminlar)</option>
                      <option value="students">Talabalar</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70 font-semibold">Bildirishnoma turi</label>
                    <select
                      className="w-full bg-black/50 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value)}
                    >
                      <option value="info">Ma'lumot (Info)</option>
                      <option value="warning">Ogohlantirish (Warning)</option>
                      <option value="success">Muvaffaqiyat (Success)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/70 font-semibold">Xabar matni</label>
                  <Textarea
                    placeholder="E'lon matnini bu yerga yozing..."
                    rows={4}
                    className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500 resize-none"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2 transition-all"
                  disabled={isSending}
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSending ? "Yuborilmoqda..." : "E'lonni tarqatish"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-muted/5 border-white/5 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Yuborilgan e'lonlar (joriy sessiya)</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="E'lonlarni izlash..."
                  className="pl-8 bg-black/50 border-white/10 text-white placeholder:text-gray-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4">E'lon</th>
                    <th className="p-4">Target</th>
                    <th className="p-4">Qabul qiluvchilar</th>
                    <th className="p-4 text-right">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBroadcasts.map((b) => (
                    <tr key={b.id} className="text-sm text-white/80">
                      <td className="p-4 max-w-[280px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{b.title}</span>
                          <span className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.message}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-amber-500">{b.target}</td>
                      <td className="p-4 text-xs text-white/70">{b.recipients} ta</td>
                      <td className="p-4 text-right text-xs text-muted-foreground">{b.date}</td>
                    </tr>
                  ))}
                  {filteredBroadcasts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-muted-foreground text-sm">
                        Bu sessiyada hali e'lon yuborilmagan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Real alerts feed */}
        <div className="lg:col-span-5">
          <Card className="bg-muted/5 border-white/5 h-full">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-lg">Diqqat talab qiladi</CardTitle>
              <CardDescription className="text-xs">Platformaning real holatidan kelib chiqqan ogohlantirishlar</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {pendingTenants.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p>Hozircha e'tibor talab qiladigan narsa yo'q.</p>
                </div>
              ) : (
                pendingTenants.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border bg-white/[0.02] border-white/10"
                  >
                    <div className="flex items-start gap-2.5">
                      <Hourglass className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-white">Yangi firma tasdiqlashni kutmoqda</p>
                        <p className="text-xs text-white/50 mt-1 leading-relaxed">
                          <span className="text-white/80">{t.name}</span> ({verticalLabel(t.vertical)}) ro'yxatdan o'tdi.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}

              {supportCount !== null && supportCount > 0 && (
                <div className="p-4 rounded-xl border bg-white/[0.02] border-white/10 flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-white">{supportCount} ta yordam so'rovi</p>
                    <p className="text-xs text-white/50 mt-1">Support tickets ko'rib chiqilmoqda.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
