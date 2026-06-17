import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Plus,
  Pencil,
  Trash2,
  Award,
  GraduationCap,
  ArrowRightLeft,
  Search,
} from 'lucide-react';

interface Country {
  id: string;
  name: string;
  flag: string | null;
}

interface University {
  id: string;
  name: string;
  country: string;
}

interface Grant {
  id: string;
  country_id: string | null;
  university_id: string | null;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  description: string | null;
  description_uz: string | null;
  description_ru: string | null;
  grant_type: string;
  coverage_type: string;
  coverage_amount: string | null;
  eligibility_criteria: string | null;
  eligibility_criteria_uz: string | null;
  eligibility_criteria_ru: string | null;
  is_transfer_program: boolean | null;
  transfer_from_year: number | null;
  transfer_details: string | null;
  transfer_details_uz: string | null;
  transfer_details_ru: string | null;
  application_deadline: string | null;
  application_url: string | null;
  spots_available: number | null;
  success_rate: string | null;
  is_active: boolean | null;
  display_order: number | null;
}

const GRANT_TYPES = [
  { value: 'bachelor', label: 'Bakalavr', labelRu: 'Бакалавриат', labelEn: 'Bachelor' },
  { value: 'master', label: 'Magistratura', labelRu: 'Магистратура', labelEn: 'Master' },
  { value: 'phd', label: 'Doktorantura', labelRu: 'Докторантура', labelEn: 'PhD' },
  { value: 'transfer', label: 'Transfer', labelRu: 'Перевод', labelEn: 'Transfer' },
];

const COVERAGE_TYPES = [
  { value: 'full', label: "To'liq", labelRu: 'Полное', labelEn: 'Full' },
  { value: 'partial', label: 'Qisman', labelRu: 'Частичное', labelEn: 'Partial' },
  { value: 'tuition_only', label: "Faqat o'qish", labelRu: 'Только обучение', labelEn: 'Tuition Only' },
  { value: 'living_expenses', label: 'Yashash xarajatlari', labelRu: 'Расходы на проживание', labelEn: 'Living Expenses' },
];

export default function AdminGrants() {
  const { language } = useApp();
  const { isSuperAdmin } = useUserRole();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<Grant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    country_id: '',
    university_id: '',
    name: '',
    name_uz: '',
    name_ru: '',
    description: '',
    description_uz: '',
    description_ru: '',
    grant_type: 'bachelor',
    coverage_type: 'partial',
    coverage_amount: '',
    eligibility_criteria: '',
    eligibility_criteria_uz: '',
    eligibility_criteria_ru: '',
    is_transfer_program: false,
    transfer_from_year: 2,
    transfer_details: '',
    transfer_details_uz: '',
    transfer_details_ru: '',
    application_deadline: '',
    application_url: '',
    spots_available: '',
    success_rate: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch grants, countries, universities in parallel
    const [grantsRes, countriesRes, universitiesRes] = await Promise.all([
      supabase.from('grants').select('*').order('display_order'),
      supabase.from('countries').select('id, name, flag').eq('is_active', true).order('name'),
      supabase.from('universities').select('id, name, country').eq('is_active', true).order('name'),
    ]);

    if (grantsRes.data) setGrants(grantsRes.data);
    if (countriesRes.data) setCountries(countriesRes.data);
    if (universitiesRes.data) setUniversities(universitiesRes.data);

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      country_id: '',
      university_id: '',
      name: '',
      name_uz: '',
      name_ru: '',
      description: '',
      description_uz: '',
      description_ru: '',
      grant_type: 'bachelor',
      coverage_type: 'partial',
      coverage_amount: '',
      eligibility_criteria: '',
      eligibility_criteria_uz: '',
      eligibility_criteria_ru: '',
      is_transfer_program: false,
      transfer_from_year: 2,
      transfer_details: '',
      transfer_details_uz: '',
      transfer_details_ru: '',
      application_deadline: '',
      application_url: '',
      spots_available: '',
      success_rate: '',
      is_active: true,
      display_order: 0,
    });
    setEditingGrant(null);
  };

  const openEditDialog = (grant: Grant) => {
    setEditingGrant(grant);
    setFormData({
      country_id: grant.country_id || '',
      university_id: grant.university_id || '',
      name: grant.name,
      name_uz: grant.name_uz || '',
      name_ru: grant.name_ru || '',
      description: grant.description || '',
      description_uz: grant.description_uz || '',
      description_ru: grant.description_ru || '',
      grant_type: grant.grant_type,
      coverage_type: grant.coverage_type,
      coverage_amount: grant.coverage_amount || '',
      eligibility_criteria: grant.eligibility_criteria || '',
      eligibility_criteria_uz: grant.eligibility_criteria_uz || '',
      eligibility_criteria_ru: grant.eligibility_criteria_ru || '',
      is_transfer_program: grant.is_transfer_program || false,
      transfer_from_year: grant.transfer_from_year || 2,
      transfer_details: grant.transfer_details || '',
      transfer_details_uz: grant.transfer_details_uz || '',
      transfer_details_ru: grant.transfer_details_ru || '',
      application_deadline: grant.application_deadline || '',
      application_url: grant.application_url || '',
      spots_available: grant.spots_available?.toString() || '',
      success_rate: grant.success_rate || '',
      is_active: grant.is_active ?? true,
      display_order: grant.display_order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const grantData = {
      country_id: formData.country_id || null,
      university_id: formData.university_id || null,
      name: formData.name,
      name_uz: formData.name_uz || null,
      name_ru: formData.name_ru || null,
      description: formData.description || null,
      description_uz: formData.description_uz || null,
      description_ru: formData.description_ru || null,
      grant_type: formData.grant_type,
      coverage_type: formData.coverage_type,
      coverage_amount: formData.coverage_amount || null,
      eligibility_criteria: formData.eligibility_criteria || null,
      eligibility_criteria_uz: formData.eligibility_criteria_uz || null,
      eligibility_criteria_ru: formData.eligibility_criteria_ru || null,
      is_transfer_program: formData.is_transfer_program,
      transfer_from_year: formData.is_transfer_program ? formData.transfer_from_year : null,
      transfer_details: formData.is_transfer_program ? formData.transfer_details || null : null,
      transfer_details_uz: formData.is_transfer_program ? formData.transfer_details_uz || null : null,
      transfer_details_ru: formData.is_transfer_program ? formData.transfer_details_ru || null : null,
      application_deadline: formData.application_deadline || null,
      application_url: formData.application_url || null,
      spots_available: formData.spots_available ? parseInt(formData.spots_available) : null,
      success_rate: formData.success_rate || null,
      is_active: formData.is_active,
      display_order: formData.display_order,
    };

    if (editingGrant) {
      const { error } = await supabase
        .from('grants')
        .update(grantData)
        .eq('id', editingGrant.id);

      if (error) {
        toast.error('Xatolik yuz berdi');
        return;
      }
      toast.success('Grant yangilandi');
    } else {
      const { error } = await supabase.from('grants').insert(grantData);

      if (error) {
        toast.error('Xatolik yuz berdi');
        return;
      }
      toast.success("Grant qo'shildi");
    }

    setIsDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Grantni o'chirishni xohlaysizmi?")) return;

    const { error } = await supabase.from('grants').delete().eq('id', id);

    if (error) {
      toast.error('Xatolik yuz berdi');
      return;
    }

    toast.success("Grant o'chirildi");
    fetchData();
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('grants')
      .update({ is_active: !currentValue })
      .eq('id', id);

    if (!error) {
      fetchData();
    }
  };

  const getGrantTypeLabel = (type: string) => {
    const found = GRANT_TYPES.find((t) => t.value === type);
    return language === 'uz' ? found?.label : language === 'ru' ? found?.labelRu : found?.labelEn;
  };

  const getCoverageLabel = (type: string) => {
    const found = COVERAGE_TYPES.find((t) => t.value === type);
    return language === 'uz' ? found?.label : language === 'ru' ? found?.labelRu : found?.labelEn;
  };

  const getCountryName = (countryId: string | null) => {
    if (!countryId) return '-';
    const country = countries.find((c) => c.id === countryId);
    return country ? `${country.flag || ''} ${country.name}` : '-';
  };

  const filteredGrants = grants.filter((grant) => {
    const matchesSearch = grant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = !filterCountry || grant.country_id === filterCountry;
    const matchesType = !filterType || grant.grant_type === filterType;
    return matchesSearch && matchesCountry && matchesType;
  });

  const filteredUniversities = formData.country_id
    ? universities.filter((u) => {
        const country = countries.find((c) => c.id === formData.country_id);
        return country && u.country === country.name;
      })
    : universities;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-7 h-7 text-primary" />
            {language === 'uz' ? 'Grantlar' : language === 'ru' ? 'Гранты' : 'Grants'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'uz'
              ? "Grant dasturlarini boshqaring"
              : language === 'ru'
              ? 'Управляйте грантовыми программами'
              : 'Manage grant programs'}
          </p>
        </div>

        {isSuperAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {language === 'uz' ? "Grant qo'shish" : language === 'ru' ? 'Добавить грант' : 'Add Grant'}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGrant
                  ? language === 'uz' ? 'Grantni tahrirlash' : language === 'ru' ? 'Редактировать грант' : 'Edit Grant'
                  : language === 'uz' ? "Yangi grant qo'shish" : language === 'ru' ? 'Добавить новый грант' : 'Add New Grant'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Davlat</Label>
                  <Select value={formData.country_id} onValueChange={(val) => setFormData({ ...formData, country_id: val, university_id: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Davlatni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.flag} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Universitet (ixtiyoriy)</Label>
                  <Select value={formData.university_id || "none"} onValueChange={(val) => setFormData({ ...formData, university_id: val === "none" ? "" : val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Universitetni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Barchasi</SelectItem>
                      {filteredUniversities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grant Names */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nomi (EN) *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Nomi (UZ)</Label>
                  <Input
                    value={formData.name_uz}
                    onChange={(e) => setFormData({ ...formData, name_uz: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nomi (RU)</Label>
                  <Input
                    value={formData.name_ru}
                    onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                  />
                </div>
              </div>

              {/* Grant Type & Coverage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Grant turi</Label>
                  <Select value={formData.grant_type} onValueChange={(val) => setFormData({ ...formData, grant_type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRANT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === 'uz' ? type.label : language === 'ru' ? type.labelRu : type.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Qoplash turi</Label>
                  <Select value={formData.coverage_type} onValueChange={(val) => setFormData({ ...formData, coverage_type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COVERAGE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === 'uz' ? type.label : language === 'ru' ? type.labelRu : type.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Qoplash miqdori</Label>
                  <Input
                    value={formData.coverage_amount}
                    onChange={(e) => setFormData({ ...formData, coverage_amount: e.target.value })}
                    placeholder="100% yoki $10,000/yil"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Tavsif (EN)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Eligibility */}
              <div>
                <Label>Talablar (EN)</Label>
                <Textarea
                  value={formData.eligibility_criteria}
                  onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                  rows={3}
                  placeholder="GPA 3.5+, IELTS 6.5+, ..."
                />
              </div>

              {/* Transfer Program */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_transfer_program}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_transfer_program: checked })}
                  />
                  <Label className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4" />
                    Transfer dasturi
                  </Label>
                </div>

                {formData.is_transfer_program && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label>Nechanchi kursdan transfer</Label>
                      <Select
                        value={formData.transfer_from_year.toString()}
                        onValueChange={(val) => setFormData({ ...formData, transfer_from_year: parseInt(val) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1-kursdan</SelectItem>
                          <SelectItem value="2">2-kursdan</SelectItem>
                          <SelectItem value="3">3-kursdan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Transfer tafsilotlari</Label>
                      <Input
                        value={formData.transfer_details}
                        onChange={(e) => setFormData({ ...formData, transfer_details: e.target.value })}
                        placeholder="O'zbekistondagi universitetlardan..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Application Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Ariza muddati</Label>
                  <Input
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ariza linki</Label>
                  <Input
                    type="url"
                    value={formData.application_url}
                    onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>O'rinlar soni</Label>
                  <Input
                    type="number"
                    value={formData.spots_available}
                    onChange={(e) => setFormData({ ...formData, spots_available: e.target.value })}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Faol</Label>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Bekor qilish
                </Button>
                <Button type="submit">
                  {editingGrant ? 'Saqlash' : "Qo'shish"}
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Qidirish..."
            className="pl-10"
          />
        </div>
        <Select value={filterCountry || "all"} onValueChange={(val) => setFilterCountry(val === "all" ? "" : val)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Davlat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.flag} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType || "all"} onValueChange={(val) => setFilterType(val === "all" ? "" : val)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {GRANT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {language === 'uz' ? t.label : language === 'ru' ? t.labelRu : t.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
        ) : filteredGrants.length === 0 ? (
          <div className="p-8 text-center">
            <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Grantlar topilmadi</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>Davlat</TableHead>
                <TableHead>Turi</TableHead>
                <TableHead>Qoplash</TableHead>
                <TableHead>Transfer</TableHead>
                <TableHead>Holati</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Amallar</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell className="font-medium">{grant.name}</TableCell>
                  <TableCell>{getCountryName(grant.country_id)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {getGrantTypeLabel(grant.grant_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={grant.coverage_type === 'full' ? 'default' : 'secondary'}>
                      {getCoverageLabel(grant.coverage_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {grant.is_transfer_program ? (
                      <Badge variant="outline" className="gap-1 text-primary border-primary">
                        <ArrowRightLeft className="w-3 h-3" />
                        {grant.transfer_from_year}-kurs
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={grant.is_active ?? true}
                      disabled={!isSuperAdmin}
                      onCheckedChange={() => toggleActive(grant.id, grant.is_active ?? true)}
                    />
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(grant)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(grant.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
