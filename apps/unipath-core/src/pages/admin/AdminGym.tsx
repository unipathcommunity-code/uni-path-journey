import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Dumbbell, 
  Plus, 
  Users, 
  QrCode, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Camera, 
  Activity, 
  TrendingUp, 
  UserCheck 
} from 'lucide-react';

interface GymMembership {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  status: 'active' | 'expired' | 'paused';
  qr_code: string | null;
  face_id_token: string | null;
  expires_at: string;
}

interface GymSchedule {
  id: string;
  trainer_id: string;
  trainer_name?: string;
  start_time: string;
  end_time: string;
  activity: string;
}

export default function AdminGym() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<GymMembership[]>([]);
  const [schedules, setSchedules] = useState<GymSchedule[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);

  // Modals & Forms
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [membershipMonths, setMembershipMonths] = useState('1');
  const [faceIdToken, setFaceIdToken] = useState('');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [scheduleActivity, setScheduleActivity] = useState('CrossFit');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('09:00');

  useEffect(() => {
    async function fetchGymData() {
      if (!activeTenant) return;
      try {
        setLoading(true);
        // 1. Fetch profiles for lookup
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role');

        const studentList = (profiles || [])
          .filter(p => p.role === 'student')
          .map(p => ({ id: p.id, name: p.full_name || p.email }));
        
        const trainerList = (profiles || [])
          .filter(p => p.role === 'mentor' || p.role === 'manager' || p.role === 'owner')
          .map(p => ({ id: p.id, name: p.full_name || 'Murabbiy' }));

        setStudents(studentList);
        setTrainers(trainerList);

        // 2. Fetch gym memberships
        const { data: membershipData, error: memError } = await supabase
          .from('gym_memberships')
          .select('*');

        if (memError) throw memError;

        const mappedMemberships = (membershipData || []).map(m => {
          const profile = profiles?.find(p => p.id === m.user_id);
          return {
            ...m,
            full_name: profile?.full_name || 'Nomalum A\'zo',
            email: profile?.email || 'Nomalum Email'
          };
        });
        setMemberships(mappedMemberships);

        // 3. Fetch gym schedules
        const { data: schedulesData } = await supabase
          .from('gym_schedules')
          .select('*')
          .order('start_time', { ascending: true });

        const mappedSchedules = (schedulesData || []).map(s => ({
          ...s,
          trainer_name: trainers.find(t => t.id === s.trainer_id)?.name || 'Murabbiy'
        }));
        setSchedules(mappedSchedules);

      } catch (err: any) {
        console.error('Error fetching gym data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGymData();
  }, [activeTenant]);

  const handleCreateMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !activeTenant) return;

    try {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + parseInt(membershipMonths));
      const qrCode = `GYM-QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data, error } = await supabase
        .from('gym_memberships')
        .insert({
          tenant_id: activeTenant.id,
          user_id: selectedUserId,
          status: 'active',
          qr_code: qrCode,
          face_id_token: faceIdToken || null,
          expires_at: expires.toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'A\'zolik faollashtirildi!',
        description: `Mijoz uchun yangi a'zolik paketi muvaffaqiyatli yoqildi.`
      });

      const profile = students.find(s => s.id === selectedUserId);
      setMemberships([...memberships, {
        ...data,
        full_name: profile?.name || 'Yangi A\'zo',
        email: ''
      }]);
      setIsMemberModalOpen(false);
      setSelectedUserId('');
      setFaceIdToken('');
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainerId || !activeTenant) return;

    try {
      const startTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
      const endTime = new Date(startTime.getTime() + 3600000); // 1 hour duration

      const { data, error } = await supabase
        .from('gym_schedules')
        .insert({
          tenant_id: activeTenant.id,
          trainer_id: selectedTrainerId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          activity: scheduleActivity
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Dars jadvali qo\'shildi!',
        description: `"${scheduleActivity}" mashg'uloti dars jadvaliga muvaffaqiyatli qo'shildi.`
      });

      const tName = trainers.find(t => t.id === selectedTrainerId)?.name || 'Murabbiy';
      setSchedules([...schedules, { ...data, trainer_name: tName }]);
      setIsScheduleModalOpen(false);
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'expired':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground font-sans">Sport zali boshqaruvi yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Dumbbell className="w-7 h-7 text-primary" /> Sport Zali va Fitness Boshqaruvi
          </h1>
          <p className="text-muted-foreground text-sm">A'zolik muddatlari, FaceID kirish nazorati va murabbiylar mashg'ulotlari jadvali.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsScheduleModalOpen(true)} className="rounded-xl border border-border">
            <Calendar className="w-4 h-4 mr-2" /> Mashg'ulot jadvalini yaratish
          </Button>
          <Button onClick={() => setIsMemberModalOpen(true)} className="gap-2 rounded-xl">
            <Plus className="w-5 h-5" /> A'zolikni faollashtirish
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Faol a'zolar</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {memberships.filter(m => m.status === 'active').length} nafar
              </p>
            </div>
            <Users className="w-8 h-8 text-emerald-500/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Muddati tugaganlar</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">
                {memberships.filter(m => m.status === 'expired').length} nafar
              </p>
            </div>
            <XCircle className="w-8 h-8 text-rose-500/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">FaceID faollik darajasi</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {memberships.filter(m => m.face_id_token).length} ta
              </p>
            </div>
            <Camera className="w-8 h-8 text-primary/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Bugungi mashg'ulotlar</p>
              <p className="text-2xl font-bold text-success mt-1">{schedules.length} ta</p>
            </div>
            <Activity className="w-8 h-8 text-success/20" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Memberships List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle>Mijozlar a'zolik shartnomalari</CardTitle>
              <CardDescription>Barcha a'zolik paketlari va ularning yaroqlilik muddatlari monitoringi</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-semibold">
                      <th className="p-4">Mijoz (F.I.SH)</th>
                      <th className="p-4">QR Code / FaceID</th>
                      <th className="p-4">Amal qilish muddati</th>
                      <th className="p-4">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {memberships.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">Hozircha hech qanday a'zo yo'q.</td>
                      </tr>
                    ) : (
                      memberships.map((member) => (
                        <tr key={member.id} className="hover:bg-muted/10">
                          <td className="p-4 font-bold text-foreground">{member.full_name}</td>
                          <td className="p-4">
                            <div className="space-y-1 font-mono text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" /> {member.qr_code}</span>
                              {member.face_id_token ? (
                                <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold"><Camera className="w-3.5 h-3.5" /> FaceID Tayyor</span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-[10px]"><Camera className="w-3.5 h-3.5" /> Kiritilmagan</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-medium text-foreground">{member.expires_at}</td>
                          <td className="p-4">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase ${getStatusBadge(member.status)}`}>
                              {member.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Bugungi dars jadvali</CardTitle>
                <CardDescription>Murabbiylar guruhiy mashg'ulotlari</CardDescription>
              </div>
              <Clock className="w-5 h-5 text-muted-foreground/30" />
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">Jadval hali tuzilmadi.</div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {schedules.map((sch) => (
                    <div key={sch.id} className="p-3 border border-border bg-muted/10 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-foreground text-sm">{sch.activity}</span>
                        <span className="text-[10px] text-muted-foreground bg-background border border-border px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(sch.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-muted-foreground">Murabbiy: <b className="text-foreground">{sch.trainer_name}</b></p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Yangi A'zolikni Yoqish</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMembership} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="memUser" className="text-xs">Foydalanuvchi / Mijoz</Label>
                  <select
                    id="memUser"
                    className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">Mijozni tanlang</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="memMonths" className="text-xs">A'zolik Davomiyligi (Oylar)</Label>
                  <select
                    id="memMonths"
                    className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm"
                    value={membershipMonths}
                    onChange={(e) => setMembershipMonths(e.target.value)}
                  >
                    <option value="1">1 oy</option>
                    <option value="3">3 oy</option>
                    <option value="6">6 oy</option>
                    <option value="12">12 oy (Yillik)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="faceToken" className="text-xs">FaceID Skanner Hashi (Ixtiyoriy)</Label>
                  <Input 
                    id="faceToken" 
                    placeholder="face-hash-token-9889" 
                    value={faceIdToken} 
                    onChange={(e) => setFaceIdToken(e.target.value)}
                    className="rounded-xl border border-border"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsMemberModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    A'zolikni yaratish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Mashg'ulot jadvalini yaratish</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="actName" className="text-xs">Mashg'ulot nomi (Aktivlik)</Label>
                  <Input 
                    id="actName" 
                    placeholder="Masalan: CrossFit, Pilates" 
                    value={scheduleActivity} 
                    onChange={(e) => setScheduleActivity(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="schTrainer" className="text-xs">Murabbiy</Label>
                  <select
                    id="schTrainer"
                    className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm"
                    value={selectedTrainerId}
                    onChange={(e) => setSelectedTrainerId(e.target.value)}
                    required
                  >
                    <option value="">Murabbiyni tanlang</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sana</Label>
                    <Input 
                      type="date"
                      value={scheduleDate} 
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="rounded-xl border border-border"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vaqt</Label>
                    <Input 
                      type="time"
                      value={scheduleTime} 
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="rounded-xl border border-border"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsScheduleModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    Jadvalga qo'shish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
