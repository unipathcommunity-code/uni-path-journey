import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Unlock, Briefcase, Home, Plane } from 'lucide-react';
import { toast } from 'sonner';

const FEATURES = [
  { key: 'jobs', label: 'Ish qidirish (Jobs)', icon: Briefcase },
  { key: 'housing', label: 'Turar joy (Housing)', icon: Home },
  { key: 'arrival_preparation', label: 'Kelishga tayyorgarlik', icon: Plane },
];

interface FeatureOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    user_id: string;
    full_name: string | null;
  } | null;
}

export function FeatureOverrideDialog({ open, onOpenChange, student }: FeatureOverrideDialogProps) {
  const { user: adminUser } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !student) return;
    fetchOverrides();
  }, [open, student]);

  async function fetchOverrides() {
    if (!student) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('student_feature_overrides')
      .select('feature_key, is_unlocked')
      .eq('user_id', student.user_id);

    if (!error && data) {
      const map: Record<string, boolean> = {};
      data.forEach((row: any) => {
        map[row.feature_key] = row.is_unlocked;
      });
      setOverrides(map);
    }
    setLoading(false);
  }

  async function toggleFeature(featureKey: string, newValue: boolean) {
    if (!student || !adminUser) return;
    setSaving(featureKey);

    const { error } = await supabase
      .from('student_feature_overrides')
      .upsert(
        {
          user_id: student.user_id,
          feature_key: featureKey,
          is_unlocked: newValue,
          overridden_by: adminUser.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,feature_key' }
      );

    if (error) {
      console.error('Error toggling feature:', error);
      toast.error('Xatolik yuz berdi');
    } else {
      setOverrides((prev) => ({ ...prev, [featureKey]: newValue }));
      toast.success(
        newValue
          ? `${featureKey} ochildi ✅`
          : `${featureKey} qulflandi 🔒`
      );
    }
    setSaving(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Xususiyatlarni boshqarish
          </DialogTitle>
          {student && (
            <p className="text-sm text-muted-foreground">
              {student.full_name || 'Talaba'} uchun
            </p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Avtomatik qulflash tizimini bekor qilib, xususiyatlarni qo'lda ochish yoki qulflash mumkin.
            </p>
            {FEATURES.map((feature) => {
              const isUnlocked = overrides[feature.key] === true;
              const isSaving = saving === feature.key;

              return (
                <div
                  key={feature.key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    isUnlocked
                      ? 'border-success/30 bg-success/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isUnlocked ? 'bg-success/10' : 'bg-muted'
                      }`}
                    >
                      {isUnlocked ? (
                        <Unlock className="w-5 h-5 text-success" />
                      ) : (
                        <feature.icon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{feature.label}</Label>
                      <p className="text-xs text-muted-foreground">
                        {isUnlocked ? 'Ochiq (admin tomonidan)' : 'Avtomatik rejim'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    <Switch
                      checked={isUnlocked}
                      onCheckedChange={(val) => toggleFeature(feature.key, val)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
