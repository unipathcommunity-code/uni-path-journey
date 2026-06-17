import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  HeartPulse, 
  Plus, 
  Users, 
  Search, 
  Activity, 
  UserCheck, 
  Calendar, 
  Clock, 
  CheckCircle,
  FileText
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  doctor_name: string;
  status: 'scheduled' | 'treating' | 'completed';
  appointment_date: string;
}

export default function AdminClinic() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Forms
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    age: '',
    doctor_name: 'Dr. Alisherov N.',
    status: 'scheduled' as Patient['status'],
    appointment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    async function fetchData() {
      if (!activeTenant) return;
      try {
        setLoading(true);
        // Fallback to mock data since we don't have schema tables for Clinic yet
        const mockPatients: Patient[] = [
          { id: '1', name: 'Karimova Dilnoza', phone: '+998 90 321 45 67', age: 28, doctor_name: 'Dr. Alisherov N.', status: 'treating', appointment_date: new Date().toISOString().split('T')[0] },
          { id: '2', name: 'Tursunov Sardor', phone: '+998 93 456 12 34', age: 45, doctor_name: 'Dr. Rixsiyeva M.', status: 'scheduled', appointment_date: new Date().toISOString().split('T')[0] },
          { id: '3', name: 'Axmedov Bobur', phone: '+998 97 789 54 32', age: 34, doctor_name: 'Dr. Umarov A.', status: 'completed', appointment_date: new Date(Date.now() - 86400000).toISOString().split('T')[0] }
        ];
        setPatients(mockPatients);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTenant]);

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.phone) {
      toast({ title: 'Xatolik', description: 'Firma nomi va telefon raqamini kiriting!', variant: 'destructive' });
      return;
    }

    const patient: Patient = {
      id: Math.random().toString(36).substring(2, 9),
      name: newPatient.name,
      phone: newPatient.phone,
      age: parseInt(newPatient.age) || 30,
      doctor_name: newPatient.doctor_name,
      status: newPatient.status,
      appointment_date: newPatient.appointment_date
    };

    setPatients([patient, ...patients]);
    setIsPatientModalOpen(false);
    setNewPatient({
      name: '',
      phone: '',
      age: '',
      doctor_name: 'Dr. Alisherov N.',
      status: 'scheduled',
      appointment_date: new Date().toISOString().split('T')[0]
    });

    toast({
      title: "Muvaffaqiyatli",
      description: "Bemor muvaffaqiyatli navbatga qo'shildi!"
    });
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.doctor_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HeartPulse className="w-8 h-8 text-rose-500 animate-pulse" />
            Klinika & Tibbiyot Markazi
          </h1>
          <p className="text-sm text-muted-foreground">
            Bemorlarni ro'yxatga olish, shifokorlar va qabullarni boshqarish tizimi
          </p>
        </div>
        <Button 
          onClick={() => setIsPatientModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-2 font-bold"
        >
          <Plus className="w-5 h-5" />
          Yangi Bemor Qo'shish
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Jami Bemorlar</CardTitle>
            <Users className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length} ta</div>
            <p className="text-[10px] text-muted-foreground mt-1">+12% o'tgan haftadan</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Davolanayotgan</CardTitle>
            <Activity className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter(p => p.status === 'treating').length} ta
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Hozirda palatada yoki qabulda</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Bugungi Navbat</CardTitle>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter(p => p.status === 'scheduled').length} ta
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Navbatdagi shifokor qabuli</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Jami Shifokorlar</CardTitle>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6 nafar</div>
            <p className="text-[10px] text-muted-foreground mt-1">Barcha yo'nalishlar bo'yicha</p>
          </CardContent>
        </Card>
      </div>

      {/* Patients Table */}
      <Card className="glass-card border-white/5">
        <CardHeader className="pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Bemorlar Ro'yxati</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Klinikada qabul qilingan barcha bemorlar ma'lumotlari</CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Bemor yoki shifokorni qidirish..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-white/10 rounded-xl"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-foreground/80">
              <thead className="text-xs uppercase bg-white/5 text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Bemor F.I.Sh</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Yoshi</th>
                  <th className="px-4 py-3">Shifokor</th>
                  <th className="px-4 py-3">Qabul kuni</th>
                  <th className="px-4 py-3">Holat</th>
                  <th className="px-4 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4.5 font-medium">{p.name}</td>
                    <td className="px-4 py-4.5">{p.phone}</td>
                    <td className="px-4 py-4.5">{p.age} yosh</td>
                    <td className="px-4 py-4.5">{p.doctor_name}</td>
                    <td className="px-4 py-4.5">{p.appointment_date}</td>
                    <td className="px-4 py-4.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                        p.status === 'treating' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : p.status === 'scheduled'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {p.status === 'treating' ? 'Muolaja' : p.status === 'scheduled' ? 'Navbatda' : 'Tugallangan'}
                      </span>
                    </td>
                    <td className="px-4 py-4.5 text-right">
                      <Button variant="ghost" size="sm" className="hover:bg-white/10 text-xs">Batafsil</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Patient Modal */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Yangi Bemor Qo'shish</h3>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">F.I.Sh</Label>
                <Input 
                  id="name"
                  placeholder="Masalan: Karimova Dilnoza"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="bg-background/50 border-white/10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">Telefon Raqami</Label>
                <Input 
                  id="phone"
                  placeholder="+998 90 123 45 67"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  className="bg-background/50 border-white/10 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="age" className="text-xs font-semibold text-muted-foreground">Yoshi</Label>
                  <Input 
                    id="age"
                    type="number"
                    placeholder="25"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="bg-background/50 border-white/10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground">Qabul Kuni</Label>
                  <Input 
                    id="date"
                    type="date"
                    value={newPatient.appointment_date}
                    onChange={(e) => setNewPatient({ ...newPatient, appointment_date: e.target.value })}
                    className="bg-background/50 border-white/10 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doctor" className="text-xs font-semibold text-muted-foreground">Shifokor</Label>
                <select 
                  id="doctor"
                  value={newPatient.doctor_name}
                  onChange={(e) => setNewPatient({ ...newPatient, doctor_name: e.target.value })}
                  className="w-full bg-background/50 border border-white/10 rounded-xl p-2.5 text-sm text-foreground outline-none"
                >
                  <option value="Dr. Alisherov N.">Dr. Alisherov N. (Terapevt)</option>
                  <option value="Dr. Rixsiyeva M.">Dr. Rixsiyeva M. (Kardiolog)</option>
                  <option value="Dr. Umarov A.">Dr. Umarov A. (Nevropatolog)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsPatientModalOpen(false)}
                  className="rounded-xl"
                >
                  Bekor qilish
                </Button>
                <Button 
                  type="submit" 
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                >
                  Qo'shish
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
