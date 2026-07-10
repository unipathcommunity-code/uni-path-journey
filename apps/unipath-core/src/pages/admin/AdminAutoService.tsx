import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Car, 
  Plus, 
  Search, 
  Wrench, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  User,
  DollarSign
} from 'lucide-react';

interface AutoJob {
  id: string;
  car_model: string;
  plate_number: string;
  customer_name: string;
  status: 'pending' | 'in_progress' | 'completed';
  service_type: string;
  price: number;
  assigned_mechanic: string;
}

export default function AdminAutoService() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<AutoJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    car_model: '',
    plate_number: '',
    customer_name: '',
    service_type: 'Moy almashtirish',
    price: 150000,
    assigned_mechanic: 'Baxodir Usta'
  });

  useEffect(() => {
    if (!activeTenant?.id) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('auto_jobs')
        .select('*')
        .eq('tenant_id', activeTenant.id)
        .order('created_at', { ascending: false });
      setJobs((data || []) as AutoJob[]);
      setLoading(false);
    })();
  }, [activeTenant]);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.car_model || !newJob.plate_number || !newJob.customer_name) {
      toast({ title: 'Xatolik', description: 'Barcha maydonlarni to\'ldiring', variant: 'destructive' });
      return;
    }
    try {
      const { data, error } = await (supabase as any).from('auto_jobs').insert({
        car_model: newJob.car_model,
        plate_number: newJob.plate_number.toUpperCase(),
        customer_name: newJob.customer_name,
        status: 'pending',
        service_type: newJob.service_type,
        price: Number(newJob.price),
        assigned_mechanic: newJob.assigned_mechanic,
      }).select().single();
      if (error) throw error;
      setJobs([data as AutoJob, ...jobs]);
      setIsModalOpen(false);
      setNewJob({ car_model: '', plate_number: '', customer_name: '', service_type: 'Moy almashtirish', price: 150000, assigned_mechanic: 'Baxodir Usta' });
      toast({ title: 'Muvaffaqiyatli', description: 'Avtoservis buyurtmasi ro\'yxatga olindi!' });
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.car_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="w-8 h-8 text-orange-500" />
            Avtoservis & Texnik Xizmat ko'rsatish
          </h1>
          <p className="text-sm text-muted-foreground">
            Avtomobillar navbati, ustalar ish taqsimoti va texnik ko'rsatilgan xizmatlar hisobi
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-2 font-bold"
        >
          <Plus className="w-5 h-5" />
          Yangi Buyurtma
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Kutilayotganlar</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'pending').length} ta</div>
            <p className="text-[10px] text-muted-foreground mt-1">Navbatdagi mashinalar</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Jarayonda</CardTitle>
            <Wrench className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'in_progress').length} ta</div>
            <p className="text-[10px] text-muted-foreground mt-1">Hozirda ta'mirlanayotgan</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tugatilganlar</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'completed').length} ta</div>
            <p className="text-[10px] text-muted-foreground mt-1">Bugun topshirilganlar</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Umumiy Tushum</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.reduce((acc, curr) => acc + curr.price, 0).toLocaleString()} UZS
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Barcha xizmatlar qiymati</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center bg-card border border-border px-4 py-2 rounded-xl max-w-md gap-2">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          type="text" 
          placeholder="Mashina modeli yoki davlat raqami bo'yicha izlash..." 
          className="border-0 focus-visible:ring-0 p-0 text-sm bg-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Avtoservis Navbatlari Ro'yxati</CardTitle>
          <CardDescription>Barcha faol va yakunlangan buyurtmalar holati</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                  <th className="py-3 px-4">Mashina</th>
                  <th className="py-3 px-4">Davlat Raqami</th>
                  <th className="py-3 px-4">Mijoz</th>
                  <th className="py-3 px-4">Xizmat turi</th>
                  <th className="py-3 px-4">Usta</th>
                  <th className="py-3 px-4">Narxi</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6">Yuklanmoqda...</td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-muted-foreground">Avtomobillar topilmadi</td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                        <Car className="w-4 h-4 text-orange-500" />
                        {job.car_model}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">{job.plate_number}</td>
                      <td className="py-3.5 px-4">{job.customer_name}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{job.service_type}</td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-white/50" />
                          {job.assigned_mechanic}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">{job.price.toLocaleString()} UZS</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          job.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : job.status === 'in_progress'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {job.status === 'completed' ? 'Tugatildi' : job.status === 'in_progress' ? 'Jarayonda' : 'Kutilmoqda'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {job.status === 'pending' && (
                            <Button 
                              onClick={() => {
                                setJobs(prev => prev.map(item => item.id === job.id ? { ...item, status: 'in_progress' as const } : item));
                                toast({ title: 'Muvaffaqiyatli', description: `${job.car_model} ta'miri boshlandi` });
                              }}
                              variant="outline" 
                              size="sm" 
                              className="border-white/10 hover:bg-orange-500 hover:text-white transition-all text-xs rounded-lg h-8"
                            >
                              Boshlash
                            </Button>
                          )}
                          {job.status === 'in_progress' && (
                            <Button 
                              onClick={() => {
                                setJobs(prev => prev.map(item => item.id === job.id ? { ...item, status: 'completed' as const } : item));
                                toast({ title: 'Muvaffaqiyatli', description: `${job.car_model} ta'miri yakunlandi` });
                              }}
                              variant="outline" 
                              size="sm" 
                              className="border-white/10 hover:bg-emerald-500 hover:text-white transition-all text-xs rounded-lg h-8"
                            >
                              Tugatish
                            </Button>
                          )}
                          <Button 
                            onClick={() => {
                              setJobs(prev => prev.filter(item => item.id !== job.id));
                              toast({ title: "O'chirildi", description: `Buyurtma ro'yxatdan olib tashlandi` });
                            }}
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs rounded-lg h-8"
                          >
                            O'chirish
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Yangi Xizmat Buyurtmasi</h3>
              <p className="text-xs text-muted-foreground">Mashina va mijoz ma'lumotlarini kiriting</p>
            </div>
            <form onSubmit={handleAddJob} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="car_model">Mashina Modeli</Label>
                <Input 
                  id="car_model" 
                  placeholder="Masalan: Chevrolet Gentra"
                  value={newJob.car_model}
                  onChange={(e) => setNewJob({...newJob, car_model: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plate_number">Davlat Raqami</Label>
                <Input 
                  id="plate_number" 
                  placeholder="Masalan: 01 A 777 AA"
                  value={newJob.plate_number}
                  onChange={(e) => setNewJob({...newJob, plate_number: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Mijoz Ismi</Label>
                <Input 
                  id="customer" 
                  placeholder="Mijoz ismi va familiyasi"
                  value={newJob.customer_name}
                  onChange={(e) => setNewJob({...newJob, customer_name: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_type">Xizmat Turi</Label>
                <Input 
                  id="service_type" 
                  value={newJob.service_type}
                  onChange={(e) => setNewJob({...newJob, service_type: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Narxi (UZS)</Label>
                <Input 
                  id="price" 
                  type="number"
                  value={newJob.price}
                  onChange={(e) => setNewJob({...newJob, price: Number(e.target.value)})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Bekor qilish
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
                  Yaratish
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
