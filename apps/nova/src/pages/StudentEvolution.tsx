import { motion } from "framer-motion";
import { BookOpen, Trophy, Award, TrendingUp, Star, Play, Clock, CheckCircle2, QrCode } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import CertificatesList from "@/components/student/CertificatesList";

type Tab = "courses" | "progress" | "portfolio";

interface Course {
  id: string;
  title: string;
  subject: string;
  progress: number;
  lessons: number;
  completed: number;
  status: "green" | "yellow" | "red";
  thumbnail: string;
  category: string;
}

const MOCK_COURSES: Course[] = [
  { id: "1", title: "Advanced Mathematics", subject: "Algebra & Calculus", progress: 85, lessons: 24, completed: 20, status: "green", thumbnail: "📐", category: "Mathematics" },
  { id: "2", title: "Modern Physics", subject: "Quantum Mechanics", progress: 62, lessons: 18, completed: 11, status: "yellow", thumbnail: "⚛️", category: "Science" },
  { id: "3", title: "World Literature", subject: "Classic & Modern", progress: 95, lessons: 16, completed: 15, status: "green", thumbnail: "📚", category: "Humanities" },
  { id: "4", title: "Computer Science", subject: "Data Structures", progress: 45, lessons: 20, completed: 9, status: "yellow", thumbnail: "💻", category: "Technology" },
  { id: "5", title: "Chemistry Lab", subject: "Organic Chemistry", progress: 28, lessons: 22, completed: 6, status: "red", thumbnail: "🧪", category: "Science" },
  { id: "6", title: "English Grammar", subject: "Advanced Writing", progress: 90, lessons: 14, completed: 13, status: "green", thumbnail: "✍️", category: "Languages" },
  { id: "7", title: "History of Art", subject: "Renaissance to Modern", progress: 55, lessons: 12, completed: 7, status: "yellow", thumbnail: "🎨", category: "Humanities" },
  { id: "8", title: "Biology", subject: "Cell Biology & Genetics", progress: 15, lessons: 20, completed: 3, status: "red", thumbnail: "🧬", category: "Science" },
];

const CATEGORIES = ["All", "Mathematics", "Science", "Technology", "Humanities", "Languages"];

const CERTIFICATES = [
  { id: "1", title: "Mathematics Excellence", date: "2026-02-15", grade: "A+", icon: "🏆" },
  { id: "2", title: "Science Fair Winner", date: "2026-01-20", grade: "1st Place", icon: "🥇" },
  { id: "3", title: "Perfect Attendance Q1", date: "2026-03-01", grade: "100%", icon: "⭐" },
];

const statusColors = {
  green: { bg: "bg-success/20", text: "text-success", border: "border-success/30", label: "On Track" },
  yellow: { bg: "bg-warning/20", text: "text-warning", border: "border-warning/30", label: "Needs Attention" },
  red: { bg: "bg-destructive/20", text: "text-destructive", border: "border-destructive/30", label: "At Risk" },
};

const StudentEvolution = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("courses");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredCourses = selectedCategory === "All"
    ? MOCK_COURSES
    : MOCK_COURSES.filter((c) => c.category === selectedCategory);

  const overallProgress = Math.round(MOCK_COURSES.reduce((s, c) => s + c.progress, 0) / MOCK_COURSES.length);
  const greenCount = MOCK_COURSES.filter((c) => c.status === "green").length;
  const yellowCount = MOCK_COURSES.filter((c) => c.status === "yellow").length;
  const redCount = MOCK_COURSES.filter((c) => c.status === "red").length;

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[150px] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 sm:gap-4 mb-6 z-10 relative">
        <BackButton to="/app" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-gradient-primary">Evolution Map</h1>
            <p className="text-xs text-muted-foreground">{profile?.full_name || "Student"}'s learning journey</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 z-10 relative">
        {(["courses", "progress", "portfolio"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t ? "bg-primary text-primary-foreground glow-primary" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "courses" ? "Courses" : t === "progress" ? "Progress" : "Portfolio"}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {tab === "courses" && (
          <div>
            {/* Category filter */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat ? "bg-accent/20 text-accent border border-accent/30" : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Netflix-style horizontal rows */}
            <div className="space-y-6">
              {["green", "yellow", "red"].map((status) => {
                const courses = filteredCourses.filter((c) => c.status === status);
                if (courses.length === 0) return null;
                const sc = statusColors[status as keyof typeof statusColors];
                return (
                  <div key={status}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${sc.bg} border ${sc.border}`} />
                      <h3 className={`text-sm font-semibold ${sc.text}`}>{sc.label}</h3>
                      <span className="text-xs text-muted-foreground">({courses.length})</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                      {courses.map((course, i) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          className={`glass-strong min-w-[220px] max-w-[220px] overflow-hidden cursor-pointer group border ${sc.border}`}
                        >
                          <div className={`h-28 ${sc.bg} flex items-center justify-center text-4xl relative`}>
                            {course.thumbnail}
                            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                            <div className="absolute bottom-2 left-3 right-3">
                              <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    course.status === "green" ? "bg-success" : course.status === "yellow" ? "bg-warning" : "bg-destructive"
                                  }`}
                                  style={{ width: `${course.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="font-semibold text-sm truncate">{course.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{course.subject}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">{course.completed}/{course.lessons} lessons</span>
                              <span className={`text-xs font-bold ${sc.text}`}>{course.progress}%</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "progress" && (
          <div className="space-y-6">
            {/* Traffic Light Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-6">
              <h2 className="text-lg font-heading font-semibold mb-5 flex items-center gap-2">
                <Star className="w-5 h-5 text-warning" /> Traffic Light Overview
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-3xl font-bold text-success">{greenCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">On Track</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <p className="text-3xl font-bold text-warning">{yellowCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Needs Attention</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-3xl font-bold text-destructive">{redCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">At Risk</p>
                </div>
              </div>
              {/* Overall progress bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-bold text-primary">{overallProgress}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
              </div>
            </motion.div>

            {/* Per-course progress bars */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-strong p-6">
              <h2 className="text-lg font-heading font-semibold mb-4">Course Breakdown</h2>
              <div className="space-y-4">
                {MOCK_COURSES.sort((a, b) => b.progress - a.progress).map((course, i) => {
                  const sc = statusColors[course.status];
                  return (
                    <motion.div key={course.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{course.thumbnail}</span>
                          <span className="text-sm font-medium">{course.title}</span>
                        </div>
                        <span className={`text-xs font-bold ${sc.text}`}>{course.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                          className={`h-full rounded-full ${
                            course.status === "green" ? "bg-success" : course.status === "yellow" ? "bg-warning" : "bg-destructive"
                          }`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {tab === "portfolio" && (
          <div className="space-y-6">
            <div className="glass-strong p-6">
              <CertificatesList />
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-6">
              <h2 className="text-lg font-heading font-semibold mb-5 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Digital Certificates
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CERTIFICATES.map((cert, i) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.03 }}
                    className="p-5 rounded-xl border border-primary/20 bg-primary/5 relative overflow-hidden group cursor-pointer"
                  >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <QrCode className="w-8 h-8 text-primary/40" />
                    </div>
                    <span className="text-3xl mb-3 block">{cert.icon}</span>
                    <h3 className="font-semibold text-sm">{cert.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(cert.date).toLocaleDateString()}</p>
                    <div className="mt-3 inline-block px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                      {cert.grade}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Stats summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Courses Completed", value: "3", icon: CheckCircle2, color: "text-success" },
                { label: "Total Hours", value: "142", icon: Clock, color: "text-primary" },
                { label: "Certificates", value: CERTIFICATES.length.toString(), icon: Award, color: "text-warning" },
                { label: "Current Streak", value: "12 days", icon: Trophy, color: "text-accent" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="glass-strong p-4 text-center"
                >
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold font-heading">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentEvolution;
