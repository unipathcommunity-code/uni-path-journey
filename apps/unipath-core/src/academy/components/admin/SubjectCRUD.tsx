import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Save, BookOpen, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
}

interface Props {
  subjects: Subject[];
  onRefresh: () => void;
}

const SubjectCRUD = ({ subjects, onRefresh }: Props) => {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const open = (s?: Subject) => {
    setEditing(s || null);
    setName(s?.name || "");
    setCode(s?.code || "");
    setDescription(s?.description || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), code: code.trim() || null, description: description.trim() || null };
      if (editing) {
        const { error } = await supabase.from("subjects").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success(t("admin.subject_updated"));
      } else {
        const { error } = await supabase.from("subjects").insert(payload);
        if (error) throw error;
        toast.success(t("admin.subject_created"));
      }
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("admin.subject_deleted"));
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-heading font-semibold">{t("admin.subjects")}</h2>
            <p className="text-xs text-muted-foreground">{subjects.length} {t("admin.total_subjects")}</p>
          </div>
        </div>
        <button onClick={() => open()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium">
          <Plus className="w-3.5 h-3.5" /> {t("admin.add_subject")}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{editing ? t("admin.edit_subject") : t("admin.add_subject")}</h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
              </div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("admin.subject_name")}
                className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("admin.subject_code")}
                className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("admin.subject_desc")} rows={2}
                className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30 resize-none" />
              <button onClick={handleSave} disabled={!name.trim() || saving}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? t("admin.save_changes") : t("admin.create")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{t("admin.no_subjects")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {subjects.map((s) => (
            <motion.div key={s.id} layout className="p-3 rounded-xl bg-muted/20 border border-border/20 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{s.name} {s.code && <span className="text-xs text-muted-foreground">({s.code})</span>}</p>
                {s.description && <p className="text-[11px] text-muted-foreground truncate">{s.description}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => open(s)} className="p-1.5 rounded-lg hover:bg-muted/50">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} className="p-1.5 rounded-lg hover:bg-destructive/10">
                  {deleting === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" /> : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SubjectCRUD;
