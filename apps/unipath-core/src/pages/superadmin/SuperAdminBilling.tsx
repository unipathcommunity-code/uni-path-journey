import { useState } from "react";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const MOCK_INVOICES = [
  { id: "INV-001", tenant: "Global Edu Consult", plan: "Pro", amount: 79, date: "2026-05-18", status: "paid" },
  { id: "INV-002", tenant: "EuroStudy Agency", plan: "Pro", amount: 79, date: "2026-05-15", status: "paid" },
  { id: "INV-003", tenant: "Asia Scholars", plan: "Starter", amount: 29, date: "2026-05-10", status: "paid" },
  { id: "INV-004", tenant: "Global Edu Consult", plan: "Pro", amount: 79, date: "2026-04-18", status: "paid" },
  { id: "INV-005", tenant: "EuroStudy Agency", plan: "Pro", amount: 79, date: "2026-04-15", status: "paid" },
  { id: "INV-006", tenant: "Starlight Overseas", plan: "Enterprise", amount: 199, date: "2026-05-02", status: "pending" },
  { id: "INV-007", tenant: "InterStudy Group", plan: "Starter", amount: 29, date: "2026-05-01", status: "failed" },
];

export default function SuperAdminBilling() {
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleCollectPayment = (invId: string) => {
    setInvoices(prev => prev.map(inv => inv.id === invId ? { ...inv, status: "paid" } : inv));
    toast({
      title: "Muvaffaqiyatli",
      description: "To'lov muvaffaqiyatli qabul qilindi.",
    });
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.tenant.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="text-foreground font-sans space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">To'lovlar va tariflar</h1>
        <p className="text-white/50 mt-1 text-sm">
          Konsalting firmalari bilan hisob-kitoblar, oylik to'lovlar va invoyslar jurnali
        </p>
      </div>

      {/* Finance Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              MRR (Oylik daromad)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">$1,450</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12% o'tgan oydan
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              Jami Tushum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">$8,940</div>
            <p className="text-xs text-white/40 mt-1">
              2026-yil boshidan beri
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Kutilayotgan To'lovlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">$199</div>
            <p className="text-xs text-white/40 mt-1">
              1 ta faol invoys
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              To'lanmagan (Failed)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-500">$29</div>
            <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
              Qayta urinish kutilmoqda
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Pricing Summary */}
        <Card className="lg:col-span-1 bg-muted/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Tarif Rejalari</CardTitle>
            <CardDescription className="text-xs">Mavjud tariflar va firmalar taqsimoti</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-white text-sm">Starter Plan</p>
                <p className="text-xs text-muted-foreground">$29 / oy • Maks 50 talaba</p>
              </div>
              <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20">4 ta firma</Badge>
            </div>
            
            <div className="p-3 bg-black/40 border border-amber-500/20 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-white text-sm">Pro Plan</p>
                <p className="text-xs text-muted-foreground">$79 / oy • Maks 200 talaba</p>
              </div>
              <Badge className="bg-amber-500/25 text-amber-500 border border-amber-500/30">12 ta firma</Badge>
            </div>

            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-white text-sm">Enterprise Plan</p>
                <p className="text-xs text-muted-foreground">$199 / oy • Cheksiz talaba</p>
              </div>
              <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20">2 ta firma</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Journal */}
        <Card className="lg:col-span-2 bg-muted/5 border-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Invoyslar Jurnali</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Firma nomi yoki Invoys ID bo'yicha izlash..." 
                className="pl-8 bg-black/50 border-white/10 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Invoys ID</th>
                  <th className="p-4">Firma (Tenant)</th>
                  <th className="p-4">Tarif</th>
                  <th className="p-4">Sana</th>
                  <th className="p-4">Summa</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((inv) => (
                  <motion.tr 
                    key={inv.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.01)' }}
                    className="text-sm transition-colors text-white/80"
                  >
                    <td className="p-4 font-mono text-xs text-white">{inv.id}</td>
                    <td className="p-4 font-semibold text-white">{inv.tenant}</td>
                    <td className="p-4 text-xs text-muted-foreground">{inv.plan}</td>
                    <td className="p-4 text-xs text-muted-foreground">{inv.date}</td>
                    <td className="p-4 font-bold text-amber-500">${inv.amount}</td>
                    <td className="p-4">
                      <Badge className={
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        inv.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }>
                        {inv.status === 'paid' ? 'To\'landi' : inv.status === 'pending' ? 'Kutilmoqda' : 'Xato'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {inv.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="bg-amber-500 hover:bg-amber-600 text-black h-8 px-2"
                          onClick={() => handleCollectPayment(inv.id)}
                        >
                          To'landi qilish
                        </Button>
                      )}
                      {inv.status === 'failed' && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-8 px-2"
                          onClick={() => handleCollectPayment(inv.id)}
                        >
                          Qayta urinish
                        </Button>
                      )}
                      {inv.status === 'paid' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-white/40 hover:text-white/60 h-8 px-2"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
