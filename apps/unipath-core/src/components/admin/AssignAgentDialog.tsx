import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserCheck, User, Loader2, Send, AlertCircle } from 'lucide-react';

interface Agent {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface AssignAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    user_id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  currentAgentId?: string | null;
  onAssigned: () => void;
}

export function AssignAgentDialog({
  open,
  onOpenChange,
  student,
  currentAgentId,
  onAssigned,
}: AssignAgentDialogProps) {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (open) {
      fetchAgents();
      setSelectedAgentId(currentAgentId || '');
      setNotes('');
    }
  }, [open, currentAgentId]);

  async function fetchAgents() {
    setFetching(true);
    try {
      // Get all users with specialist or mentor role directly from profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('role', ['specialist', 'mentor']);

      if (profilesError) throw profilesError;
      
      setAgents(profiles || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      toast({
        title: 'Xatolik',
        description: 'Agentlarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setFetching(false);
    }
  }

  async function handleAssign() {
    if (!student || !selectedAgentId) {
      toast({
        title: 'Xatolik',
        description: 'Iltimos, agent tanlang',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('agent_students')
        .select('id')
        .eq('student_id', student.user_id)
        .eq('agent_id', selectedAgentId)
        .maybeSingle();

      if (existing) {
        // Update existing assignment
        const { error } = await supabase
          .from('agent_students')
          .update({
            status: 'active',
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Deactivate any existing assignments for this student
        await supabase
          .from('agent_students')
          .update({ status: 'inactive' })
          .eq('student_id', student.user_id);

        // Create new assignment
        const { error } = await supabase.from('agent_students').insert({
          agent_id: selectedAgentId,
          student_id: student.user_id,
          notes: notes || null,
          status: 'active',
        });

        if (error) throw error;
      }

      // Send notification to agent (non-blocking - don't let notification failure break assignment)
      const agentProfile = agents.find((a) => a.user_id === selectedAgentId);
      try {
        await supabase.from('notifications').insert({
          user_id: selectedAgentId,
          title: 'Yangi talaba tayinlandi',
          message: `${student.full_name || student.email || 'Yangi talaba'} sizga tayinlandi.`,
          type: 'info',
          link: '/agent/students',
        });
      } catch (notifErr) {
        console.warn('Could not send notification to agent:', notifErr);
      }

      toast({
        title: 'Muvaffaqiyatli!',
        description: `Talaba ${agentProfile?.full_name || 'agent'}ga tayinlandi`,
      });

      onOpenChange(false);
      onAssigned();
    } catch (err: any) {
      console.error('Error assigning agent:', err);
      toast({
        title: 'Xatolik',
        description: err.message || 'Tayinlashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Agentga tayinlash
          </DialogTitle>
          <DialogDescription>
            Talabani agentga yuborish uchun agent tanlang
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Info */}
          {student && (
            <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {student.full_name || 'Ism yo\'q'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {student.email || 'Email yo\'q'}
                </p>
              </div>
            </div>
          )}

          {/* Agent Selection */}
          <div className="space-y-2">
            <Label>Agent tanlang</Label>
            {fetching ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Agentlar yuklanmoqda...</span>
              </div>
            ) : agents.length === 0 ? (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Agentlar topilmadi</p>
                  <p className="text-sm text-muted-foreground">
                    Avval foydalanuvchilarga "agent" rolini bering
                  </p>
                </div>
              </div>
            ) : (
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Agent tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.user_id} value={agent.user_id}>
                      <div className="flex items-center gap-2">
                        <span>{agent.full_name || 'Ism yo\'q'}</span>
                        <span className="text-muted-foreground text-xs">
                          ({agent.email})
                        </span>
                        {currentAgentId === agent.user_id && (
                          <Badge variant="secondary" className="text-xs">
                            Hozirgi
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Izoh (ixtiyoriy)</Label>
            <Textarea
              placeholder="Agent uchun qo'shimcha ma'lumot..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleAssign}
            disabled={loading || !selectedAgentId || agents.length === 0}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Tayinlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
