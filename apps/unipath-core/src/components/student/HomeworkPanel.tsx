import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Homework {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  score?: number;
  maxScore: number;
}

interface HomeworkPanelProps {
  items: Homework[];
  onSubmitted?: () => void;
}

const HomeworkPanel = ({ items, onSubmitted }: HomeworkPanelProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (hwId: string, file: File) => {
    setSelectedFiles(prev => ({ ...prev, [hwId]: file }));
  };

  const handleSubmit = async (id: string) => {
    if (!user) return;
    const file = selectedFiles[id];
    const text = textAnswers[id]?.trim();
    if (!file && !text) {
      toast.error(t("student.upload_or_text") || "Please attach a file or write an answer");
      return;
    }
    setUploadingId(id);

    try {
      let fileUrl: string | null = null;
      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${id}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('homework-files')
          .upload(path, file);
        if (uploadError) throw uploadError;
        fileUrl = path;
      }
      const { error } = await supabase.from('homework_submissions').insert({
        homework_id: id,
        student_id: user.id,
        file_url: fileUrl,
        content: text || null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success(t("student.submitted") + "!");
      setSelectedFiles(prev => { const n = { ...prev }; delete n[id]; return n; });
      setTextAnswers(prev => { const n = { ...prev }; delete n[id]; return n; });
      setExpandedId(null);
      onSubmitted?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: "text-warning", label: t("student.pending") },
    submitted: { icon: Upload, color: "text-primary", label: t("student.submitted") },
    graded: { icon: CheckCircle, color: "text-success", label: t("student.graded") },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("student.homework")}</h3>

      <div className="space-y-2">
        {items.map((hw, i) => {
          const cfg = statusConfig[hw.status];
          const Icon = cfg.icon;
          const isExpanded = expandedId === hw.id;
          const selectedFile = selectedFiles[hw.id];
          return (
            <motion.div
              key={hw.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : hw.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{hw.title}</p>
                  <p className="text-[11px] text-muted-foreground">{hw.subject} · {hw.dueDate}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  <span className={`text-[11px] font-medium ${cfg.color}`}>
                    {hw.status === "graded" ? `${hw.score}/${hw.maxScore}` : cfg.label}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-2 space-y-2">
                      {hw.status === "pending" && (
                        <div className="space-y-2">
                          <textarea
                            value={textAnswers[hw.id] || ""}
                            onChange={(e) => setTextAnswers(prev => ({ ...prev, [hw.id]: e.target.value }))}
                            placeholder={t("student.write_answer") || "Write your answer..."}
                            className="w-full text-sm bg-muted/30 border border-glass-border rounded-xl p-2 min-h-[60px] focus:outline-none focus:border-primary/50 resize-none"
                          />
                          <div className="flex gap-2">
                            <input
                              type="file"
                              ref={el => { fileInputRefs.current[hw.id] = el; }}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(hw.id, file);
                              }}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.zip"
                            />
                            <div
                              onClick={() => fileInputRefs.current[hw.id]?.click()}
                              className="flex-1 border border-dashed border-glass-border rounded-xl p-2 text-center cursor-pointer hover:border-primary/40 transition-colors"
                            >
                              <Upload className="w-4 h-4 text-muted-foreground mx-auto" />
                              <p className="text-[10px] text-muted-foreground truncate">
                                {selectedFile ? selectedFile.name : t("student.upload_file")}
                              </p>
                            </div>
                            <button
                              onClick={() => handleSubmit(hw.id)}
                              disabled={uploadingId === hw.id}
                              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              {uploadingId === hw.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t("student.submit")}
                            </button>
                          </div>
                        </div>
                      )}
                      {hw.status === "submitted" && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
                          <Upload className="w-4 h-4 text-primary" />
                          <span className="text-sm text-primary font-medium">
                            {t("student.awaiting_grade") || "Submitted — awaiting grade"}
                          </span>
                        </div>
                      )}
                      {hw.status === "graded" && hw.score !== undefined && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-sm text-success font-medium">
                            {t("student.score")}: {hw.score}/{hw.maxScore} ({Math.round((hw.score / hw.maxScore) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default HomeworkPanel;
