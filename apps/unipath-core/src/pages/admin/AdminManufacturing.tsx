import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Factory, 
  Plus, 
  Layers, 
  Settings, 
  Users, 
  DollarSign, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';

interface MfgBOM {
  id: string;
  name: string;
  sku: string;
  components: Array<{ component_name: string; qty: number; unit: string }>;
  cost_estimate: number;
}

interface MfgTask {
  id: string;
  bom_id: string;
  bom_name?: string;
  qty: number;
  status: 'planned' | 'cutting' | 'sewing' | 'assembly' | 'packaging' | 'qc' | 'completed';
  assigned_worker_id: string | null;
  assigned_worker_name?: string;
  piece_rate_salary: number; // piece rate wage per unit
  created_at: string;
}

export default function AdminManufacturing() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [boms, setBoms] = useState<MfgBOM[]>([]);
  const [tasks, setTasks] = useState<MfgTask[]>([]);
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([]);

  // Modals & Forms
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [bomName, setBomName] = useState('');
  const [bomSKU, setBomSKU] = useState('');
  const [bomCost, setBomCost] = useState('25000');
  const [compName, setCompName] = useState('');
  const [compQty, setCompQty] = useState('1');
  const [compUnit, setCompUnit] = useState('dona');
  const [bomComponents, setBomComponents] = useState<Array<{ component_name: string; qty: number; unit: string }>>([]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedBOMId, setSelectedBOMId] = useState('');
  const [taskQty, setTaskQty] = useState('100');
  const [assignedWorkerId, setAssignedWorkerId] = useState('');
  const [pieceRateSalary, setPieceRateSalary] = useState('2000'); // salary per 1 unit produced

  useEffect(() => {
    async function fetchMfgData() {
      if (!activeTenant) return;
      try {
        setLoading(true);
        // 1. Fetch profiles for worker lookup
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role');
        
        const workerList = (profiles || [])
          .filter(p => p.role === 'agent' || p.role === 'mentor' || p.role === 'manager' || p.role === 'owner')
          .map(p => ({ id: p.id, name: p.full_name || p.email }));
        setWorkers(workerList);

        // 2. Fetch BOMs
        const { data: bomsData, error: bomsError } = await supabase
          .from('mfg_boms')
          .select('*');

        if (bomsError) throw bomsError;
        setBoms(bomsData || []);

        // 3. Fetch Tasks
        const { data: tasksData } = await supabase
          .from('mfg_tasks')
          .select('*')
          .order('created_at', { ascending: false });

        const mappedTasks = (tasksData || []).map(t => {
          const bom = bomsData?.find(b => b.id === t.bom_id);
          const wrk = workerList.find(w => w.id === t.assigned_worker_id);
          return {
            ...t,
            bom_name: bom?.name || 'O\'chirilgan formula',
            assigned_worker_name: wrk?.name || 'Belgilanmagan ishchi'
          };
        });
        setTasks(mappedTasks);

      } catch (err: any) {
        console.error('Error fetching manufacturing data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMfgData();
  }, [activeTenant]);

  const handleAddComponent = () => {
    if (!compName.trim()) return;
    setBomComponents([...bomComponents, {
      component_name: compName,
      qty: parseFloat(compQty),
      unit: compUnit
    }]);
    setCompName('');
    setCompQty('1');
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomName.trim() || !activeTenant) return;

    try {
      const cost = parseFloat(bomCost);
      const { data, error } = await supabase
        .from('mfg_boms')
        .insert({
          tenant_id: activeTenant.id,
          name: bomName,
          sku: bomSKU,
          components: bomComponents,
          cost_estimate: cost
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'BOM Formula yaratildi!',
        description: `"${bomName}" mahsulot retsepti muvaffaqiyatli saqlandi.`
      });

      setBoms([...boms, data]);
      setIsBOMModalOpen(false);
      setBomComponents([]);
      setBomName('');
      setBomSKU('');
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBOMId || !activeTenant) return;

    try {
      const qty = parseInt(taskQty);
      const rate = parseFloat(pieceRateSalary);

      const { data: task, error: taskError } = await supabase
        .from('mfg_tasks')
        .insert({
          tenant_id: activeTenant.id,
          bom_id: selectedBOMId,
          qty: qty,
          status: 'planned',
          assigned_worker_id: assignedWorkerId || null,
          piece_rate_salary: rate
        })
        .select()
        .single();

      if (taskError) throw taskError;

      toast({
        title: 'Ishlab chiqarish buyrug\'i yaratildi!',
        description: `Miqdor: ${qty} dona. Ishchi biriktirildi.`
      });

      const bom = boms.find(b => b.id === selectedBOMId);
      const wrk = workers.find(w => w.id === assignedWorkerId);

      setTasks([{
        ...task,
        bom_name: bom?.name || 'BOM',
        assigned_worker_name: wrk?.name || 'Belgilanmagan ishchi'
      }, ...tasks]);
      setIsTaskModalOpen(false);
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleAdvanceStatus = async (taskId: string, currentStatus: string) => {
    let nextStatus: 'planned' | 'cutting' | 'sewing' | 'assembly' | 'packaging' | 'qc' | 'completed' = 'planned';
    
    switch (currentStatus) {
      case 'planned': nextStatus = 'cutting'; break;
      case 'cutting': nextStatus = 'sewing'; break;
      case 'sewing': nextStatus = 'assembly'; break;
      case 'assembly': nextStatus = 'packaging'; break;
      case 'packaging': nextStatus = 'qc'; break;
      case 'qc': nextStatus = 'completed'; break;
      case 'completed': return;
    }

    try {
      await supabase
        .from('mfg_tasks')
        .update({ status: nextStatus })
        .eq('id', taskId);

      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      toast({
        title: 'Bosqich yangilandi',
        description: `Ishlab chiqarish bosqichi "${nextStatus.toUpperCase()}" ga o'zgartirildi.`
      });
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
      case 'planned': return 'bg-white/5 text-white/60 border-white/10';
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'qc': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Ishlab chiqarish tizimi yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Factory className="w-7 h-7 text-primary" /> Ishlab Chiqarish va Sex Boshqaruvi
          </h1>
          <p className="text-muted-foreground text-sm">BOM (retseptlar), bosqichma-bosqich ishlab chiqarish quvuri va ishbay oylik hisob-kitoblari.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsBOMModalOpen(true)} className="rounded-xl border border-border">
            <Settings className="w-4 h-4 mr-2" /> Yangi BOM (Formula) yaratish
          </Button>
          <Button onClick={() => setIsTaskModalOpen(true)} className="gap-2 rounded-xl">
            <Plus className="w-5 h-5" /> Ishlab chiqarish buyrug'i
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">BOM Retseptlari</p>
              <p className="text-2xl font-bold text-foreground mt-1">{boms.length} ta</p>
            </div>
            <FileText className="w-8 h-8 text-primary/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Joriy ishlab chiqarish</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {tasks.filter(t => t.status !== 'completed').length} buyruq
              </p>
            </div>
            <Layers className="w-8 h-8 text-blue-500/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Hisoblangan ishbay oylik</p>
              <p className="text-2xl font-bold text-success mt-1">
                {tasks.reduce((acc, curr) => acc + (curr.qty * curr.piece_rate_salary), 0).toLocaleString()} UZS
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-success/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">QC (Sifat nazoratida)</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                {tasks.filter(t => t.status === 'qc').length} ta
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-purple-500/20" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active manufacturing orders */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle>Ishlab chiqarish konveyeri (Production Pipeline)</CardTitle>
              <CardDescription>Joriy sex buyurtmalari, bosqichlar va biriktirilgan sex xodimlari jurnali</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-semibold">
                      <th className="p-4">Mahsulot (BOM)</th>
                      <th className="p-4">Miqdor</th>
                      <th className="p-4">Ishchi / Ishbay</th>
                      <th className="p-4">Bosqich</th>
                      <th className="p-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">Ishlab chiqarish buyruqlari hali yaratilmadi.</td>
                      </tr>
                    ) : (
                      tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-muted/10">
                          <td className="p-4">
                            <p className="font-bold text-foreground">{task.bom_name}</p>
                            <p className="text-[10px] text-muted-foreground">Sana: {new Date(task.created_at).toLocaleDateString()}</p>
                          </td>
                          <td className="p-4 font-semibold text-foreground">{task.qty} dona</td>
                          <td className="p-4">
                            <p className="font-medium text-foreground text-xs">{task.assigned_worker_name}</p>
                            <p className="text-[10px] text-muted-foreground">Tarif: {task.piece_rate_salary.toLocaleString()} UZS / dona</p>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase ${getStatusBadge(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {task.status !== 'completed' ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-lg text-xs flex items-center gap-1 ml-auto"
                                onClick={() => handleAdvanceStatus(task.id, task.status)}
                              >
                                O'tkazish <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <span className="text-xs text-success font-bold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Tayyor
                              </span>
                            )}
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

        {/* Available BOM Recipes */}
        <div className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-lg">BOM mahsulot retseptlari</CardTitle>
            </CardHeader>
            <CardContent>
              {boms.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs font-sans">Formulalar kiritilmagan.</div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {boms.map((bom) => (
                    <div key={bom.id} className="p-3 border border-border bg-muted/10 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-foreground text-sm">{bom.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{bom.sku}</span>
                      </div>
                      <div className="space-y-1 pl-2 border-l-2 border-primary/20 text-muted-foreground">
                        {bom.components.map((c, idx) => (
                          <p key={idx}>• {c.component_name}: {c.qty} {c.unit}</p>
                        ))}
                      </div>
                      <p className="text-[10px] text-right font-medium text-primary">Tannarx smetasi: {bom.cost_estimate.toLocaleString()} UZS</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BOM formula Modal */}
      {isBOMModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Yangi BOM Formula (Mahsulot tarkibi)</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBOM} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bName" className="text-xs">Mahsulot Nomi</Label>
                  <Input 
                    id="bName" 
                    placeholder="Masalan: Erkaklar kostyumi" 
                    value={bomName} 
                    onChange={(e) => setBomName(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">SKU</Label>
                    <Input 
                      placeholder="MFG-SUIT-001" 
                      value={bomSKU} 
                      onChange={(e) => setBomSKU(e.target.value)}
                      className="rounded-xl border border-border"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Taxminiy Tannarx (UZS)</Label>
                    <Input 
                      type="number"
                      value={bomCost} 
                      onChange={(e) => setBomCost(e.target.value)}
                      className="rounded-xl border border-border"
                      required
                    />
                  </div>
                </div>

                {/* Add component sub-form */}
                <div className="p-3 bg-muted/40 rounded-xl space-y-3">
                  <Label className="text-xs font-bold">Xomashyo komponentini qo'shish</Label>
                  <div className="space-y-1.5">
                    <Input 
                      placeholder="Tugma, Mato, Ip..." 
                      value={compName} 
                      onChange={(e) => setCompName(e.target.value)}
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type="number"
                      placeholder="Miqdori"
                      value={compQty} 
                      onChange={(e) => setCompQty(e.target.value)}
                      className="rounded-lg h-9 text-xs"
                    />
                    <Input 
                      placeholder="Birlik (masalan: metr, dona)" 
                      value={compUnit} 
                      onChange={(e) => setCompUnit(e.target.value)}
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>
                  <Button type="button" onClick={handleAddComponent} className="w-full h-9 rounded-lg text-xs" variant="secondary">
                    Tarkibga qo'shish
                  </Button>
                </div>

                {/* Display added components */}
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {bomComponents.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted/20 border border-border rounded-lg">
                      <span>{item.component_name}</span>
                      <span className="font-semibold">{item.qty} {item.unit}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsBOMModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    Formulani saqlash
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task order Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Yangi ishlab chiqarish buyrug'i</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="taskBOM" className="text-xs">Ishlab chiqariladigan mahsulot (BOM)</Label>
                  <select
                    id="taskBOM"
                    className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm"
                    value={selectedBOMId}
                    onChange={(e) => setSelectedBOMId(e.target.value)}
                    required
                  >
                    <option value="">Formulani tanlang</option>
                    {boms.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tQty" className="text-xs">Ishlab chiqarish miqdori (dona)</Label>
                  <Input 
                    id="tQty" 
                    type="number"
                    value={taskQty} 
                    onChange={(e) => setTaskQty(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="taskWorker" className="text-xs">Mas'ul ishchi (Sex xodimi)</Label>
                  <select
                    id="taskWorker"
                    className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm"
                    value={assignedWorkerId}
                    onChange={(e) => setAssignedWorkerId(e.target.value)}
                  >
                    <option value="">Ishchini tanlang</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rateSal" className="text-xs">Ishbay oylik stavkasi (dona / UZS)</Label>
                  <Input 
                    id="rateSal" 
                    type="number"
                    value={pieceRateSalary} 
                    onChange={(e) => setPieceRateSalary(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    Buyruq yuborish
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
