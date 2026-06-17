import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAgentRole() {
  const { user } = useAuth();
  const [isAgent, setIsAgent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAgentRole() {
      if (!user) {
        setIsAgent(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profileError && (['specialist','mentor','agent'].includes(profile?.role ?? ''))) {
          setIsAgent(true);
        } else {
          setIsAgent(false);
        }
      } catch (err) {
        console.warn('useAgentRole: check failed, defaulting to false:', err);
        setIsAgent(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAgentRole();
  }, [user]);

  return { isAgent, isLoading };
}
