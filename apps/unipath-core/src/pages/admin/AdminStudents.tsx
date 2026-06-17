import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  UserCheck,
  Send,
  Lock,
} from 'lucide-react';
import { AssignAgentDialog } from '@/components/admin/AssignAgentDialog';
import { FeatureOverrideDialog } from '@/components/admin/FeatureOverrideDialog';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';

interface AgentAssignment {
  agent_id: string;
  agent_name: string | null;
  agent_email: string | null;
}

interface Student {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  telegram_username: string | null;
  selected_country: string | null;
  created_at: string;
  applications_count: number;
  assigned_agent?: AgentAssignment | null;
  featureOverrides?: Record<string, boolean>;
}

export default function AdminStudents() {
  const { language } = useApp();
  const t = useTranslation(language);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureStudent, setFeatureStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
    // Realtime subscription so admin sees profile updates instantly
    const channel = supabase
      .channel('admin-profiles-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => fetchStudents())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchStudents() {
    setLoading(true);
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, phone, telegram_username, selected_country, created_at')
      .order('created_at', { ascending: false });

    if (!error && profiles) {
      // Fetch application counts for each user
      const { data: applications } = await supabase
        .from('applications')
        .select('user_id');

      const appCounts: Record<string, number> = {};
      applications?.forEach(app => {
        appCounts[app.user_id] = (appCounts[app.user_id] || 0) + 1;
      });

      // Fetch agent assignments
      const { data: assignments } = await supabase
        .from('agent_students')
        .select('student_id, agent_id')
        .eq('status', 'active');

      // Get agent profiles
      const agentIds = [...new Set(assignments?.map(a => a.agent_id) || [])];
      let agentProfiles: Record<string, { full_name: string | null; email: string | null }> = {};
      
      if (agentIds.length > 0) {
        const { data: agentData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', agentIds);
        
        agentData?.forEach(agent => {
          agentProfiles[agent.user_id] = {
            full_name: agent.full_name,
            email: agent.email,
          };
        });
      }

      // Map assignments to students
      const assignmentMap: Record<string, AgentAssignment> = {};
      assignments?.forEach(a => {
        const agentProfile = agentProfiles[a.agent_id];
        assignmentMap[a.student_id] = {
          agent_id: a.agent_id,
          agent_name: agentProfile?.full_name || null,
          agent_email: agentProfile?.email || null,
        };
      });

      // Fetch feature overrides for all students
      const userIds = profiles.map(p => p.user_id);
      const { data: overrides } = await supabase
        .from('student_feature_overrides')
        .select('user_id, feature_key, is_unlocked')
        .in('user_id', userIds);

      const overrideMap: Record<string, Record<string, boolean>> = {};
      overrides?.forEach((o: any) => {
        if (!overrideMap[o.user_id]) overrideMap[o.user_id] = {};
        overrideMap[o.user_id][o.feature_key] = o.is_unlocked;
      });

      const studentsWithCounts = profiles.map(profile => ({
        ...profile,
        applications_count: appCounts[profile.user_id] || 0,
        assigned_agent: assignmentMap[profile.user_id] || null,
        featureOverrides: overrideMap[profile.user_id] || {},
      }));

      setStudents(studentsWithCounts);
    }
    setLoading(false);
  }

  const [contactFilter, setContactFilter] = useState<'all' | 'missing'>('all');

  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      student.full_name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.phone?.includes(query) ||
      student.user_id?.toLowerCase().includes(query)
    );
    if (!matchesSearch) return false;
    if (contactFilter === 'missing') {
      return !student.phone || !student.telegram_username;
    }
    return true;
  });

  const openAssignDialog = (student: Student) => {
    setSelectedStudent(student);
    setAssignDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">{t.adminLoadingStudents}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.adminStudentsHeader}</h1>
          <p className="text-muted-foreground">{students.length} {t.adminRegisteredStudents}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">{t.adminTotalStudentsLabel}</p>
          <p className="text-2xl font-bold text-foreground">{students.length}</p>
        </div>
        <div className="bg-success/10 rounded-xl border border-success/20 p-4">
          <p className="text-sm text-success">{t.adminAssigned}</p>
          <p className="text-2xl font-bold text-success">
            {students.filter(s => s.assigned_agent).length}
          </p>
        </div>
        <div className="bg-warning/10 rounded-xl border border-warning/20 p-4">
          <p className="text-sm text-warning">{t.adminUnassigned}</p>
          <p className="text-2xl font-bold text-warning">
            {students.filter(s => !s.assigned_agent).length}
          </p>
        </div>
        <div className="bg-destructive/10 rounded-xl border border-destructive/20 p-4 cursor-pointer" onClick={() => setContactFilter(contactFilter === 'missing' ? 'all' : 'missing')}>
          <p className="text-sm text-destructive">{t.adminNoContact}</p>
          <p className="text-2xl font-bold text-destructive">
            {students.filter(s => !s.phone || !s.telegram_username).length}
          </p>
          <p className="text-xs text-destructive/70 mt-1">
            {contactFilter === 'missing' ? `✓ ${t.adminFiltered}` : t.adminClickToFilter}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t.adminStudentsSearchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? t.adminNoStudentsFound : t.adminNoStudentsYet}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.adminStudentHeader}</TableHead>
                <TableHead>{t.adminContact}</TableHead>
                <TableHead>{t.adminCountryHeader}</TableHead>
                <TableHead>{t.adminApplicationsHeader}</TableHead>
                <TableHead>{t.adminAgentHeader}</TableHead>
                <TableHead>{t.adminLockStatusHeader}</TableHead>
                <TableHead>{t.adminRegisteredHeader}</TableHead>
                <TableHead className="text-right">{t.adminActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {student.full_name || t.adminNoName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {student.phone ? (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {student.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-destructive">📵 {t.adminNoPhone}</span>
                          )}
                          {student.telegram_username ? (
                            <a
                              href={`https://t.me/${student.telegram_username.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Send className="w-3 h-3" />
                              {student.telegram_username}
                            </a>
                          ) : (
                            <span className="text-xs text-destructive">📵 {t.adminNoTelegram}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {student.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {student.email}
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {student.phone}
                        </div>
                      )}
                      {student.telegram_username && (
                        <div className="flex items-center gap-1 text-sm text-primary">
                          <Send className="w-3 h-3" />
                          <a 
                            href={`https://t.me/${student.telegram_username.replace('@', '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {student.telegram_username}
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.selected_country ? (
                      <Badge variant="secondary">{student.selected_country}</Badge>
                    ) : (
                      <span className="text-muted-foreground">{t.adminNotSelected}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{student.applications_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.assigned_agent ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-success" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {student.assigned_agent.agent_name || t.adminAgentHeader}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.assigned_agent.agent_email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-warning border-warning/30">
                        {t.adminUnassigned}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(student.featureOverrides || {}).length === 0 ? (
                        <span className="text-xs text-muted-foreground">{t.adminAutomatic}</span>
                      ) : (
                        <>
                          {student.featureOverrides?.jobs !== undefined && (
                            <Badge variant={student.featureOverrides.jobs ? 'default' : 'secondary'} className="text-xs">
                              {student.featureOverrides.jobs ? '✅' : '🔒'} Jobs
                            </Badge>
                          )}
                          {student.featureOverrides?.housing !== undefined && (
                            <Badge variant={student.featureOverrides.housing ? 'default' : 'secondary'} className="text-xs">
                              {student.featureOverrides.housing ? '✅' : '🔒'} Housing
                            </Badge>
                          )}
                          {student.featureOverrides?.arrival_preparation !== undefined && (
                            <Badge variant={student.featureOverrides.arrival_preparation ? 'default' : 'secondary'} className="text-xs">
                              {student.featureOverrides.arrival_preparation ? '✅' : '🔒'} Arrival
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(student.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFeatureStudent(student);
                          setFeatureDialogOpen(true);
                        }}
                        className="gap-1"
                      >
                        <Lock className="w-4 h-4" />
                        {t.adminLockAction}
                      </Button>
                      <Button
                        variant={student.assigned_agent ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => openAssignDialog(student)}
                        className="gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {student.assigned_agent ? t.adminChangeAction : t.adminSendToAgentAction}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Assign Agent Dialog */}
      <AssignAgentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        student={selectedStudent ? {
          user_id: selectedStudent.user_id,
          full_name: selectedStudent.full_name,
          email: selectedStudent.email,
        } : null}
        currentAgentId={selectedStudent?.assigned_agent?.agent_id}
        onAssigned={fetchStudents}
      />

      {/* Feature Override Dialog */}
      <FeatureOverrideDialog
        open={featureDialogOpen}
        onOpenChange={(open) => {
          setFeatureDialogOpen(open);
          if (!open) fetchStudents();
        }}
        student={featureStudent ? {
          user_id: featureStudent.user_id,
          full_name: featureStudent.full_name,
        } : null}
      />
    </div>
  );
}
