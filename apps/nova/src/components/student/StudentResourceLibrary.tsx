import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Download, Search, Filter, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

/**
 * StudentResourceLibrary — talaba o'z guruhlari (fanlari) bo'yicha
 * ustozlar yuklagan PDF/DOC/PPT materiallarini ko'radi va yuklab oladi.
 *
 * Logika:
 *  1. Talabaning group_members ichidagi guruhlarini topamiz.
 *  2. Shu guruhlardagi subject_id va teacher_id larni ajratamiz.
 *  3. teacher_resources dan o'sha fan/ustozlarning resurslarini olamiz.
 *  4. Signed URL orqali yuklab olamiz (bucket: teacher-resources, private).
 */
const StudentResourceLibrary = () => {
  const { user, profile } = useAuth();
  const [q, setQ] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const { data: scope, isLoading: scopeLoading } = useQuery({
    queryKey: ["student-resource-scope", user?.id],
    queryFn: async () => {
      if (!user) return { subjectIds: [] as string[], teacherIds: [] as string[] };
      const { data: gm } = await supabase
        .from("group_members")
        .select("group_id, groups(subject_id, teacher_id)")
        .eq("student_id", user.id);
      const subjectIds = Array.from(new Set((gm || [])
        .map((g: any) => g.groups?.subject_id).filter(Boolean)));
      const teacherIds = Array.from(new Set((gm || [])
        .map((g: any) => g.groups?.teacher_id).filter(Boolean)));
      return { subjectIds, teacherIds };
    },
    enabled: !!user,
  });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["student-resources", profile?.organization_id, scope?.subjectIds, scope?.teacherIds],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data } = await supabase
        .from("teacher_resources")
        .select("*, subjects(name)")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });
      const subj = scope?.subjectIds || [];
      const teach = scope?.teacherIds || [];
      const filtered = (data || []).filter((r: any) => {
        if (!r.subject_id) return teach.length === 0 || teach.includes(r.teacher_id);
        return subj.includes(r.subject_id) || teach.includes(r.teacher_id);
      });
      // Ustoz ismlarini alohida olamiz
      const teacherIds = Array.from(new Set(filtered.map((r: any) => r.teacher_id).filter(Boolean)));
      let teacherMap = new Map<string, string>();
      if (teacherIds.length) {
        const { data: profs } = await supabase
          .from("profiles").select("user_id, full_name").in("user_id", teacherIds);
        teacherMap = new Map((profs || []).map((p: any) => [p.user_id, p.full_name || "Ustoz"]));
      }
      return filtered.map((r: any) => ({ ...r, teacher_name: teacherMap.get(r.teacher_id) || "Ustoz" }));
    },
    enabled: !!profile?.organization_id && !!scope,
  });

  const subjects = useMemo(() => {
    const set = new Map<string, string>();
    resources.forEach((r: any) => {
      if (r.subjects?.name) set.set(r.subject_id, r.subjects.name);
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [resources]);

  const filtered = useMemo(() => {
    return resources.filter((r: any) => {
      if (subjectFilter !== "all" && r.subject_id !== subjectFilter) return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        if (!String(r.title || "").toLowerCase().includes(needle) &&
            !String(r.subjects?.name || "").toLowerCase().includes(needle) &&
            !String(r.teacher_name || "").toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [resources, q, subjectFilter]);

  const open = async (r: any) => {
    const { data, error } = await supabase.storage
      .from("teacher-resources")
      .createSignedUrl(r.file_path, 60 * 10);
    if (error) { toast.error("Faylni ochib bo'lmadi"); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Kutubxona — kitob va materiallar
        </h3>
        <span className="text-[10px] text-muted-foreground">{filtered.length} ta</span>
      </div>

      <div className="glass-strong p-3 space-y-2 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Qidirish: nom, fan, ustoz..."
              className="glass w-full pl-8 pr-3 py-2 rounded-lg text-sm bg-background"
            />
          </div>
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="glass pl-8 pr-3 py-2 rounded-lg text-sm bg-background appearance-none"
            >
              <option value="all">Barcha fanlar</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {(isLoading || scopeLoading) ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass p-6 text-center rounded-2xl">
          <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Hozircha sizning fanlaringiz uchun material yuklanmagan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map((r: any, i: number) => (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => open(r)}
              className="glass p-3 rounded-xl flex items-start gap-3 text-left hover:border-primary/40 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{r.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {r.subjects?.name || "Umumiy"} · {r.teacher_name || "Ustoz"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {r.file_size ? `${(r.file_size / 1024 / 1024).toFixed(1)} MB` : ""}
                </p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default StudentResourceLibrary;
