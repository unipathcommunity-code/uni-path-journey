import React, { createContext, useCallback, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
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

  // supabase-js re-emits the session on token refresh and on tab focus. Those
  // carry a NEW user object with identical contents; storing it would change
  // the identity every consumer depends on, so only store real changes.
  const applySession = useCallback((s: Session | null) => {
    setSession((prev) => (prev?.access_token === s?.access_token ? prev : s));
    setUser((prev) => (prev?.id === s?.user?.id ? prev : (s?.user ?? null)));
    setClaims((prev) => {
      const next = extractJWTClaims(s?.user ?? null);
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Subscribe FIRST, then read existing session to avoid race conditions.
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, s) => {
      applySession(s);
    });

    // Add a race condition timeout to avoid infinite loading if getSession hangs
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 3000);

    client.auth.getSession().then(({ data: { session: s } }) => {
      applySession(s);
      clearTimeout(timeout);
    }).catch(() => {
      setIsLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
    // isLoading is read only inside the timeout guard; re-subscribing on it
    // would tear down the auth listener on every load flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, applySession]);

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
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('active_tenant');
      }
      await Promise.race([
        client.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000))
      ]);
    } catch (e) {
      console.warn("Sign out failed or timed out:", e);
      if (typeof window !== 'undefined') {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            window.localStorage.removeItem(key);
          }
        }
      }
    }
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

  const value = useMemo(
    () => ({
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
    }),
    // The auth action closures only read `client` and `origin`, both stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, session, isLoading, claims, client, origin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
