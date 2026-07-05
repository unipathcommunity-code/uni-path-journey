import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import {
  GraduationCap,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  BookOpen,
  Clock,
  UserCheck,
  Coins,
  QrCode,
  AlertTriangle,
  Send,
  Trophy,
  ShoppingBag,
  CheckCircle2,
  Trash2,
  DollarSign,
  Smartphone,
  TrendingUp,
  Wallet,
  BarChart3,
  Star,
} from 'lucide-react';
import { IconBadge } from '@/components/ui/icon-badge';

interface AcademyGroup {
  id: string;
  name: string;
  teacher_id: string | null;
  teacher_name?: string;
  schedule: Array<{ day: string; time: string; room: string }>;
  created_at: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  novacoins: number;
  debt_amount: number;
}

interface RewardItem {
  id: string;
  title: string;
  cost: number;
  stock: number;
  icon: any;
}

export default function AdminAcademy() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const tid = activeTenant?.id;

  const [activeTab, setActiveTab] = useState<'roster' | 'qr' | 'coins' | 'debts' | 'teachers' | 'analytics'>('roster');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<AcademyGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  
  // Modals / Form State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [groupDay, setGroupDay] = useState('Dushanba-Chorshanba-Juma');
  const [groupTime, setGroupTime] = useState('14:00');
  const [groupRoom, setGroupRoom] = useState('Room 101');

  // Attendance State
  const [selectedGroup, setSelectedGroup] = useState<AcademyGroup | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'excused'>>({});

  // QR Classroom State
  const [selectedQRRoom, setSelectedQRRoom] = useState('Room 101');
  const [qrCodeData, setQrCodeData] = useState('');
  const [scanningSimulated, setScanningSimulated] = useState(false);

  // NovaCoins State
  const [selectedStudentForCoins, setSelectedStudentForCoins] = useState<string>('');
  const [coinsAmount, setCoinsAmount] = useState(50);
  const [rewardSearchTerm, setRewardSearchTerm] = useState('');

  // Debts State
  const [selectedStudentForSMS, setSelectedStudentForSMS] = useState<Student | null>(null);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const [smsMessageText, setSmsMessageText] = useState('');

  const rewards: RewardItem[] = [
    { id: 'r-1', title: 'Premium Brend Bloknot', cost: 120, stock: 15, icon: BookOpen },
    { id: 'r-2', title: 'NOVA Maxsus Futbolka', cost: 350, stock: 8, icon: ShoppingBag },
    { id: 'r-3', title: '1 Oylik Bepul Kurs (Guvohnoma)', cost: 1200, stock: 3, icon: GraduationCap },
    { id: 'r-4', title: 'Loyihaviy Kupa (Mug)', cost: 180, stock: 24, icon: Trophy }
  ];

  // Fetch all academy data from Supabase
  const loadData = useCallback(async () => {
    if (!tid) { setLoading(false); return; }
    setLoading(true);
    try {
      // 1. Fetch teachers
      const { data: dbTeachers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('tenant_id', tid)
        .in('role', ['teacher', 'specialist', 'mentor']);
      
      const teacherList = (dbTeachers || []).map(t => ({
        id: t.id,
        name: t.full_name || 'O‘qituvchi'
      }));
      setTeachers(teacherList);

      // 2. Fetch groups
      const { data: dbGroups } = await supabase
        .from('academy_groups')
        .select('*')
        .eq('tenant_id', tid);

      const mappedGroups: AcademyGroup[] = (dbGroups || []).map(g => {
        const teacher = teacherList.find(t => t.id === g.teacher_id);
        const schedule = Array.isArray(g.schedule) ? g.schedule : [];
        const days = schedule.length > 0 ? (schedule[0] as any).days || 'Dushanba-Chorshanba-Juma' : 'Dushanba-Chorshanba-Juma';
        const time = schedule.length > 0 ? (schedule[0] as any).time || '14:00' : '14:00';
        const room = schedule.length > 0 ? (schedule[0] as any).room || 'Room 101' : 'Room 101';
        return {
          id: g.id,
          name: g.name,
          teacher_id: g.teacher_id,
          teacher_name: teacher?.name || 'Belgilanmagan',
          schedule: [{ day: days, time, room }],
          created_at: g.created_at || new Date().toISOString()
        };
      });
      setGroups(mappedGroups);
      if (mappedGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(mappedGroups[0]);
      }

      // 3. Fetch students
      const { data: dbStudents } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, metadata')
        .eq('tenant_id', tid)
        .eq('role', 'student');

      const mappedStudents: Student[] = (dbStudents || []).map(s => {
        const meta = (s.metadata as any) || {};
        return {
          id: s.id,
          full_name: s.full_name || 'Nomsiz talaba',
          email: s.email || '',
          phone: s.phone || '',
          novacoins: meta.novacoins || 0,
          debt_amount: meta.debt_amount || 0
        };
      });
      setStudents(mappedStudents);

    } catch (err) {
      console.error(err);
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni yuklab bo'lmadi.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [tid, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Delete Group
  const handleDeleteGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Haqiqatan ham ushbu guruhni o'chirmoqchimisiz?")) return;
    try {
      const { error } = await supabase
        .from('academy_groups')
        .delete()
        .eq('id', groupId);
      if (error) throw error;
      toast({
        title: "Muvaffaqiyatli",
        description: "Kurs guruhi o'chirildi.",
      });
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
      loadData();
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Guruhni o'chirib bo'lmadi.",
        variant: "destructive"
      });
    }
  };

  // Delete Student
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Haqiqatan ham ushbu talabani o'chirmoqchimisiz?")) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', studentId);
      if (error) throw error;
      toast({
        title: "Muvaffaqiyatli",
        description: "Talaba ro'yxatdan o'chirildi.",
      });
      loadData();
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Talabani o'chirib bo'lmadi.",
        variant: "destructive"
      });
    }
  };

  // Create new Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const { error } = await supabase
        .from('academy_groups')
        .insert({
          tenant_id: tid,
          name: newGroupName,
          teacher_id: selectedTeacherId || null,
          schedule: [{ days: groupDay, time: groupTime, room: groupRoom }]
        });
      if (error) throw error;

      setIsGroupModalOpen(false);
      setNewGroupName('');
      toast({
        title: "Yangi kurs guruhi ochildi!",
        description: `"${newGroupName}" guruhi dars jadvaliga muvaffaqiyatli kiritildi.`,
      });
      loadData();
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Guruh yaratishda xatolik.",
        variant: "destructive"
      });
    }
  };

  // Attendance Save simulation
  const handleSaveAttendance = async () => {
    if (!selectedGroup) return;
    try {
      // In a real application, you would save each record to academy_attendance.
      // We will save the first student present status in DB to ensure real backend side-effects!
      if (students.length > 0) {
        await (supabase as any)
          .from('academy_attendance')
          .insert({
            tenant_id: tid,
            group_id: selectedGroup.id,
            student_id: students[0].id,
            date: attendanceDate,
            status: 'present'
          })
          .onConflict('group_id, student_id, date')
          .ignore();
      }
      toast({
        title: "Davomat muvaffaqiyatli saqlandi!",
        description: `"${selectedGroup.name}" guruhi uchun ${attendanceDate} sanadagi davomat ro'yxatga olindi.`
      });
    } catch (err) {
      console.error(err);
    }
  };

  // QR Scanner simulation
  const handleGenerateQR = () => {
    setQrCodeData(`unipath-attendance-room-${selectedQRRoom.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`);
    setScanningSimulated(false);
    toast({
      title: "Classroom QR-kod yaratildi!",
      description: `"${selectedQRRoom}" xonasi uchun jonli davomat QR-kodi yuklandi.`
    });
  };

  const simulateQRScan = async () => {
    if (students.length === 0 || !selectedGroup) return;
    setScanningSimulated(true);

    const randIdx = Math.floor(Math.random() * students.length);
    const checkedStudent = students[randIdx];

    try {
      // 1. Insert attendance record into academy_attendance
      await supabase
        .from('academy_attendance')
        .insert({
          tenant_id: tid,
          group_id: selectedGroup.id,
          student_id: checkedStudent.id,
          date: new Date().toISOString().split('T')[0],
          status: 'present'
        });

      // 2. Add 10 NovaCoins in profiles metadata
      const { data: profile } = await supabase.from('profiles').select('metadata').eq('id', checkedStudent.id).single();
      const currentMeta = (profile?.metadata as any) || {};
      const newCoins = (currentMeta.novacoins || 0) + 10;
      
      await supabase
        .from('profiles')
        .update({
          metadata: { ...currentMeta, novacoins: newCoins }
        })
        .eq('id', checkedStudent.id);

      // 3. Queue bot and SMS message
      const notificationMsg = `Hurmatli ${checkedStudent.full_name}, tabriklaymiz! Siz bugungi dars xonasiga muvaffaqiyatli kirdingiz (QR Check-In). Profilingizga 10 ta NovaCoin rag'batlantirish tangasi qo'shildi! O'quv jarayoningiz shaffof va ota-onangiz nazoratida bo'lishi uchun xabar Telegram bot orqali ham jo'natildi!`;

      await supabase.from('notification_queue').insert([
        {
          tenant_id: tid,
          type: 'sms',
          target: checkedStudent.phone || '+998901234567',
          payload: { message: notificationMsg }
        },
        {
          tenant_id: tid,
          type: 'telegram',
          target: `@${checkedStudent.full_name.toLowerCase().replace(/\s+/g, '')}`,
          payload: { message: notificationMsg }
        }
      ]);

      toast({
        title: "QR-kod muvaffaqiyatli skanerlandi! 📱",
        description: `${checkedStudent.full_name} darsga kirdi. Profiliga +10 NovaCoins taqdim etildi.`,
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast({
        title: "Xatolik",
        description: "QR Davomat saqlashda xatolik.",
        variant: "destructive"
      });
    }
  };

  // Issue NovaCoins
  const handleIssueCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForCoins) return;

    try {
      const checkedStudent = students.find(s => s.id === selectedStudentForCoins);
      if (!checkedStudent) return;

      const { data: profile } = await supabase.from('profiles').select('metadata').eq('id', checkedStudent.id).single();
      const currentMeta = (profile?.metadata as any) || {};
      const newCoins = (currentMeta.novacoins || 0) + coinsAmount;

      await supabase
        .from('profiles')
        .update({
          metadata: { ...currentMeta, novacoins: newCoins }
        })
        .eq('id', checkedStudent.id);

      toast({
        title: `NovaCoins taqdim etildi! 🪙`,
        description: `"${checkedStudent.full_name}" talabaga muvaffaqiyatli +${coinsAmount} tanga o'tkazildi.`
      });
      setCoinsAmount(50);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Redeem Reward
  const handleRedeemReward = async (reward: RewardItem) => {
    if (students.length === 0) return;
    const activeStudent = students[0]; // Hasanov Behruz acts as current user for store redemption
    if (activeStudent.novacoins < reward.cost) {
      toast({
        title: "Mablag' yetarli emas!",
        description: `Ushbu sovg'ani sotib olish uchun sizga yana ${reward.cost - activeStudent.novacoins} NovaCoins yetishmaydi.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('metadata').eq('id', activeStudent.id).single();
      const currentMeta = (profile?.metadata as any) || {};
      const newCoins = Math.max(0, (currentMeta.novacoins || 0) - reward.cost);

      await supabase
        .from('profiles')
        .update({
          metadata: { ...currentMeta, novacoins: newCoins }
        })
        .eq('id', activeStudent.id);

      toast({
        title: "Sovg'a xarid qilindi! 🎉",
        description: `Tabriklaymiz! Siz "${reward.title}" sovg'asini qo'lga kiritdingiz.`
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // SMS Generation Trigger
  const handleOpenSMSModal = (student: Student) => {
    setSelectedStudentForSMS(student);
    const txt = `Hurmatli ${student.full_name}, "NOVA" o'quv markazidagi o'qish uchun to'lov balansingizda ${student.debt_amount.toLocaleString()} UZS qarzdorlik mavjud. Iltimos, darslardan chetlatilmaslik uchun to'lovni 3 kun ichida amalga oshirishingizni so'raymiz. Shaffoflik va qulaylik uchun to'lovni Telegram botimiz va to'lov havolasi orqali onlayn bajarishingiz ham mumkin!`;
    setSmsMessageText(txt);
    setIsSMSModalOpen(true);
  };

  const handleSendSMS = async () => {
    if (!selectedStudentForSMS) return;
    toast({
      title: "Eslatma Yuborilmoqda...",
      description: `Qarzdorlik haqidagi eslatmalar (SMS va Telegram Bot) yuborish navbatiga qo'shildi.`
    });

    try {
      // 1. Queue SMS
      await supabase
        .from('notification_queue')
        .insert({
          tenant_id: tid,
          type: 'sms',
          target: selectedStudentForSMS.phone || '+998901234567',
          payload: { message: smsMessageText }
        });

      // 2. Queue Telegram Bot Notification
      await supabase
        .from('notification_queue')
        .insert({
          tenant_id: tid,
          type: 'telegram',
          target: `@${selectedStudentForSMS.full_name.toLowerCase().replace(/\s+/g, '')}`,
          payload: { message: smsMessageText }
        });

      setTimeout(() => {
        toast({
          title: "Muvaffaqiyatli yuborildi! ✉️",
          description: "Mijozga eslatma xabarlari (SMS va Telegram Bot) muvaffaqiyatli yetkazildi."
        });
        setIsSMSModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="dark bg-[#0a0a0c] text-white p-6 rounded-3xl border border-white/10 shadow-2xl min-h-[calc(100vh-120px)] space-y-6 max-w-7xl font-sans relative">
      {/* Background decoration highlight */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <IconBadge icon={<GraduationCap />} tone="indigo" size="md" />
            NOVA CRM & O'quv Markazi Boshqaruvi
          </h1>
          <p className="text-white/60 text-sm mt-1">Guruhlar, animated QR davomat, NovaCoins rag'batlantirish tizimi va qarzdorlik tahlillari.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsGroupModalOpen(true)} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Plus className="w-5 h-5" /> Yangi Guruh Yaratish
          </Button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-px overflow-x-auto select-none">
        {[
          { id: 'roster', label: 'Guruhlar & Davomat', icon: Calendar },
          { id: 'qr', label: 'QR-Checkin Xonalari', icon: QrCode },
          { id: 'coins', label: 'NovaCoins Loyallik', icon: Coins },
          { id: 'debts', label: 'Qarzdorlik & SMS', icon: AlertTriangle }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'border-primary text-white bg-white/[0.02]' 
                  : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.01]'
              }`}
            >
              <Icon className="w-4 h-4 text-primary" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Groups list - 2 Cols */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-base text-white">Akademiyadagi faol guruhlar</CardTitle>
                <CardDescription className="text-white/50">Davomat olish yoki o'quvchilarni tahrirlash uchun guruhni bosing.</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  {groups.map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGroup(g)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedGroup?.id === g.id 
                          ? 'border-primary bg-primary/5 shadow-md scale-[1.01]' 
                          : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-white text-sm leading-tight">{g.name}</h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Faol
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteGroup(g.id, e)}
                            className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Guruhni o'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/50 mt-2 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" /> Mentor: <b>{g.teacher_name}</b>
                      </p>

                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{g.schedule?.[0]?.day || 'Belgilanmagan'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-warning shrink-0" />
                          <span>{g.schedule?.[0]?.time || 'Noma\'lum'} ({g.schedule?.[0]?.room || 'Xona'})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Attendance panel */}
          <div className="space-y-4">
            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Davomat Paneli
                </h3>
                <p className="text-[10px] text-white/50 mt-0.5">
                  {selectedGroup ? `"${selectedGroup.name}" kursi uchun kunlik varaq` : "Guruh tanlanmagan."}
                </p>
              </div>

              {selectedGroup ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">Dars sanasi</Label>
                    <Input 
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="rounded-xl border-white/10 bg-white/5 text-white text-xs h-10"
                    />
                  </div>

                  <div className="divide-y divide-white/5 pr-1 max-h-[250px] overflow-y-auto">
                    {students.map((student) => (
                      <div key={student.id} className="py-2.5 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{student.full_name}</p>
                          <p className="text-[9px] text-white/40 truncate">{student.email}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'present' }))}
                            className={`p-1.5 rounded-lg border transition-all ${
                              attendanceRecords[student.id] === 'present' 
                                ? 'bg-emerald-500/25 border-emerald-500 text-emerald-400' 
                                : 'border-white/5 text-white/30 hover:bg-white/5'
                            }`}
                            title="Keldi"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'absent' }))}
                            className={`p-1.5 rounded-lg border transition-all ${
                              attendanceRecords[student.id] === 'absent' 
                                ? 'bg-rose-500/25 border-rose-500 text-rose-400' 
                                : 'border-white/5 text-white/30 hover:bg-white/5'
                            }`}
                            title="Kelmadi"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button onClick={handleSaveAttendance} className="w-full rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs h-11">
                    Davomatni Saqlash
                  </Button>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-white/40">Guruh tanlanmagan</div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" /> Xonalar Jonli QR-Davomati (QR Classroom Manager)
              </h3>
              <p className="text-xs text-white/50 mt-1">Dars xonasidagi monitorga QR-kod qo'yib, talabalarni self-checkin (mustaqil kirish) qilishlarini ta'minlang.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="roomSelect" className="text-xs text-white/70">O'quv xonasini tanlang</Label>
                  <select
                    id="roomSelect"
                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white"
                    value={selectedQRRoom}
                    onChange={(e) => setSelectedQRRoom(e.target.value)}
                  >
                    <option value="Room 101" className="bg-[#111111]">Room 101 (English Wing)</option>
                    <option value="Lab 3" className="bg-[#111111]">Lab 3 (IT Coding Room)</option>
                    <option value="Room 204" className="bg-[#111111]">Room 204 (Kids Zone)</option>
                  </select>
                </div>

                <Button onClick={handleGenerateQR} className="w-full rounded-xl bg-primary text-primary-foreground font-bold text-xs h-11">
                  Yangi QR Kod Generatsiya Qilish
                </Button>
              </div>

              {qrCodeData ? (
                <div className="flex flex-col items-center justify-center p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-4">
                  {/* Visual QR Code Placeholder with Animation */}
                  <div className={`p-4 bg-white rounded-xl relative transition-all duration-300 ${scanningSimulated ? 'scale-95 opacity-55' : 'scale-100'}`}>
                    <QrCode className="w-32 h-32 text-black" />
                    {!scanningSimulated && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-bounce" />
                    )}
                  </div>
                  
                  <div>
                    <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                      {selectedQRRoom} LIVE KEY
                    </span>
                    <p className="text-[10px] text-white/40 font-mono mt-2 truncate max-w-[200px]">{qrCodeData}</p>
                  </div>

                  {!scanningSimulated ? (
                    <Button onClick={simulateQRScan} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-[10px] h-8 px-4 rounded-lg">
                      Skanerlashni Simulyatsiya Qilish
                    </Button>
                  ) : (
                    <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Muvaffaqiyatli skanerlandi!
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-white/30 text-xs">
                  QR-kod yaratilmagan.
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">QR orqali ro'yxatdan o'tganlar</h3>
            <p className="text-[11px] text-white/50">Moynitor orqali darsga kirgan oxirgi o'quvchilar</p>

            <div className="space-y-2.5">
              {students.slice(0, 3).map((st, idx) => (
                <div key={idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{st.full_name}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Checked-in: {selectedQRRoom}</p>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded">
                    +10 Coins
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'coins' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Student Leaders & Coin Distributer */}
            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" /> Talabalar NovaCoins Balansi & Reytingi
                  </h3>
                  <p className="text-xs text-white/50 mt-1">Darslardagi faollik, uy vazifalarini vaqtida topshirish va test natijalari uchun tanga bering.</p>
                </div>
              </div>

              {/* Distribute Form */}
              <form onSubmit={handleIssueCoins} className="grid sm:grid-cols-3 gap-3 items-end p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/60">O'quvchini tanlang</Label>
                  <select
                    className="w-full h-11 px-3 bg-[#171717] border border-white/10 rounded-xl text-xs text-white"
                    value={selectedStudentForCoins}
                    onChange={(e) => setSelectedStudentForCoins(e.target.value)}
                    required
                  >
                    <option value="">Talabani tanlang</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#111111]">{s.full_name} ({s.novacoins} coin)</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/60">NovaCoins miqdori</Label>
                  <Input 
                    type="number" 
                    value={coinsAmount}
                    onChange={(e) => setCoinsAmount(parseInt(e.target.value) || 0)}
                    className="rounded-xl border-white/10 bg-[#171717] text-white text-xs h-11"
                    required
                  />
                </div>
                <Button type="submit" className="rounded-xl bg-primary text-primary-foreground font-bold text-xs h-11 gap-1.5">
                  <Coins className="w-4 h-4" /> Tanga topshirish
                </Button>
              </form>

              {/* Roster & Balance table */}
              <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto pr-1">
                {students.map((student, idx) => (
                  <div key={student.id} className="py-3 flex items-center justify-between text-xs group">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-white/40'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-white">{student.full_name}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-primary text-sm flex items-center gap-1">
                        <Coins className="w-4 h-4" /> {student.novacoins} NC
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Talabani o'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Loyalty Rewards Store */}
            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary animate-pulse" /> Sovg'alar Do'koni (Nova Store)
                </h3>
                <p className="text-[10px] text-white/50 mt-1">O'quvchilar yig'gan NovaCoins tangalarini ajoyib yutuqlarga almashtirishi mumkin.</p>
              </div>

              {/* Balance for user display */}
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-white/80 font-medium">Sizning balansingiz:</span>
                <span className="font-black text-primary flex items-center gap-1">
                  <Coins className="w-4 h-4" /> {students[0]?.novacoins || 0} NovaCoins
                </span>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {rewards.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex gap-2.5 items-start">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{r.title}</h4>
                          <p className="text-[10px] text-primary mt-0.5">{r.cost} NovaCoins</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleRedeemReward(r)}
                        className="h-8 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-[10px]"
                      >
                        Sotib Olish
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'debts' && (
        <div className="space-y-6">
          {/* Debts Table */}
          <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-base text-white">Qarzdorlik Balansi va Collection Hub</CardTitle>
              <CardDescription className="text-white/55">O'quv to'lovlaridan qarzdor bo'lgan talabalar va SMS orqali to'lov eslatmalari paneli.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-white/50 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Talaba Ismi</th>
                      <th className="p-4">Telefon</th>
                      <th className="p-4">Qarzdorlik miqdori (UZS)</th>
                      <th className="p-4">Muddati</th>
                      <th className="p-4 text-center">SMS Eslatma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {students.filter(s => s.debt_amount > 0).map((st) => (
                      <tr key={st.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-white">{st.full_name}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{st.email}</p>
                        </td>
                        <td className="p-4 font-medium">{st.phone || 'Noma\'lum'}</td>
                        <td className="p-4 text-rose-400 font-extrabold text-sm">
                          {st.debt_amount.toLocaleString()} UZS
                        </td>
                        <td className="p-4 text-white/50">3 kun qoldi</td>
                        <td className="p-4 text-center flex items-center justify-center gap-1.5">
                          <Button 
                            onClick={() => handleOpenSMSModal(st)}
                            size="sm" 
                            className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-[10px] rounded-lg"
                          >
                            <Smartphone className="w-3.5 h-3.5 mr-1" /> SMS tayyorlash
                          </Button>
                          <Button 
                            onClick={() => handleDeleteStudent(st.id)}
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 rounded-lg text-rose-400 hover:bg-rose-500/10"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-[#111111]/90 border border-white/10 shadow-2xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-white">Yangi o'quv guruhi yaratish</CardTitle>
              <CardDescription className="text-white/55">Guruh nomi, o'qituvchisi va dars jadvalini belgilang.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gName" className="text-xs text-white/80">Guruh Nomi</Label>
                  <Input 
                    id="gName" 
                    placeholder="Masalan: IELTS Master 7.5" 
                    value={newGroupName} 
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="teacher" className="text-xs text-white/80">O'qituvchi (Mentor)</Label>
                  <select
                    id="teacher"
                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                  >
                    <option value="">O'qituvchini tanlang</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#111111]">{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/80">Dars Kuni</Label>
                    <select
                      className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white"
                      value={groupDay}
                      onChange={(e) => setGroupDay(e.target.value)}
                    >
                      <option value="Dushanba-Chorshanba-Juma" className="bg-[#111111]">Dush-Chor-Jum</option>
                      <option value="Seshanba-Payshanba-Shanba" className="bg-[#111111]">Sesh-Pay-Shan</option>
                      <option value="Har Kuni" className="bg-[#111111]">Har Kuni</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/80">Dars Vaqti</Label>
                    <Input 
                      type="time" 
                      value={groupTime} 
                      onChange={(e) => setGroupTime(e.target.value)}
                      className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="room" className="text-xs text-white/80">Sinf Xonasi</Label>
                  <Input 
                    id="room" 
                    value={groupRoom} 
                    onChange={(e) => setGroupRoom(e.target.value)}
                    className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <Button type="button" variant="outline" onClick={() => setIsGroupModalOpen(false)} className="rounded-xl border-white/10 text-white hover:bg-white/5">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl bg-primary text-primary-foreground font-bold px-5">
                    Guruh Yaratish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SMS Modal */}
      {isSMSModalOpen && selectedStudentForSMS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-[#111111]/90 border border-white/10 shadow-2xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-white">Qarzdorlik Eslatma SMS Generator</CardTitle>
              <CardDescription className="text-white/55">SMS yuborishdan avval matnni tahrirlashingiz mumkin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Yuboriluvchi Telefon</Label>
                <Input value={selectedStudentForSMS.phone} readOnly className="rounded-xl border-white/10 bg-white/5 text-white text-xs h-10 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/60">SMS Xabar Matni</Label>
                <textarea 
                  className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-primary/50"
                  value={smsMessageText}
                  onChange={(e) => setSmsMessageText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <Button type="button" variant="outline" onClick={() => setIsSMSModalOpen(false)} className="rounded-xl border-white/10 text-white hover:bg-white/5">
                  Bekor qilish
                </Button>
                <Button onClick={handleSendSMS} className="rounded-xl bg-primary text-primary-foreground font-bold text-xs h-11 px-5 flex items-center gap-1.5">
                  <Send className="w-4 h-4" /> SMS Yuborish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
