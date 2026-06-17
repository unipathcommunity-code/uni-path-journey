import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, BookOpen, MapPin, CheckCircle2, XCircle, AlertCircle, ChevronRight, Building2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useBranch } from "@/hooks/useBranch";

interface Lesson {
  id: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  status: "live" | "upcoming" | "completed";
  attendance: { present: number; total: number };
  topic: string;
}

const mockLessons: Lesson[] = [
  {
    id: "1",
    time: "08:00",
    subject: "Advanced Mathematics",
    teacher: "Dr. Karimova",
    room: "Room 4A",
    status: "completed",
    attendance: { present: 28, total: 30 },
    topic: "Differential Equations",
  },
  {
    id: "2",
    time: "09:30",
    subject: "Physics Lab",
    teacher: "Prof. Nazarov",
    room: "Lab 2B",
    status: "live",
    attendance: { present: 25, total: 27 },
    topic: "Electromagnetic Induction",
  },
  {
    id: "3",
    time: "11:00",
    subject: "Computer Science",
    teacher: "Ms. Sultanova",
    room: "Room 7C",
    status: "upcoming",
    attendance: { present: 0, total: 32 },
    topic: "Data Structures & Algorithms",
  },
  {
    id: "4",
    time: "12:30",
    subject: "English Literature",
    teacher: "Mr. Johnson",
    room: "Room 3A",
    status: "upcoming",
    attendance: { present: 0, total: 29 },
    topic: "Shakespeare: The Tempest",
  },
  {
    id: "5",
    time: "14:00",
    subject: "Chemistry",
    teacher: "Dr. Aliyev",
    room: "Lab 1A",
    status: "upcoming",
    attendance: { present: 0, total: 31 },
    topic: "Organic Reactions",
  },
];

const LiveTimeline = () => {
  const [selectedLesson, setSelectedLesson] = useState<string | null>("2");
  const { activeBranch, branches } = useBranch();

  // Deterministically assign each mock lesson to a branch slot so switching
  // filiallar visibly changes which lessons appear in the timeline.
  const lessons = useMemo(() => {
    if (!activeBranch || branches.length <= 1) return mockLessons;
    const idx = branches.findIndex((b) => b.id === activeBranch.id);
    return mockLessons.filter((_, i) => i % branches.length === idx);
  }, [activeBranch, branches]);

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-6"
      >
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h1 className="text-2xl font-bold font-heading text-gradient-primary">Flight Deck</h1>
          <div className="flex items-center gap-2">
            {activeBranch && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest px-2 py-1 rounded-full bg-warning/15 text-warning border border-warning/30">
                <Building2 className="w-3 h-3" />
                FAOL FILIAL · {activeBranch.name}
              </span>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-2xl mx-auto grid grid-cols-3 gap-3 mb-6"
      >
        <StatCard icon={<Users className="w-4 h-4" />} label="Present" value="53/57" accent="primary" />
        <StatCard icon={<BookOpen className="w-4 h-4" />} label="Active" value="1/5" accent="success" />
        <StatCard icon={<AlertCircle className="w-4 h-4" />} label="Absent" value="4" accent="warning" />
      </motion.div>

      {/* Timeline — re-mounts on filial change for buttery transitions */}
      <div className="max-w-2xl mx-auto relative">
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeBranch?.id || "all"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            {lessons.length === 0 ? (
              <div className="glass-strong p-6 text-center text-sm text-muted-foreground">
                Bu filialda hozircha darslar yo'q
              </div>
            ) : lessons.map((lesson, i) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.06 }}
              >
                <LessonCard
                  lesson={lesson}
                  isSelected={selectedLesson === lesson.id}
                  onSelect={() => setSelectedLesson(selectedLesson === lesson.id ? null : lesson.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "primary" | "success" | "warning";
}) => {
  const accentClasses = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
  };

  return (
    <div className="glass p-3 text-center">
      <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${accentClasses[accent]}`}>
        {icon}
      </div>
      <p className="text-lg font-bold font-heading">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

const LessonCard = ({
  lesson,
  isSelected,
  onSelect,
}: {
  lesson: Lesson;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const isLive = lesson.status === "live";
  const isDone = lesson.status === "completed";

  return (
    <div className="flex gap-3">
      {/* Timeline dot */}
      <div className="relative z-10 mt-4">
        <div className={`w-[14px] h-[14px] rounded-full border-2 ${
          isLive ? "bg-success border-success glow-success" :
          isDone ? "bg-muted-foreground border-muted-foreground" :
          "bg-background border-border"
        }`} />
        {isLive && <div className="absolute inset-0 w-[14px] h-[14px] rounded-full bg-success/40 animate-ping" />}
      </div>

      {/* Card */}
      <motion.button
        onClick={onSelect}
        whileTap={{ scale: 0.98 }}
        className={`flex-1 text-left p-4 rounded-2xl transition-all duration-300 ${
          isLive ? "glass-strong glow-primary border-primary/20" :
          isDone ? "glass opacity-60" :
          "glass hover:bg-card/80"
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{lesson.time}</span>
              {isLive && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/20 text-success uppercase tracking-wider">
                  Live
                </span>
              )}
              {isDone && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
                  Done
                </span>
              )}
            </div>
            <h3 className="font-semibold font-heading">{lesson.subject}</h3>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {lesson.room}
          </span>
          <span>·</span>
          <span>{lesson.teacher}</span>
        </div>

        {/* Expanded details */}
        <motion.div
          initial={false}
          animate={{ height: isSelected ? "auto" : 0, opacity: isSelected ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="mt-4 pt-3 border-t border-border space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Topic</p>
              <p className="text-sm font-medium">{lesson.topic}</p>
            </div>

            {(isLive || isDone) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Attendance</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(lesson.attendance.present / lesson.attendance.total) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="h-full rounded-full bg-success"
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {lesson.attendance.present}/{lesson.attendance.total}
                  </span>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {Array.from({ length: lesson.attendance.total }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-md flex items-center justify-center ${
                        i < lesson.attendance.present
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {i < lesson.attendance.present ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.button>
    </div>
  );
};

export default LiveTimeline;
