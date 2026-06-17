import { useState } from 'react';
import { X, MapPin, Lock, Building2 } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

interface AddBranchModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddBranchModal({ open, onClose }: AddBranchModalProps) {
  const { language } = useApp();
  const { addBranch, isSaving, canAddMore, maxBranches, branchCount } = useBranches();

  const [form, setForm] = useState({ name: '', city: '', address: '' });

  if (!open) return null;

  const t = {
    title:   language === 'ru' ? 'Новый филиал'       : language === 'uz' ? 'Yangi filial'       : 'New Branch',
    name:    language === 'ru' ? 'Название филиала'   : language === 'uz' ? 'Filial nomi'        : 'Branch name',
    city:    language === 'ru' ? 'Город'              : language === 'uz' ? 'Shahar'             : 'City',
    address: language === 'ru' ? 'Адрес (необяз.)'   : language === 'uz' ? 'Manzil (ixtiyoriy)' : 'Address (optional)',
    save:    language === 'ru' ? 'Сохранить'          : language === 'uz' ? 'Saqlash'            : 'Save',
    cancel:  language === 'ru' ? 'Отмена'             : language === 'uz' ? 'Bekor qilish'       : 'Cancel',
    limitTitle: language === 'ru'
      ? `Достигнут лимит филиалов (${branchCount}/${maxBranches === Infinity ? '∞' : maxBranches})`
      : language === 'uz'
      ? `Filial chegarasiga yetildi (${branchCount}/${maxBranches === Infinity ? '∞' : maxBranches})`
      : `Branch limit reached (${branchCount}/${maxBranches === Infinity ? '∞' : maxBranches})`,
    limitDesc: language === 'ru'
      ? 'Обновите тариф, чтобы добавить больше филиалов.'
      : language === 'uz'
      ? 'Ko\'proq filial qo\'shish uchun tarifni yangilang.'
      : 'Upgrade your plan to add more branches.',
    upgradeBtn: language === 'ru' ? 'Обновить тариф' : language === 'uz' ? 'Tarifni yangilash' : 'Upgrade Plan',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) return;
    try {
      await addBranch({
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim() || undefined,
      });
      toast.success(
        language === 'ru' ? 'Филиал добавлен!' :
        language === 'uz' ? 'Filial qo\'shildi!' : 'Branch added!'
      );
      setForm({ name: '', city: '', address: '' });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">{t.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {!canAddMore ? (
            /* Locked state */
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7 text-violet-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t.limitTitle}</p>
                <p className="text-sm text-muted-foreground mt-1">{t.limitDesc}</p>
              </div>
              <a
                href="/admin/settings"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors"
              >
                {t.upgradeBtn}
              </a>
            </div>
          ) : (
            /* Add form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  {t.name} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={language === 'uz' ? 'Masalan: Chilonzor filiali' : language === 'ru' ? 'Например: Филиал Чиланзар' : 'E.g. Chilanzar Branch'}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  {t.city} *
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder={language === 'uz' ? 'Toshkent' : language === 'ru' ? 'Ташкент' : 'Tashkent'}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {t.address}
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder={language === 'uz' ? 'Ko\'cha, bino raqami' : language === 'ru' ? 'Улица, номер дома' : 'Street, building number'}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !form.name.trim() || !form.city.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? '...' : t.save}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
