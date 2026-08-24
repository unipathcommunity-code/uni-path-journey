import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, ArrowRight, Loader2, Mail, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AutoApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUniversity: any;
  tenantId: string;
  brandColor?: string;
}

export function AutoApplyModal({
  isOpen,
  onClose,
  targetUniversity,
  tenantId,
  brandColor = '#10b981'
}: AutoApplyModalProps) {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. SignUp user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            tenant_id: tenantId,
            role: 'student'
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
           throw new Error("Bu email orqali avval ro'yxatdan o'tilgan. Iltimos, 'Kirish' tugmasi orqali kiring.");
        }
        throw authError;
      }

      // 2. Create Application record
      // The user might be created, but let's wait a second for triggers to run and create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      const userId = authData?.user?.id;
      if (userId) {
        // Try creating an application
        const { error: appError } = await supabase.from('applications').insert({
          user_id: userId,
          tenant_id: tenantId,
          university_id: targetUniversity?.id,
          status: 'new'
        });
        
        if (appError) {
          console.warn('Failed to create application auto:', appError);
        }
      }

      setStep('success');
      
      // Auto redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error('AutoApply Error:', err);
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            disabled={loading || step === 'success'}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {step === 'form' ? (
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${brandColor}22` }}
                >
                  <ArrowRight className="w-6 h-6" style={{ color: brandColor }} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Hujjat topshirish
                </h3>
                <p className="text-sm text-white/60">
                  {targetUniversity?.name} uchun ariza qoldiring. Kabinetingiz avtomatik yaratiladi.
                </p>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">F.I.Sh</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="To'liq ismingiz"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Sizning emailingiz"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Yangi Parol</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Kabinet uchun parol o'rnating"
                      minLength={6}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-6 mt-4 rounded-xl font-bold"
                  style={{ backgroundColor: brandColor, color: '#fff' }}
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Yaratilmoqda...</>
                  ) : (
                    "Arizani yuborish"
                  )}
                </Button>
                <p className="text-center text-xs text-white/40 mt-4">
                  Ariza yuborish orqali siz platforma qoidalariga rozi bo'lasiz.
                </p>
              </form>
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ background: `${brandColor}22` }}
              >
                <CheckCircle2 className="w-10 h-10" style={{ color: brandColor }} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Ajoyib!
              </h3>
              <p className="text-white/60 text-sm mb-8">
                Sizning arizangiz muvaffaqiyatli qabul qilindi. Shaxsiy kabinetingizga yo'naltirilmoqdasiz...
              </p>
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: brandColor, borderTopColor: 'transparent' }} />
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
