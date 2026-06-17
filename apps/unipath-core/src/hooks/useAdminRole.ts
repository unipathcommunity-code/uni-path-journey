import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAdminRole() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminRole() {
      setIsLoading(true);
      if (!user) {
        setIsAdmin(false);
        setLoadedUserId(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profileError && (['super_admin','admin','owner','manager','accountant'].includes(profile?.role ?? ''))) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setLoadedUserId(user.id);
      } catch (err) {
        console.warn('useAdminRole: check failed, defaulting to false:', err);
        setIsAdmin(false);
        setLoadedUserId(user.id);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminRole();
  }, [user]);

  const isFetching = isLoading || (user !== null && loadedUserId !== user.id);

  return { isAdmin, isLoading: isFetching };
}
