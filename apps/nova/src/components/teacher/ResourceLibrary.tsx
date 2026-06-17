import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Upload, Trash2, FileText, Loader2 } from "lucide-react";

/**
 * ResourceLibrary — ustozning kitob/PDF/material yuklash kutubxonasi.
 * Bucket: teacher-resources (private). Path: <user_id>/<timestamp>-<filename>
 */
const ResourceLibrary = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: subjects = [] } = useQuery({
    queryKey: ["teacher-subjects-res", user?.id],
    queryFn: async () => {
      const { data: grps } = await supabase.from("groups").select("subject_id").eq("teacher_id", user!.id);
      const ids = Array.from(new Set((grps || []).map((g: any) => g.subject_id).filter(Boolean)));
      if (ids.length === 0) return [];
      const { data } = await supabase.from("subjects").select("id, name").in("id", ids);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["my-resources", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("teacher_resources")
        .select("*, subjects(name)").eq("teacher_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const upload = async (file: File) => {
    if (!user || !profile?.organization_id) return;
    setBusy(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("teacher-resources").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("teacher-resources").createSignedUrl
        ? { data: { publicUrl: "" } } as any : { data: { publicUrl: "" } } as any;
      // Use signed-url so it's still accessible via Storage API; we store path for re-signing.
      const { error: insErr } = await supabase.from("teacher_resources").insert({
        organization_id: profile.organization_id,
        teacher_id: user.id,
        subject_id: subjectId || null,
        title: title.trim() || file.name,
        file_url: path, // signed url generated on demand
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      });
      if (insErr) throw insErr;
      toast.success("Yuklandi");
      setTitle("");
      qc.invalidateQueries({ queryKey: ["my-resources"] });
      qc.invalidateQueries({ queryKey: ["resources"] });
    } catch (e: any) {
      toast.error(e.message || "Yuklab bo'lmadi");
    } finally { setBusy(false); }
  };

  const remove = useMutation({
    mutationFn: async (r: any) => {
      await supabase.storage.from("teacher-resources").remove([r.file_path]);
      await supabase.from("teacher_resources").delete().eq("id", r.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-resources"] }),
  });

  const openFile = async (r: any) => {
    const { data, error } = await supabase.storage.from("teacher-resources").createSignedUrl(r.file_path, 60 * 5);
    if (error) { toast.error("Faylni ochib bo'lmadi"); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Mening kutubxonam</h2>
      <div className="glass-strong p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
            className="glass px-3 py-2 rounded-lg text-sm bg-background">
            <option value="">— Fan (ixtiyoriy) —</option>
            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sarlavha (ixtiyoriy)"
            className="glass px-3 py-2 rounded-lg text-sm bg-background" />
        </div>
        <label className={`block w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition ${busy ? "opacity-50 pointer-events-none" : ""}`}>
          <input type="file" accept="application/pdf,.pdf,.doc,.docx,.ppt,.pptx" hidden
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /> : <Upload className="w-5 h-5 mx-auto text-muted-foreground" />}
          <p className="text-xs text-muted-foreground mt-1">PDF/DOC/PPT yuklash</p>
        </label>
      </div>

      <div className="space-y-1.5">
        {resources.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Hozircha resurs yo'q</p>
        )}
        {resources.map((r: any) => (
          <div key={r.id} className="glass p-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <button onClick={() => openFile(r)} className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {r.subjects?.name || "Umumiy"} · {r.file_size ? `${(r.file_size / 1024 / 1024).toFixed(1)} MB` : ""}
              </p>
            </button>
            <button onClick={() => remove.mutate(r)} className="p-1.5 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceLibrary;
