import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, metadata?: Record<string, unknown>) => Promise<{ data: any; error: Error | null }>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Safety timeout of 3.5 seconds to prevent infinite hangs
    const timeoutId = setTimeout(() => {
      if (active && isLoading) {
        console.warn('AuthContext: getSession timed out. Setting loading to false.');
        setIsLoading(false);
      }
    }, 3500);

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    }).catch(err => {
      console.error('AuthContext: getSession failed:', err);
      if (active) {
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (active) {
        setSession(s);
        setUser(s?.user ?? null);
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    });

    return () => {
      active = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signOut() {
    localStorage.removeItem('active_tenant');
    await supabase.auth.signOut();
  }

  async function signUp(email: string, password: string, fullName: string, metadata: Record<string, unknown> = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, ...metadata } },
    });
    return { data, error };
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
