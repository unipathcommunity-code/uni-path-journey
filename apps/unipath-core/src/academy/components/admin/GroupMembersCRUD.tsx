import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Users2, UserPlus, Trash2, Loader2, ChevronDown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
}

interface Student {
  user_id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

interface Props {
  groups: Group[];
  students: Student[];
  onRefresh?: () => void;
}

const GroupMembersCRUD = ({ groups, students }: Props) => {
  const { t } = useLanguage();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [search, setSearch] = useState("");

  const { data: members = [], refetch } = useQuery({
    queryKey: ["group-members", openGroupId],
    queryFn: async () => {
      if (!openGroupId) return [];
      const { data } = await supabase
        .from("group_members")
        .select("id, student_id, joined_at")
        .eq("group_id", openGroupId);
      return data || [];
    },
    enabled: !!openGroupId,
  });

  const memberIds = new Set(members.map((m) => m.student_id));
  const availableStudents = students.filter(
    (s) =>
      !memberIds.has(s.user_id) &&
      (s.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedStudent || !openGroupId) return;
    setAdding(true);
    try {
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: openGroupId, student_id: selectedStudent });
      if (error) throw error;
      toast.success(t("admin.member_added"));
      setSelectedStudent("");
      setSearch("");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId);
    try {
      const { error } = await supabase.from("group_members").delete().eq("id", memberId);
      if (error) throw error;
      toast.success(t("admin.member_removed"));
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRemovingId(null);
    }
  };

  const studentMap = new Map(students.map((s) => [s.user_id, s]));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-heading font-semibold">{t("admin.group_members")}</h2>
          <p className="text-xs text-muted-foreground">{t("admin.assign_students")}</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{t("admin.no_groups")}</p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const isOpen = openGroupId === g.id;
            return (
              <div key={g.id} className="rounded-xl bg-muted/20 border border-border/20 overflow-hidden">
                <button
                  onClick={() => {
                    setOpenGroupId(isOpen ? null : g.id);
                    setSearch("");
                    setSelectedStudent("");
                  }}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm font-medium">{g.name}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 space-y-3 border-t border-border/30">
                        {/* Add student */}
                        <div className="space-y-2">
                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("admin.search_student")}
                            className="w-full bg-background text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30"
                          />
                          {search && availableStudents.length > 0 && (
                            <div className="max-h-40 overflow-y-auto rounded-lg bg-background border border-border/30 divide-y divide-border/20">
                              {availableStudents.slice(0, 10).map((s) => (
                                <button
                                  key={s.user_id}
                                  onClick={() => {
                                    setSelectedStudent(s.user_id);
                                    setSearch(s.full_name || "");
                                  }}
                                  className={`w-full text-left p-2 text-xs hover:bg-muted/30 ${
                                    selectedStudent === s.user_id ? "bg-primary/10 text-primary" : ""
                                  }`}
                                >
                                  {s.full_name || s.user_id.slice(0, 8)}
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={handleAdd}
                            disabled={!selectedStudent || adding}
                            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                          >
                            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                            {t("admin.add_member")}
                          </button>
                        </div>

                        {/* Members list */}
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {members.length} {t("admin.members")}
                          </p>
                          {members.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              {t("admin.no_members")}
                            </p>
                          ) : (
                            members.map((m) => {
                              const s = studentMap.get(m.student_id);
                              return (
                                <motion.div
                                  key={m.id}
                                  layout
                                  className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
                                >
                                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                                    {(s?.full_name || "?")[0]}
                                  </div>
                                  <span className="text-xs flex-1 truncate">
                                    {s?.full_name || m.student_id.slice(0, 8)}
                                  </span>
                                  <button
                                    onClick={() => handleRemove(m.id)}
                                    disabled={removingId === m.id}
                                    className="p-1 rounded hover:bg-destructive/10"
                                  >
                                    {removingId === m.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin text-destructive" />
                                    ) : (
                                      <X className="w-3 h-3 text-destructive" />
                                    )}
                                  </button>
                                </motion.div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default GroupMembersCRUD;
