import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { TypedSupabaseClient } from '@unipath/db';
import type { AuthContextValue, UniPathJWTClaims, UserRole } from './types';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// JWT claim extraction
//
// Supabase exposes custom claims via user.app_metadata (set by DB hooks).
// Falls back gracefully when the hook hasn't been deployed yet.
// ---------------------------------------------------------------------------

function extractJWTClaims(user: User | null): UniPathJWTClaims | null {
  if (!user) return null;
  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const hasClaims =
    'tenant_id' in meta || 'unipath_role' in meta || 'plan' in meta;
  if (!hasClaims) return null;

  return {
    tenant_id: meta.tenant_id as string | undefined,
    role: (meta.unipath_role ?? meta.role) as UserRole | undefined,
    plan: meta.plan as UniPathJWTClaims['plan'] | undefined,
    branch_id: meta.branch_id as string | undefined,
    vertical: meta.vertical as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface AuthProviderProps {
  /** Configured Supabase client from @unipath/db */
  client: TypedSupabaseClient;
  children: ReactNode;
  /** Base URL used for email redirect links. Defaults to window.location.origin */
  siteUrl?: string;
}

export function AuthProvider({ client, children, siteUrl }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claims, setClaims] = useState<UniPathJWTClaims | null>(null);

  useEffect(() => {
    // Subscribe FIRST, then read existing session to avoid race conditions.
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setClaims(extractJWTClaims(s?.user ?? null));
      setIsLoading(false);
    });

    // Add a race condition timeout to avoid infinite loading if getSession hangs
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 3000);

    client.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setClaims(extractJWTClaims(s?.user ?? null));
      setIsLoading(false);
      clearTimeout(timeout);
    }).catch(() => {
      setIsLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [client]);

  const origin = siteUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    metadata: Record<string, unknown> = {}
  ) => {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/`,
        data: { full_name: fullName, ...metadata },
      },
    });
    return {
      error: error as Error | null,
      data: data ? { user: data.user ?? null, session: data.session ?? null } : null,
    };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await client.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('active_tenant');
    }
    await client.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth?type=recovery`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await client.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await client.auth.verifyOtp({ email, token, type: 'signup' });
    return { error: error as Error | null };
  };

  const resendOtp = async (email: string) => {
    const { error } = await client.auth.resend({ type: 'signup', email });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        claims,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        verifyOtp,
        resendOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be called inside <AuthProvider>');
  return ctx;
}

export { AuthContext };
