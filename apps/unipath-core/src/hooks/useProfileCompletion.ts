import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useInvalidateProfile } from '@/hooks/useProfile';

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

export const documentTypesQueryKey = (userId: string | null | undefined) =>
  ['document-types', userId ?? null];

/**
 * How far along the student is: required profile fields + required documents.
 *
 * Both inputs are shared queries (`useProfile` and the document-type query
 * below), so mounting this hook in several components costs one round-trip
 * each, not one per component.
 */
export function useProfileCompletion(): ProfileCompletionState {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const { profile, isLoading: profileLoading } = useProfile();
  const invalidateProfile = useInvalidateProfile();

  const docsQuery = useQuery({
    queryKey: documentTypesQueryKey(userId),
    enabled: !!userId,
    staleTime: 60_000,
    retry: 1,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select('document_type')
        .eq('user_id', userId as string);
      if (error) throw error;
      return (data ?? []).map((d: { document_type: string }) => d.document_type);
    },
  });

  const refresh = useCallback(async () => {
    await Promise.all([
      invalidateProfile(),
      queryClient.invalidateQueries({ queryKey: documentTypesQueryKey(userId) }),
    ]);
  }, [invalidateProfile, queryClient, userId]);

  return useMemo(() => {
    const loading = !!userId && (profileLoading || docsQuery.isLoading);

    const missing: string[] = [];
    if (!profile) {
      missing.push(
        ...REQUIRED_PROFILE_FIELDS.map((f) =>
          f === 'full_name' ? 'Full Name' : f === 'phone' ? 'Phone Number' : 'Telegram Username',
        ),
      );
    } else {
      if (!profile.full_name?.trim()) missing.push('Full Name');
      if (!profile.phone?.trim()) missing.push('Phone Number');
    }

    const uploadedTypes = new Set(docsQuery.data ?? []);
    for (const docType of REQUIRED_DOC_TYPES) {
      if (!uploadedTypes.has(docType)) missing.push(DOC_TYPE_LABELS[docType] || docType);
    }

    const totalChecks = REQUIRED_PROFILE_FIELDS.length + REQUIRED_DOC_TYPES.length;
    const percentage = Math.round(((totalChecks - missing.length) / totalChecks) * 100);

    return {
      isComplete: missing.length === 0,
      percentage,
      missingFields: missing,
      loading,
      refresh,
    };
  }, [userId, profile, profileLoading, docsQuery.data, docsQuery.isLoading, refresh]);
}
