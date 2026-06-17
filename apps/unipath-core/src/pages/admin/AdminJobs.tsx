import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Briefcase, BadgeCheck, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  company_name: string;
  country: string;
  city: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  working_hours: string | null;
  job_type: string;
  language_requirement: string | null;
  required_documents: string[] | null;
  description: string | null;
  employer_contact: string | null;
  is_verified: boolean;
  is_active: boolean;
}

const emptyJob = {
  title: '', company_name: '', country: '', city: '', salary_min: '', salary_max: '', currency: 'USD',
  working_hours: '', job_type: 'part-time', language_requirement: '', description: '', employer_contact: '',
  is_verified: false, is_active: true, required_documents: '',
};

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState(emptyJob);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchJobs = async () => {
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    setJobs((data as Job[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyJob);
    setDialogOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditing(job);
    setForm({
      title: job.title, company_name: job.company_name, country: job.country, city: job.city,
      salary_min: job.salary_min?.toString() || '', salary_max: job.salary_max?.toString() || '',
      currency: job.currency, working_hours: job.working_hours || '', job_type: job.job_type,
      language_requirement: job.language_requirement || '', description: job.description || '',
      employer_contact: job.employer_contact || '', is_verified: job.is_verified, is_active: job.is_active,
      required_documents: (job.required_documents || []).join(', '),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.company_name || !form.country || !form.city) {
      toast.error('Please fill required fields');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      company_name: form.company_name,
      country: form.country,
      city: form.city,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
      currency: form.currency,
      working_hours: form.working_hours || null,
      job_type: form.job_type,
      language_requirement: form.language_requirement || null,
      description: form.description || null,
      employer_contact: form.employer_contact || null,
      is_verified: form.is_verified,
      is_active: form.is_active,
      required_documents: form.required_documents ? form.required_documents.split(',').map(d => d.trim()).filter(Boolean) : null,
    };

    if (editing) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', editing.id);
      if (error) toast.error(error.message); else toast.success('Job updated');
    } else {
      const { error } = await supabase.from('jobs').insert(payload);
      if (error) toast.error(error.message); else toast.success('Job created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchJobs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job listing?')) return;
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); fetchJobs(); }
  };

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company_name.toLowerCase().includes(search.toLowerCase()) ||
    j.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Listings</h1>
          <p className="text-muted-foreground">{jobs.length} total jobs</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Job</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search jobs..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Job</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Location</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(job => (
                  <tr key={job.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{job.title}</p>
                          <p className="text-sm text-muted-foreground">{job.company_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{job.city}, {job.country}</td>
                    <td className="p-4"><Badge variant="outline">{job.job_type}</Badge></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {job.is_verified && <Badge variant="secondary" className="gap-1"><BadgeCheck className="w-3 h-3" /> Verified</Badge>}
                        <Badge variant={job.is_active ? 'default' : 'outline'}>{job.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(job)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(job.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Job' : 'Add New Job'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Job Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Company Name *</Label><Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Country *</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
              <div><Label>City *</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Min Salary</Label><Input type="number" value={form.salary_min} onChange={e => setForm(p => ({ ...p, salary_min: e.target.value }))} /></div>
              <div><Label>Max Salary</Label><Input type="number" value={form.salary_max} onChange={e => setForm(p => ({ ...p, salary_max: e.target.value }))} /></div>
              <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Working Hours</Label><Input value={form.working_hours} onChange={e => setForm(p => ({ ...p, working_hours: e.target.value }))} placeholder="e.g., 20 hrs/week" /></div>
              <div>
                <Label>Job Type</Label>
                <Select value={form.job_type} onValueChange={v => setForm(p => ({ ...p, job_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="weekend">Weekend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Language Requirement</Label><Input value={form.language_requirement} onChange={e => setForm(p => ({ ...p, language_requirement: e.target.value }))} /></div>
              <div><Label>Employer Contact</Label><Input value={form.employer_contact} onChange={e => setForm(p => ({ ...p, employer_contact: e.target.value }))} /></div>
            </div>
            <div><Label>Required Documents (comma separated)</Label><Input value={form.required_documents} onChange={e => setForm(p => ({ ...p, required_documents: e.target.value }))} placeholder="Resume, Work Permit" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_verified} onCheckedChange={v => setForm(p => ({ ...p, is_verified: v }))} />
                <Label>UniPath Verified</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editing ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
