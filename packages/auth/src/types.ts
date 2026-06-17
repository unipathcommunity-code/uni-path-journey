import type { User, Session } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Role hierarchy
// ---------------------------------------------------------------------------

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'owner'
  | 'manager'
  | 'accountant'
  | 'specialist'
  | 'mentor'
  | 'agent'
  | 'student'
  | 'user';

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'owner', 'manager', 'accountant'];
export const AGENT_ROLES: UserRole[] = ['specialist', 'mentor', 'agent'];
export const STUDENT_ROLES: UserRole[] = ['student', 'user'];

// ---------------------------------------------------------------------------
// Custom JWT claims
//
// These are injected into the Supabase JWT by a Supabase Database Hook
// (auth.users trigger or custom JWT template). When the hook is not yet
// deployed the fields will be undefined and consumers must fall back to DB
// queries.
// ---------------------------------------------------------------------------

export interface UniPathJWTClaims {
  /** Active tenant UUID */
  tenant_id?: string;
  /** User's role within that tenant */
  role?: UserRole;
  /** Active plan tier for quick entitlement checks */
  plan?: 'starter' | 'growth' | 'enterprise';
  /** Active branch UUID */
  branch_id?: string;
  /** Canonical business vertical (e.g. 'tour', 'academy') */
  vertical?: string;
}

// ---------------------------------------------------------------------------
// Auth context state
// ---------------------------------------------------------------------------

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  /** Custom JWT claims — null when hook is not deployed or user is signed out */
  claims: UniPathJWTClaims | null;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ error: Error | null; data: { user: User | null; session: Session | null } | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  resendOtp: (email: string) => Promise<{ error: Error | null }>;
}
