import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, CheckCircle2, Play } from "lucide-react";
import { motion } from "framer-motion";

/**
 * StudentTests — published testlar avtomatik chiqadi.
 * O'quvchi guruhdagi fanlar bo'yicha tegishli testlarni ko'radi.
 */
const StudentTests = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["student-tests", user?.id, profile?.organization_id],
    queryFn: async () => {
      if (!user || !profile?.organization_id) return [];
      // Find subjects via student's group memberships
      const { data: gm } = await supabase.from("group_members")
        .select("groups(subject_id)").eq("student_id", user.id);
      const subjectIds = Array.from(new Set((gm || []).map((m: any) => m.groups?.subject_id).filter(Boolean)));
      if (subjectIds.length === 0) {
        // fall back: show all published tests in org
        const { data } = await supabase.from("tests")
          .select("id, title, description, duration_minutes, total_questions, subject_id, subjects(name)")
          .eq("organization_id", profile.organization_id).eq("status", "published")
          .order("updated_at", { ascending: false }).limit(20);
        return data || [];
      }
      const { data } = await supabase.from("tests")
        .select("id, title, description, duration_minutes, total_questions, subject_id, subjects(name)")
        .eq("organization_id", profile.organization_id).eq("status", "published")
        .in("subject_id", subjectIds).order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && !!profile?.organization_id,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ["student-attempts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("test_attempts")
        .select("test_id, score, total_points, submitted_at").eq("student_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading || tests.length === 0) return null;

  const attemptMap = new Map(attempts.map((a: any) => [a.test_id, a]));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <FileText className="w-4 h-4 text-accent" /> Testlar
      </h3>
      <div className="space-y-2">
        {tests.map((t: any, i: number) => {
          const a = attemptMap.get(t.id) as any;
          const done = a?.submitted_at;
          return (
            <motion.button
              key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => !done && navigate(`/test/${t.id}`)}
              disabled={!!done}
              className="w-full glass p-3 flex items-center gap-3 text-left disabled:opacity-70"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? "bg-success/15" : "bg-accent/15"}`}>
                {done ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Play className="w-5 h-5 text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                  <span>{t.subjects?.name || "—"}</span>
                  <span>·</span>
                  <Clock className="w-2.5 h-2.5" /> {t.duration_minutes} daq
                  <span>·</span>
                  <span>{t.total_questions} ta savol</span>
                </p>
              </div>
              {done && (
                <span className="text-xs font-bold text-success">{a.score}/{a.total_points}</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default StudentTests;
