import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Building2 } from "lucide-react";

export function AssignAdminModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTenants();
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setTenantId('');
    }
  }, [isOpen]);

  const fetchTenants = async () => {
    const { data } = await supabase.from('tenants').select('id, name, subdomain').order('name');
    if (data) setTenants(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !tenantId) {
      toast({ title: 'Xatolik', description: 'Barcha maydonlarni to\'ldiring', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // 1. Check if user already exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        // User exists -> update their role to owner and assign tenant
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: 'owner',
            tenant_id: tenantId,
            full_name: name
          })
          .eq('id', existingProfile.id);

        if (updateError) throw updateError;
        
        toast({ title: 'Muvaffaqiyatli', description: 'Mavjud foydalanuvchiga admin huquqi berildi!' });
      } else {
        // User does not exist -> Create new Auth User
        const tempClient = createClient(
          import.meta.env.VITE_SUPABASE_URL || "https://bpokyebvwhigpjrembcg.supabase.co",
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU",
          { auth: { persistSession: false } }
        );

        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: name,
              tenant_id: tenantId,
              role: 'owner'
            }
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            // It exists in Auth but not in profiles? We can't link without an edge function.
            throw new Error('Bu email avval ro\'yxatdan o\'tgan. Lekin profil topilmadi. Boshqa email ishlating yoki bazani tozalang.');
          }
          throw authError;
        }

        // Wait a bit for trigger to insert into profiles
        await new Promise(r => setTimeout(r, 1000));
        
        // Update profile just in case trigger missed something
        if (authData?.user?.id) {
          await supabase.from('profiles').update({
            role: 'owner',
            tenant_id: tenantId,
            full_name: name
          }).eq('user_id', authData.user.id);
        }

        toast({ title: 'Muvaffaqiyatli', description: 'Yangi admin muvaffaqiyatli yaratildi va biriktirildi!' });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Admin Tayinlash (Firmaga biriktirish)</DialogTitle>
          <DialogDescription className="text-white/60">
            Yangi email yozsangiz yangi admin yaratiladi. Mavjud email yozsangiz unga admin huquqi beriladi.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/70">Firma (Agentlik)</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none appearance-none"
              >
                <option value="" className="bg-[#0f172a]">-- Firmani tanlang --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#0f172a]">{t.name} ({t.subdomain})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/70">F.I.Sh.</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Falonchi Pistonchiyev"
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/70">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@firma.uz"
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/70">Parol</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="text"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                minLength={6}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <p className="text-[10px] text-white/40">Mavjud foydalanuvchilar uchun bu parol ishlamasligi mumkin (ular o'zlarining eski parollari orqali kirishadi).</p>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Bekor qilish</Button>
            <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-black">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tayinlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
