import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  MapPin,
  Users,
  DollarSign,
  Award,
  Loader2,
  Globe,
  Save,
} from 'lucide-react';

interface University {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  country: string;
  city: string | null;
  description: string | null;
  description_uz: string | null;
  description_ru: string | null;
  images: string[] | null;
  ranking: number | null;
  tuition_min: number | null;
  tuition_max: number | null;
  currency: string | null;
  scholarship_available: boolean | null;
  intake_spring: boolean | null;
  intake_fall: boolean | null;
  programs: string[] | null;
  students_total: number | null;
  students_international: number | null;
  students_uzbek: number | null;
  students_local: number | null;
  website: string | null;
  is_active: boolean | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  application_fee: number | null;
  required_documents: string[] | null;
  credit_cost: number;
}

interface DbCountry {
  id: string;
  name: string;
  flag: string | null;
  is_active: boolean | null;
}

const countryFlags: Record<string, string> = {
  'South Korea': '🇰🇷',
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'USA': '🇺🇸',
  'Germany': '🇩🇪',
  'Poland': '🇵🇱',
  'Turkey': '🇹🇷',
  'Czech Republic': '🇨🇿',
  'Malaysia': '🇲🇾',
  'UAE': '🇦🇪',
  'Georgia': '🇬🇪',
  'Hungary': '🇭🇺',
  'Russia': '🇷🇺',
  'UK': '🇬🇧',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
  'Spain': '🇪🇸',
  'Netherlands': '🇳🇱',
};

// Validation schema for university
const universitySchema = z.object({
  name: z.string().min(1, "Universitet nomi kiritilishi shart").max(200, "Nom 200 ta belgidan oshmasligi kerak"),
  name_uz: z.string().max(200).optional().nullable(),
  name_ru: z.string().max(200).optional().nullable(),
  country: z.string().min(1, "Davlat tanlanishi shart"),
  city: z.string().max(100).optional().nullable(),
  description: z.string().max(5000, "Tavsif 5000 ta belgidan oshmasligi kerak").optional().nullable(),
  description_uz: z.string().max(5000).optional().nullable(),
  description_ru: z.string().max(5000).optional().nullable(),
  ranking: z.number().min(1, "Reyting 1 dan kichik bo'lmasligi kerak").max(10000, "Reyting 10000 dan katta bo'lmasligi kerak").optional().nullable(),
  tuition_min: z.number().min(0, "Minimal o'qish narxi 0 dan kichik bo'lmasligi kerak").optional().nullable(),
  tuition_max: z.number().min(0, "Maksimal o'qish narxi 0 dan kichik bo'lmasligi kerak").optional().nullable(),
  currency: z.string().max(10).optional().nullable(),
  website: z.string().url("Noto'g'ri URL formati").or(z.literal('')).optional().nullable(),
  students_total: z.number().min(0).optional().nullable(),
  students_international: z.number().min(0).optional().nullable(),
  students_uzbek: z.number().min(0).optional().nullable(),
  students_local: z.number().min(0).optional().nullable(),
  scholarship_available: z.boolean().optional().nullable(),
  intake_spring: z.boolean().optional().nullable(),
  intake_fall: z.boolean().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
});

const emptyUniversity: Partial<University> = {
  name: '',
  name_uz: '',
  name_ru: '',
  country: 'South Korea',
  city: '',
  description: '',
  description_uz: '',
  description_ru: '',
  images: [],
  ranking: null,
  tuition_min: null,
  tuition_max: null,
  currency: 'USD',
  scholarship_available: false,
  intake_spring: true,
  intake_fall: true,
  programs: [],
  students_total: null,
  students_international: null,
  students_uzbek: null,
  students_local: null,
  website: '',
  is_active: true,
  latitude: null,
  longitude: null,
  application_fee: null,
  required_documents: [],
  credit_cost: 5,
};

export default function AdminUniversities() {
  const { isSuperAdmin } = useUserRole();
  const [universities, setUniversities] = useState<University[]>([]);
  const [countries, setCountries] = useState<DbCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<Partial<University> | null>(null);
  const [saving, setSaving] = useState(false);
  const [programsInput, setProgramsInput] = useState('');
  const [imagesInput, setImagesInput] = useState('');
  const [requiredDocsInput, setRequiredDocsInput] = useState('');

  useEffect(() => {
    fetchUniversities();
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    const { data, error } = await supabase
      .from('countries')
      .select('id, name, flag, is_active')
      .order('display_order', { ascending: true });
    
    if (!error && data) {
      setCountries(data as DbCountry[]);
    }
  };

  const fetchUniversities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error('Failed to fetch universities');
    } else {
      setUniversities((data || []) as University[]);
    }
    setLoading(false);
  };

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         uni.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         uni.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = countryFilter === 'all' || uni.country === countryFilter;
    return matchesSearch && matchesCountry;
  });


  const openCreateModal = () => {
    setEditingUniversity({ ...emptyUniversity });
    setProgramsInput('');
    setImagesInput('');
    setRequiredDocsInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (uni: University) => {
    setEditingUniversity({ ...uni });
    setProgramsInput(uni.programs?.join(', ') || '');
    setImagesInput(uni.images?.join('\n') || '');
    setRequiredDocsInput(uni.required_documents?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    // Validate using zod schema
    const validationResult = universitySchema.safeParse({
      name: editingUniversity?.name || '',
      name_uz: editingUniversity?.name_uz,
      name_ru: editingUniversity?.name_ru,
      country: editingUniversity?.country || '',
      city: editingUniversity?.city,
      description: editingUniversity?.description,
      description_uz: editingUniversity?.description_uz,
      description_ru: editingUniversity?.description_ru,
      ranking: editingUniversity?.ranking,
      tuition_min: editingUniversity?.tuition_min,
      tuition_max: editingUniversity?.tuition_max,
      currency: editingUniversity?.currency,
      website: editingUniversity?.website || '',
      students_total: editingUniversity?.students_total,
      students_international: editingUniversity?.students_international,
      students_uzbek: editingUniversity?.students_uzbek,
      students_local: editingUniversity?.students_local,
      scholarship_available: editingUniversity?.scholarship_available,
      intake_spring: editingUniversity?.intake_spring,
      intake_fall: editingUniversity?.intake_fall,
      is_active: editingUniversity?.is_active,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    // Additional validation: tuition_max should be >= tuition_min
    if (editingUniversity?.tuition_min && editingUniversity?.tuition_max) {
      if (editingUniversity.tuition_max < editingUniversity.tuition_min) {
        toast.error("Maksimal o'qish narxi minimal narxdan kichik bo'lmasligi kerak");
        return;
      }
    }

    setSaving(true);
    
    const dataToSave = {
      ...editingUniversity,
      programs: programsInput.split(',').map(p => p.trim()).filter(p => p),
      images: imagesInput.split('\n').map(i => i.trim()).filter(i => i),
      required_documents: requiredDocsInput.split(',').map(d => d.trim()).filter(d => d),
    };

    if (editingUniversity?.id) {
      // Update existing
      const { id, created_at, ...updateData } = dataToSave as University;
      const { error } = await supabase
        .from('universities')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        toast.error('Universitetni yangilashda xatolik');
      } else {
        toast.success('Universitet muvaffaqiyatli yangilandi');
        setIsModalOpen(false);
        fetchUniversities();
      }
    } else {
      // Create new
      const { id, created_at, ...insertData } = dataToSave as University;
      const { error } = await supabase
        .from('universities')
        .insert([{ ...insertData, country: insertData.country || 'South Korea' }]);
      
      if (error) {
        toast.error('Universitet qo\'shishda xatolik');
      } else {
        toast.success('Universitet muvaffaqiyatli qo\'shildi');
        setIsModalOpen(false);
        fetchUniversities();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this university?')) return;
    
    const { error } = await supabase
      .from('universities')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete university');
    } else {
      toast.success('University deleted');
      fetchUniversities();
    }
  };

  const toggleActive = async (uni: University) => {
    const { error } = await supabase
      .from('universities')
      .update({ is_active: !uni.is_active })
      .eq('id', uni.id);
    
    if (error) {
      toast.error('Failed to update status');
    } else {
      fetchUniversities();
    }
  };

  const uniqueCountries = [...new Set(universities.map(u => u.country))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Universities</h1>
          <p className="text-muted-foreground">Manage university listings</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" />
            Add University
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <GraduationCap className="w-8 h-8 text-primary mb-2" />
          <p className="text-2xl font-bold">{universities.length}</p>
          <p className="text-sm text-muted-foreground">Total Universities</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <Globe className="w-8 h-8 text-success mb-2" />
          <p className="text-2xl font-bold">{uniqueCountries.length}</p>
          <p className="text-sm text-muted-foreground">Countries</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <Award className="w-8 h-8 text-warning mb-2" />
          <p className="text-2xl font-bold">{universities.filter(u => u.scholarship_available).length}</p>
          <p className="text-sm text-muted-foreground">With Scholarships</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <Users className="w-8 h-8 text-primary mb-2" />
          <p className="text-2xl font-bold">
            {universities.reduce((sum, u) => sum + (u.students_uzbek || 0), 0)}
          </p>
          <p className="text-sm text-muted-foreground">Uzbek Students</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search universities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {uniqueCountries.map(country => (
              <SelectItem key={country} value={country}>
                {countryFlags[country] || '🌍'} {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <th className="text-left p-4 font-medium text-muted-foreground">University</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Location</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Students</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">Tuition</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">UniCoin</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  {isSuperAdmin && <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUniversities.map((uni) => (
                  <tr key={uni.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{countryFlags[uni.country] || '🌍'}</span>
                        <div>
                          <p className="font-medium text-foreground">{uni.name}</p>
                          {uni.ranking && (
                            <Badge variant="secondary" className="text-xs">
                              #{uni.ranking} Ranking
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {uni.city ? `${uni.city}, ${uni.country}` : uni.country}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Total:</span> {uni.students_total?.toLocaleString() || 'N/A'}</p>
                        <p><span className="text-muted-foreground">Uzbek:</span> {uni.students_uzbek?.toLocaleString() || 0}</p>
                        <p><span className="text-muted-foreground">Int'l:</span> {uni.students_international?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        {uni.tuition_min && uni.tuition_max 
                          ? `$${uni.tuition_min.toLocaleString()} - $${uni.tuition_max.toLocaleString()}`
                          : 'N/A'}
                      </div>
                      {uni.scholarship_available && (
                        <Badge className="mt-1 bg-primary/10 text-primary border-0 text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          Scholarship
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={uni.credit_cost > 1 ? 'default' : 'secondary'} className="text-xs">
                        {uni.credit_cost} UniCoin
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={uni.is_active || false}
                          disabled={!isSuperAdmin}
                          onCheckedChange={() => toggleActive(uni)}
                        />
                        <span className={uni.is_active ? 'text-success' : 'text-muted-foreground'}>
                          {uni.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(uni)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(uni.id)}
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
          
          {filteredUniversities.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No universities found
            </div>
          )}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUniversity?.id ? 'Edit University' : 'Add New University'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Name (English) *</label>
                <Input
                  value={editingUniversity?.name || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, name: e.target.value })}
                  placeholder="University name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Name (Uzbek)</label>
                <Input
                  value={editingUniversity?.name_uz || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, name_uz: e.target.value })}
                  placeholder="Universitet nomi"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Name (Russian)</label>
                <Input
                  value={editingUniversity?.name_ru || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, name_ru: e.target.value })}
                  placeholder="Название университета"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Country *</label>
                <Select
                  value={editingUniversity?.country || 'South Korea'}
                  onValueChange={(value) => setEditingUniversity({ ...editingUniversity, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.flag || '🌍'} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">City</label>
                <Input
                  value={editingUniversity?.city || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, city: e.target.value })}
                  placeholder="e.g. Seoul"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-1 block">Description (English)</label>
              <Textarea
                value={editingUniversity?.description || ''}
                onChange={(e) => setEditingUniversity({ ...editingUniversity, description: e.target.value })}
                placeholder="About the university..."
                rows={3}
              />
            </div>

            {/* Students */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Total Students</label>
                <Input
                  type="number"
                  value={editingUniversity?.students_total || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, students_total: Number(e.target.value) || null })}
                  placeholder="e.g. 28000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">International</label>
                <Input
                  type="number"
                  value={editingUniversity?.students_international || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, students_international: Number(e.target.value) || null })}
                  placeholder="e.g. 3500"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Uzbek Students</label>
                <Input
                  type="number"
                  value={editingUniversity?.students_uzbek || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, students_uzbek: Number(e.target.value) || null })}
                  placeholder="e.g. 120"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Local Students</label>
                <Input
                  type="number"
                  value={editingUniversity?.students_local || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, students_local: Number(e.target.value) || null })}
                  placeholder="e.g. 24000"
                />
              </div>
            </div>

            {/* Tuition & Ranking */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tuition Min (USD)</label>
                <Input
                  type="number"
                  value={editingUniversity?.tuition_min || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, tuition_min: Number(e.target.value) || null })}
                  placeholder="e.g. 4000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tuition Max (USD)</label>
                <Input
                  type="number"
                  value={editingUniversity?.tuition_max || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, tuition_max: Number(e.target.value) || null })}
                  placeholder="e.g. 8000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">World Ranking</label>
                <Input
                  type="number"
                  value={editingUniversity?.ranking || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, ranking: Number(e.target.value) || null })}
                  placeholder="e.g. 29"
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingUniversity?.scholarship_available || false}
                  onCheckedChange={(checked) => setEditingUniversity({ ...editingUniversity, scholarship_available: checked })}
                />
                <span className="text-sm">Scholarship Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingUniversity?.intake_spring || false}
                  onCheckedChange={(checked) => setEditingUniversity({ ...editingUniversity, intake_spring: checked })}
                />
                <span className="text-sm">Spring Intake</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingUniversity?.intake_fall || false}
                  onCheckedChange={(checked) => setEditingUniversity({ ...editingUniversity, intake_fall: checked })}
                />
                <span className="text-sm">Fall Intake</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingUniversity?.is_active || false}
                  onCheckedChange={(checked) => setEditingUniversity({ ...editingUniversity, is_active: checked })}
                />
                <span className="text-sm">Active</span>
              </div>
            </div>

            {/* Application Fee & Credit Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Ariza to'lovi (USD)</label>
                <Input
                  type="number"
                  value={editingUniversity?.application_fee || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, application_fee: Number(e.target.value) || null })}
                  placeholder="masalan: 50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">UniCoin narxi (UniCoin Cost)</label>
                <Input
                  type="number"
                  min="1"
                  value={(editingUniversity as any)?.credit_cost || 1}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, credit_cost: Number(e.target.value) || 1 } as any)}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground mt-1">Ariza uchun nechta UniCoin kerak (1, 2, 3, 5...)</p>
              </div>
            </div>

            {/* Required Documents */}
            <div>
              <label className="text-sm font-medium mb-1 block">Kerakli hujjatlar</label>
              <div className="space-y-2">
                {(requiredDocsInput ? requiredDocsInput.split(',').map(d => d.trim()).filter(d => d) : []).map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={doc}
                      onChange={(e) => {
                        const docs = requiredDocsInput.split(',').map(d => d.trim()).filter(d => d);
                        docs[idx] = e.target.value;
                        setRequiredDocsInput(docs.join(', '));
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => {
                        const docs = requiredDocsInput.split(',').map(d => d.trim()).filter(d => d);
                        docs.splice(idx, 1);
                        setRequiredDocsInput(docs.join(', '));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    const docs = requiredDocsInput ? requiredDocsInput.split(',').map(d => d.trim()).filter(d => d) : [];
                    docs.push('Yangi hujjat');
                    setRequiredDocsInput(docs.join(', '));
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Hujjat qo'shish
                </Button>
              </div>
            </div>

            {/* Location (Lat/Lng) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Latitude (Kenglik)</label>
                <Input
                  type="number"
                  step="any"
                  value={editingUniversity?.latitude || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, latitude: Number(e.target.value) || null })}
                  placeholder="masalan: 37.5665"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Longitude (Uzunlik)</label>
                <Input
                  type="number"
                  step="any"
                  value={editingUniversity?.longitude || ''}
                  onChange={(e) => setEditingUniversity({ ...editingUniversity, longitude: Number(e.target.value) || null })}
                  placeholder="masalan: 126.9780"
                />
              </div>
            </div>

            {/* Programs */}
            <div>
              <label className="text-sm font-medium mb-1 block">Programs (comma separated)</label>
              <Textarea
                value={programsInput}
                onChange={(e) => setProgramsInput(e.target.value)}
                placeholder="Computer Science, Engineering, Business, Medicine"
                rows={2}
              />
            </div>

            {/* Images */}
            <div>
              <label className="text-sm font-medium mb-1 block">Image URLs (one per line)</label>
              <Textarea
                value={imagesInput}
                onChange={(e) => setImagesInput(e.target.value)}
                placeholder="https://example.com/image1.jpg"
                rows={2}
              />
            </div>

            {/* Website */}
            <div>
              <label className="text-sm font-medium mb-1 block">Website</label>
              <Input
                value={editingUniversity?.website || ''}
                onChange={(e) => setEditingUniversity({ ...editingUniversity, website: e.target.value })}
                placeholder="https://university.edu"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingUniversity?.id ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
