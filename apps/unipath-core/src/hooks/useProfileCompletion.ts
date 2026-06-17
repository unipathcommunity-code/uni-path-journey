import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileCompletionState {
  isComplete: boolean;
  percentage: number;
  missingFields: string[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const REQUIRED_PROFILE_FIELDS = ['full_name', 'phone'];

const REQUIRED_DOC_TYPES = ['passport', 'language_cert', 'diploma'];

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport Copy',
  language_cert: 'IELTS / Language Certificate',
  diploma: 'Diploma / Transcripts',
};

export function useProfileCompletion(): ProfileCompletionState {
  const { user } = useAuth();
  const [state, setState] = useState<ProfileCompletionState>({
    isComplete: false,
    percentage: 0,
    missingFields: [],
    loading: true,
    refresh: async () => {},
  });

  const check = useCallback(async () => {
    if (!user) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const missing: string[] = [];

    // Check profile fields
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, telegram_username')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      missing.push(...REQUIRED_PROFILE_FIELDS.map(f => f === 'full_name' ? 'Full Name' : f === 'phone' ? 'Phone Number' : 'Telegram Username'));
    } else {
      if (!profile.full_name?.trim()) missing.push('Full Name');
      if (!profile.phone?.trim()) missing.push('Phone Number');
    }

    // Check required documents
    const { data: docs } = await supabase
      .from('documents')
      .select('document_type')
      .eq('user_id', user.id);

    const uploadedTypes = new Set(docs?.map(d => d.document_type) || []);
    for (const docType of REQUIRED_DOC_TYPES) {
      if (!uploadedTypes.has(docType)) {
        missing.push(DOC_TYPE_LABELS[docType] || docType);
      }
    }

    const totalChecks = REQUIRED_PROFILE_FIELDS.length + REQUIRED_DOC_TYPES.length;
    const completed = totalChecks - missing.length;
    const percentage = Math.round((completed / totalChecks) * 100);

    setState({
      isComplete: missing.length === 0,
      percentage,
      missingFields: missing,
      loading: false,
      refresh: check,
    });
  }, [user]);

  useEffect(() => {
    check();
  }, [check]);

  return state;
}
