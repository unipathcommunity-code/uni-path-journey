import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * The signed-in user's `profiles` row, fetched once and shared.
 *
 * Five components render together on the student dashboard and each used to
 * run its own `from('profiles')` select. With React StrictMode that was ~10
 * identical round-trips per page load, and it was a big part of why Supabase
 * started answering ERR_HTTP2_SERVER_REFUSED_STREAM. TanStack Query dedupes
 * them into one.
 *
 * Anything that writes to `profiles` should call `useInvalidateProfile()`
 * afterwards so every consumer refreshes.
 */

export const profileQueryKey = (userId: string | null | undefined) => ['profile', userId ?? null];

export interface ProfileRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  telegram_username: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  avatar_url: string | null;
  role: string | null;
  tenant_id: string | null;
  organization_id: string | null;
  selected_country: string | null;
  preferred_language: string | null;
  [key: string]: unknown;
}

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: profileQueryKey(userId),
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId as string)
        .maybeSingle();
      if (error) throw error;
      return (data as ProfileRow) ?? null;
    },
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) }),
    [queryClient, userId],
  );
}
