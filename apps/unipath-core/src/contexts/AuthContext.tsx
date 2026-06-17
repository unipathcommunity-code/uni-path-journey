// Bridge: delegates to @unipath/auth so all existing useAuth() imports keep
// working without modification. The shared provider adds JWT claim extraction.
import React, { type ReactNode } from 'react';
import {
  AuthProvider as SharedAuthProvider,
  useAuth,
  AuthContext,
} from '@unipath/auth';
import { supabase } from '@/integrations/supabase/client';

export { useAuth, AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <SharedAuthProvider client={supabase as any}>{children}</SharedAuthProvider>;
}
