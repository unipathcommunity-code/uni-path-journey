import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * The signed-in student's documents, fetched once and shared.
 *
 * Four widgets on the student dashboard each ran their own `documents` query
 * with a slightly different select. One shared row set covers all of them and
 * removes ~8 round-trips per page load.
 */

export interface DocumentRow {
  id: string;
  document_type: string | null;
  status: string | null;
  created_at: string | null;
}

export const myDocumentsQueryKey = (userId: string | null | undefined) =>
  ['my-documents', userId ?? null];

export function useMyDocuments() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: myDocumentsQueryKey(userId),
    enabled: !!userId,
    staleTime: 60_000,
    retry: 1,
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, document_type, status, created_at')
        .eq('user_id', userId as string);
      if (error) throw error;
      return (data as DocumentRow[]) ?? [];
    },
  });

  const documents = query.data ?? [];

  return {
    documents,
    count: documents.length,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
