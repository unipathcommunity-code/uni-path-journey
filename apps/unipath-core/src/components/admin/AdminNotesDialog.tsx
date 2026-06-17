import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface AdminNotesDialogProps {
  applicationId: string;
  applicationTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminNotesDialog({
  applicationId,
  applicationTitle,
  open,
  onOpenChange,
}: AdminNotesDialogProps) {
  const [notes, setNotes] = useState('');
  const [existingNoteId, setExistingNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && applicationId) {
      fetchNotes();
    }
  }, [open, applicationId]);

  async function fetchNotes() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('application_admin_notes')
        .select('id, notes')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching notes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load admin notes',
          variant: 'destructive',
        });
      } else if (data) {
        setNotes(data.notes || '');
        setExistingNoteId(data.id);
      } else {
        setNotes('');
        setExistingNoteId(null);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      if (existingNoteId) {
        // Update existing note
        const { error } = await supabase
          .from('application_admin_notes')
          .update({ notes })
          .eq('id', existingNoteId);

        if (error) throw error;
      } else {
        // Insert new note
        const { error } = await supabase
          .from('application_admin_notes')
          .insert({ application_id: applicationId, notes });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Admin notes saved successfully',
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error saving notes:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save admin notes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Admin Notes</DialogTitle>
          <p className="text-sm text-muted-foreground">{applicationTitle}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder="Enter confidential admin notes here... These notes are only visible to admins."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ These notes are confidential and will not be visible to applicants.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Notes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
