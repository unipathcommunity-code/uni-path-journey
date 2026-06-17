import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardList,
  Search,
  Plus,
  Calendar,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  student_id: string | null;
  created_at: string;
  completed_at: string | null;
  student_name?: string;
}

interface Student {
  student_id: string;
  full_name: string;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
];

export default function AgentTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    student_id: '',
    priority: 'medium',
    due_date: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('agent_id', user?.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (tasksError) throw tasksError;

      // Fetch assigned students
      const { data: assignments } = await supabase
        .from('agent_students')
        .select('student_id')
        .eq('agent_id', user?.id)
        .eq('status', 'active');

      const studentIds = assignments?.map((a) => a.student_id) || [];

      // Fetch student profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds);

      const studentsMap = new Map(
        profiles?.map((p) => [p.user_id, p.full_name]) || []
      );

      setStudents(
        profiles?.map((p) => ({
          student_id: p.user_id,
          full_name: p.full_name || 'Unknown',
        })) || []
      );

      // Enrich tasks with student names
      const enrichedTasks = (tasksData || []).map((task) => ({
        ...task,
        student_name: task.student_id
          ? studentsMap.get(task.student_id) || 'Unknown'
          : null,
      }));

      setTasks(enrichedTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('agent_tasks').insert({
        agent_id: user?.id,
        title: newTask.title,
        description: newTask.description || null,
        student_id: newTask.student_id || null,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Task created successfully');
      setDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        student_id: '',
        priority: 'medium',
        due_date: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from('agent_tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', task.id);

      if (error) throw error;

      setTasks(
        tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: newStatus,
                completed_at:
                  newStatus === 'completed' ? new Date().toISOString() : null,
              }
            : t
        )
      );
      toast.success(
        newStatus === 'completed' ? 'Task completed!' : 'Task reopened'
      );
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('agent_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task deleted');
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.student_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vazifalar va muddatlar</h1>
          <p className="text-muted-foreground">
            Vazifalaringizni boshqaring va muddatlarni kuzating
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Vazifa qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi vazifa yaratish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Sarlavha *</label>
                <Input
                  placeholder="Vazifa sarlavhasini kiriting"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tavsif</label>
                <Textarea
                  placeholder="Vazifa tavsifi (ixtiyoriy)"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Talaba (ixtiyoriy)</label>
                  <Select
                    value={newTask.student_id}
                    onValueChange={(v) =>
                      setNewTask({ ...newTask, student_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Talabani tanlash" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Talaba yo'q</SelectItem>
                      {students.map((s) => (
                        <SelectItem key={s.student_id} value={s.student_id}>
                          {s.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Muhimlik</label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(v) =>
                      setNewTask({ ...newTask, priority: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Muddat</label>
                <Input
                  type="datetime-local"
                  value={newTask.due_date}
                  onChange={(e) =>
                    setNewTask({ ...newTask, due_date: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button onClick={handleCreateTask} disabled={saving}>
                  {saving ? 'Yaratilmoqda...' : 'Vazifa yaratish'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Vazifalarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status bo'yicha filtrlash" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha vazifalar</SelectItem>
            <SelectItem value="pending">Kutilayotgan</SelectItem>
            <SelectItem value="completed">Bajarilgan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Vazifalar topilmadi</h3>
            <p className="text-muted-foreground">
              Ish va muddatlarni kuzatish uchun vazifalar yarating
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const priorityConfig = PRIORITY_OPTIONS.find(
              (p) => p.value === task.priority
            );
            const overdue = isOverdue(task);

            return (
              <Card
                key={task.id}
                className={`transition-all ${
                  task.status === 'completed' ? 'opacity-60' : ''
                } ${overdue ? 'border-destructive' : ''}`}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => handleToggleComplete(task)}
                    className="h-5 w-5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`font-medium ${
                          task.status === 'completed'
                            ? 'line-through text-muted-foreground'
                            : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      <Badge className={priorityConfig?.color}>
                        {priorityConfig?.label}
                      </Badge>
                      {overdue && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Muddati o'tgan
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {task.student_name && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.student_name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
