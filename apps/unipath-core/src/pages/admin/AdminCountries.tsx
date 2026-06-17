import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { z } from 'zod';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  GraduationCap,
  Loader2,
  Globe,
  Save,
  Flag,
} from 'lucide-react';

interface Country {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  flag: string | null;
  image_url: string | null;
  is_active: boolean | null;
  display_order: number | null;
  avg_tuition: string | null;
  currency: string | null;
  visa_website: string | null;
  platform_margin_percent: number | null;
  created_at: string;
  updated_at: string;
}

interface UniversityCount {
  country: string;
  count: number;
}

// Validation schema for country
const countrySchema = z.object({
  name: z.string().min(1, "Davlat nomi kiritilishi shart").max(100, "Davlat nomi 100 ta belgidan oshmasligi kerak"),
  name_uz: z.string().max(100, "O'zbekcha nom 100 ta belgidan oshmasligi kerak").optional().nullable(),
  name_ru: z.string().max(100, "Ruscha nom 100 ta belgidan oshmasligi kerak").optional().nullable(),
  flag: z.string().max(10, "Bayroq emoji 10 ta belgidan oshmasligi kerak").optional().nullable(),
  image_url: z.string().url("Noto'g'ri URL formati").or(z.literal('')).optional().nullable(),
  display_order: z.number().min(0, "Tartib raqami 0 dan kichik bo'lmasligi kerak").optional().nullable(),
  avg_tuition: z.string().max(100, "O'qish narxi 100 ta belgidan oshmasligi kerak").optional().nullable(),
  currency: z.string().max(10, "Valyuta 10 ta belgidan oshmasligi kerak").optional().nullable(),
  is_active: z.boolean().optional().nullable(),
});

const emptyCountry: Partial<Country> = {
  name: '',
  name_uz: '',
  name_ru: '',
  flag: '',
  image_url: '',
  is_active: true,
  display_order: 0,
  avg_tuition: '',
  currency: 'USD',
  visa_website: '',
  platform_margin_percent: 30,
};

export default function AdminCountries() {
  const { isSuperAdmin } = useUserRole();
  const [countries, setCountries] = useState<Country[]>([]);
  const [universityCounts, setUniversityCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Partial<Country> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCountries();
    fetchUniversityCounts();
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) {
      toast.error('Davlatlarni yuklashda xatolik');
    } else {
      setCountries((data || []) as Country[]);
    }
    setLoading(false);
  };

  const fetchUniversityCounts = async () => {
    const { data, error } = await supabase
      .from('universities')
      .select('country');
    
    if (!error && data) {
      const counts: Record<string, number> = {};
      data.forEach((uni: { country: string }) => {
        counts[uni.country] = (counts[uni.country] || 0) + 1;
      });
      setUniversityCounts(counts);
    }
  };

  const filteredCountries = countries.filter(country => {
    const matchesSearch = 
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.name_uz?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.name_ru?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const openCreateModal = () => {
    setEditingCountry({ ...emptyCountry });
    setIsModalOpen(true);
  };

  const openEditModal = (country: Country) => {
    setEditingCountry({ ...country });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    // Validate using zod schema
    const validationResult = countrySchema.safeParse({
      name: editingCountry?.name || '',
      name_uz: editingCountry?.name_uz,
      name_ru: editingCountry?.name_ru,
      flag: editingCountry?.flag,
      image_url: editingCountry?.image_url || '',
      display_order: editingCountry?.display_order,
      avg_tuition: editingCountry?.avg_tuition,
      currency: editingCountry?.currency,
      is_active: editingCountry?.is_active,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setSaving(true);

    if (editingCountry?.id) {
      // Update existing
      const { id, created_at, updated_at, ...updateData } = editingCountry as Country;
      const { error } = await supabase
        .from('countries')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        toast.error('Davlatni yangilashda xatolik');
      } else {
        toast.success('Davlat muvaffaqiyatli yangilandi');
        setIsModalOpen(false);
        fetchCountries();
      }
    } else {
      // Create new
      const { id, created_at, updated_at, ...insertData } = editingCountry as Country;
      const { error } = await supabase
        .from('countries')
        .insert([insertData]);
      
      if (error) {
        toast.error('Davlat qo\'shishda xatolik');
      } else {
        toast.success('Davlat muvaffaqiyatli qo\'shildi');
        setIsModalOpen(false);
        fetchCountries();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham bu davlatni o\'chirmoqchimisiz?')) return;
    
    const { error } = await supabase
      .from('countries')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Davlatni o\'chirishda xatolik');
    } else {
      toast.success('Davlat o\'chirildi');
      fetchCountries();
    }
  };

  const toggleActive = async (country: Country) => {
    const { error } = await supabase
      .from('countries')
      .update({ is_active: !country.is_active })
      .eq('id', country.id);
    
    if (error) {
      toast.error('Holatni yangilashda xatolik');
    } else {
      fetchCountries();
    }
  };

  const activeCount = countries.filter(c => c.is_active).length;
  const totalUniversities = Object.values(universityCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Davlatlar</h1>
          <p className="text-muted-foreground">Davlatlarni boshqarish</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" />
            Davlat qo'shish
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <Globe className="w-8 h-8 text-primary mb-2" />
          <p className="text-2xl font-bold">{countries.length}</p>
          <p className="text-sm text-muted-foreground">Jami davlatlar</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <Flag className="w-8 h-8 text-success mb-2" />
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="text-sm text-muted-foreground">Faol davlatlar</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <GraduationCap className="w-8 h-8 text-warning mb-2" />
          <p className="text-2xl font-bold">{totalUniversities}</p>
          <p className="text-sm text-muted-foreground">Jami universitetlar</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <MapPin className="w-8 h-8 text-primary mb-2" />
          <p className="text-2xl font-bold">{countries.filter(c => !c.is_active).length}</p>
          <p className="text-sm text-muted-foreground">Nofaol davlatlar</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Davlat qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Davlat</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">O'qish narxi</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Universitetlar</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Tartib</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Holat</th>
                  {isSuperAdmin && <th className="text-right p-4 font-medium text-muted-foreground">Amallar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCountries.map((country) => (
                  <tr key={country.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{country.flag || '🌍'}</span>
                        <div>
                          <p className="font-medium text-foreground">{country.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {country.name_uz} / {country.name_ru}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-foreground">{country.avg_tuition || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{country.currency}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {universityCounts[country.name] || 0} universitet
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground">#{country.display_order}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={country.is_active || false}
                          disabled={!isSuperAdmin}
                          onCheckedChange={() => toggleActive(country)}
                        />
                        <span className={country.is_active ? 'text-success' : 'text-muted-foreground'}>
                          {country.is_active ? 'Faol' : 'Nofaol'}
                        </span>
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(country)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(country.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCountries.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              Davlat topilmadi
            </div>
          )}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCountry?.id ? 'Davlatni tahrirlash' : 'Yangi davlat qo\'shish'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Nomi (English) *</label>
                <Input
                  value={editingCountry?.name || ''}
                  onChange={(e) => setEditingCountry({ ...editingCountry, name: e.target.value })}
                  placeholder="Country name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Nomi (O'zbekcha)</label>
                <Input
                  value={editingCountry?.name_uz || ''}
                  onChange={(e) => setEditingCountry({ ...editingCountry, name_uz: e.target.value })}
                  placeholder="Davlat nomi"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Nomi (Ruscha)</label>
                <Input
                  value={editingCountry?.name_ru || ''}
                  onChange={(e) => setEditingCountry({ ...editingCountry, name_ru: e.target.value })}
                  placeholder="Название страны"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Bayroq (Emoji)</label>
                <Input
                  value={editingCountry?.flag || ''}
                  onChange={(e) => setEditingCountry({ ...editingCountry, flag: e.target.value })}
                  placeholder="🇺🇸"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tartib raqami</label>
                <Input
                  type="number"
                  value={editingCountry?.display_order || 0}
                  onChange={(e) => setEditingCountry({ ...editingCountry, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">O'rtacha o'qish narxi</label>
                <Input
                  value={editingCountry?.avg_tuition || ''}
                  onChange={(e) => setEditingCountry({ ...editingCountry, avg_tuition: e.target.value })}
                  placeholder="$5,000 - $15,000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Valyuta</label>
                <Input
                  value={editingCountry?.currency || ''}
                  onChange={(e) => setEditingCountry({ ...editingCountry, currency: e.target.value })}
                  placeholder="USD"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Rasm URL</label>
              <Input
                value={editingCountry?.image_url || ''}
                onChange={(e) => setEditingCountry({ ...editingCountry, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Viza / Elchixona sayti</label>
              <Input
                value={editingCountry?.visa_website || ''}
                onChange={(e) => setEditingCountry({ ...editingCountry, visa_website: e.target.value })}
                placeholder="https://embassy.example.com/visa"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Platform Margin % (Profit)</label>
              <Input
                type="number"
                value={editingCountry?.platform_margin_percent ?? 30}
                onChange={(e) => setEditingCountry({ ...editingCountry, platform_margin_percent: parseInt(e.target.value) || 0 })}
                placeholder="30"
                min={0}
                max={200}
              />
              <p className="text-xs text-muted-foreground mt-1">Applied to all university costs in this country</p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingCountry?.is_active || false}
                onCheckedChange={(checked) => setEditingCountry({ ...editingCountry, is_active: checked })}
              />
              <span className="text-sm">Faol holat</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingCountry?.id ? 'Yangilash' : 'Saqlash'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
