import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Save, Users2, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
  description: string | null;
  subject_id: string | null;
  teacher_id: string | null;
}

interface Subject { id: string; name: string }
interface Teacher { user_id: string; full_name: string | null }

interface Props {
  groups: Group[];
  subjects: Subject[];
  teachers: Teacher[];
  onRefresh: () => void;
}

const GroupCRUD = ({ groups, subjects, teachers, onRefresh }: Props) => {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const open = (g?: Group) => {
    setEditing(g || null);
    setName(g?.name || "");
    setDescription(g?.description || "");
    setSubjectId(g?.subject_id || "");
    setTeacherId(g?.teacher_id || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        subject_id: subjectId || null,
        teacher_id: teacherId || null,
      };
      if (editing) {
        const { error } = await supabase.from("groups").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success(t("admin.group_updated"));
      } else {
        const { error } = await supabase.from("groups").insert(payload);
        if (error) throw error;
        toast.success(t("admin.group_created"));
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
      const { error } = await supabase.from("groups").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("admin.group_deleted"));
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
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Users2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-heading font-semibold">{t("admin.groups")}</h2>
            <p className="text-xs text-muted-foreground">{groups.length} {t("admin.total_groups")}</p>
          </div>
        </div>
        <button onClick={() => open()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-medium">
          <Plus className="w-3.5 h-3.5" /> {t("admin.add_group")}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{editing ? t("admin.edit_group") : t("admin.add_group")}</h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
              </div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("admin.group_name")}
                className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("admin.group_desc")} rows={2}
                className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30 resize-none" />
              <div className="grid sm:grid-cols-2 gap-2">
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30">
                  <option value="">{t("admin.select_subject")}</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30">
                  <option value="">{t("admin.select_teacher")}</option>
                  {teachers.map((tc) => <option key={tc.user_id} value={tc.user_id}>{tc.full_name || tc.user_id.slice(0, 8)}</option>)}
                </select>
              </div>
              <button onClick={handleSave} disabled={!name.trim() || saving}
                className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? t("admin.save_changes") : t("admin.create")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{t("admin.no_groups")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {groups.map((g) => {
            const subj = subjects.find(s => s.id === g.subject_id);
            const teach = teachers.find(t => t.user_id === g.teacher_id);
            return (
              <motion.div key={g.id} layout className="p-3 rounded-xl bg-muted/20 border border-border/20 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{g.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {subj?.name || "—"} {teach?.full_name && `· ${teach.full_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => open(g)} className="p-1.5 rounded-lg hover:bg-muted/50">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(g.id)} disabled={deleting === g.id} className="p-1.5 rounded-lg hover:bg-destructive/10">
                    {deleting === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" /> : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default GroupCRUD;
