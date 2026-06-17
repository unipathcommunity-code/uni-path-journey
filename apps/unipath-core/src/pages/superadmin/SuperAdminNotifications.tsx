import { useState } from "react";
import { 
  Bell, 
  Send, 
  Trash2, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ShieldAlert,
  Users,
  Search,
  MessageSquare,
  Megaphone,
  ArrowUpRight,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Mock system notifications and broadcast history
const INITIAL_ALERTS = [
  {
    id: "a-1",
    type: "warning",
    title: "SSL Sertifikati muddati tugamoqda",
    message: "globaledu.unipath.me domenining SSL sertifikati 3 kundan keyin tugaydi. Avtomatik yangilanish kutilmoqda.",
    time: "2 soat oldin",
    read: false,
  },
  {
    id: "a-2",
    type: "danger",
    title: "Stripe Webhook Xatoligi",
    message: "Invoice payment failed webhook xabari tahlil qilinmadi (signature mismatch).",
    time: "5 soat oldin",
    read: false,
  },
  {
    id: "a-3",
    type: "info",
    title: "Yangi B2B So'rov",
    message: "EuroStudy Agency nomli yangi consulting firma platformadan ro'yxatdan o'tdi va tasdiqlashni kutmoqda.",
    time: "1 kun oldin",
    read: true,
  },
  {
    id: "a-4",
    type: "success",
    title: "Ma'lumotlar bazasi zaxira nusxasi (Backup)",
    message: "Haftalik to'liq ma'lumotlar bazasi zaxira nusxasi muvaffaqiyatli yaratildi va S3 bulutiga yuklandi.",
    time: "2 kun oldin",
    read: true,
  }
];

const INITIAL_BROADCASTS = [
  {
    id: "b-1",
    title: "Platforma Yangilanishi: v2.4.0",
    message: "Bugun tunda platforma v2.4.0 talqiniga o'tkaziladi. Tizimda 10-15 daqiqa davomida uzilishlar bo'lishi mumkin. Xavotirga o'rin yo'q.",
    target: "Barcha foydalanuvchilar",
    sender: "Super Admin",
    date: "2026-05-18",
    status: "Sent"
  },
  {
    id: "b-2",
    title: "Yangi Agent xususiyatlari qo'shildi",
    message: "Hurmatli agent adminlar, endilikda siz studentlarga shaxsiy mentorlarni bevosita dashboard orqali biriktira olasiz. Sinab ko'ring!",
    target: "Konsalting Adminlari",
    sender: "Super Admin",
    date: "2026-05-10",
    status: "Sent"
  }
];

export default function SuperAdminNotifications() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [broadcasts, setBroadcasts] = useState(INITIAL_BROADCASTS);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastType, setBroadcastType] = useState("info");
  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();

  const handleMarkAsRead = (id: string) => {
    setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, read: true } : alert));
    toast({
      title: "Muvaffaqiyatli",
      description: "Xabar o'qilgan deb belgilandi.",
    });
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    toast({
      title: "O'chirildi",
      description: "Tizim xabari o'chirib tashlandi.",
    });
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      toast({
        title: "Xatolik",
        description: "Iltimos, barcha maydonlarni to'ldiring.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    // Simulate network delay
    setTimeout(() => {
      const newBroadcast = {
        id: `b-${Date.now()}`,
        title: broadcastTitle,
        message: broadcastMessage,
        target: broadcastTarget === 'all' ? 'Barcha foydalanuvchilar' : 
                broadcastTarget === 'admins' ? 'Konsalting Adminlari' : 'Faqat Talabalar',
        sender: "Super Admin",
        date: new Date().toISOString().split('T')[0],
        status: "Sent"
      };

      setBroadcasts([newBroadcast, ...broadcasts]);
      setIsSending(false);
      
      // Reset form
      setBroadcastTitle("");
      setBroadcastMessage("");
      
      toast({
        title: "E'lon yuborildi!",
        description: "Barcha tegishli foydalanuvchilarga xabarnoma jo'natildi.",
      });
    }, 1200);
  };

  const filteredBroadcasts = broadcasts.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="text-foreground font-sans space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bildirishnomalar</h1>
        <p className="text-white/50 mt-1 text-sm">
          Tizim ogohlantirishlarini kuzatish va platforma foydalanuvchilariga e'lonlar yuborish
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Faol Ogohlantirishlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {alerts.filter(a => !a.read).length}
            </div>
            <p className="text-xs text-white/40 mt-1">O'qilmagan tizim xabarlari</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-500" />
              Yuborilgan E'lonlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{broadcasts.length}</div>
            <p className="text-xs text-white/40 mt-1">Platforma bo'ylab broadcasts</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Target Auditoriya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">650+</div>
            <p className="text-xs text-white/40 mt-1">Jami faol foydalanuvchilar</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              Yordam So'rovlari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">3 ta</div>
            <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
              Ko'rib chiqish kutilmoqda
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Broadcast Form & History (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* New Broadcast Form */}
          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Yangi E'lon Yuborish (Broadcast)
              </CardTitle>
              <CardDescription className="text-xs text-white/50">
                Ushbu bo'lim orqali platformadagi ma'lum bir guruh yoki barcha foydalanuvchilarga xabar yuborishingiz mumkin.
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
                    <label className="text-xs text-white/70 font-semibold">Kimlarga yuboriladi (Target)</label>
                    <select
                      className="w-full bg-black/50 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value)}
                    >
                      <option value="all">Barcha foydalanuvchilar</option>
                      <option value="admins">Faqat Konsalting Adminlari</option>
                      <option value="students">Faqat Talabalar</option>
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
                  <Send className="w-4 h-4" />
                  {isSending ? "Yuborilmoqda..." : "E'lonni Tarqatish"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Broadcast History */}
          <Card className="bg-muted/5 border-white/5 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Yuborilgan E'lonlar Tarixi</CardTitle>
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
                    <th className="p-4">Target Auditoriya</th>
                    <th className="p-4">Yuborilgan Sana</th>
                    <th className="p-4 text-right">Holati</th>
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
                      <td className="p-4 text-xs text-muted-foreground">{b.date}</td>
                      <td className="p-4 text-right">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {b.status === "Sent" ? "Yuborilgan" : b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredBroadcasts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-muted-foreground text-sm">
                        Hech qanday e'lon yuborilmagan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Right column: System Alerts Feed (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="bg-muted/5 border-white/5 h-full">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Tizim Loglari & Alerts</CardTitle>
                  <CardDescription className="text-xs">Platforma holati va real-time ogohlantirishlar</CardDescription>
                </div>
                <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      alert.read ? 'bg-black/20 border-white/5' : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                          {alert.type === 'danger' && <ShieldAlert className="w-5 h-5 text-rose-500" />}
                          {alert.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                          {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${alert.read ? 'text-white/60' : 'text-white'}`}>
                            {alert.title}
                          </p>
                          <p className="text-xs text-white/50 mt-1 leading-relaxed">
                            {alert.message}
                          </p>
                          <span className="text-[10px] text-white/30 mt-2 block">{alert.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!alert.read && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 hover:bg-white/5 text-amber-500 hover:text-amber-400"
                            onClick={() => handleMarkAsRead(alert.id)}
                            title="O'qilgan deb belgilash"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 hover:bg-rose-500/10 text-white/40 hover:text-rose-400"
                          onClick={() => handleDeleteAlert(alert.id)}
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {alerts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground text-sm space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p>Barcha ogohlantirishlar ko'rib chiqildi.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
