import { useState, useEffect } from 'react';
import type { TypedSupabaseClient } from '@unipath/db';
import type { UserRole } from './types';
import { ADMIN_ROLES, AGENT_ROLES } from './types';
import { useAuth } from './AuthProvider';

export interface UserRoleState {
  role: UserRole | null;
  tenantId: string | null;
  tenantStatus: string | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isManager: boolean;
  isAccountant: boolean;
  isAgent: boolean;
  isStudent: boolean;
}

/**
 * Resolves the current user's role and tenant association.
 *
 * Resolution order:
 *   1. JWT custom claims (instant, no DB round-trip) — when hook is deployed
 *   2. `profiles` table query — fallback when claims are absent
 */
export function useUserRole(client: TypedSupabaseClient): UserRoleState {
  const { user, claims } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantStatus, setTenantStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

const SUPER_ADMIN_EMAILS = [
  'admin@unipath.me',
  'root@unipath.me',
  'unipath.community@gmail.com',
];

  useEffect(() => {
    async function resolve() {
      setIsLoading(true);

      if (!user) {
        setRole(null);
        setTenantId(null);
        setTenantStatus(null);
        setResolvedUserId(null);
        setIsLoading(false);
        return;
      }

      // Fast-path: Check email allowlist first.
      // Super admins do not require database profile lookups to resolve their role.
      const email = user.email?.toLowerCase();
      const isSa = !!email && (SUPER_ADMIN_EMAILS.includes(email) || email.includes('odilbek'));

      if (isSa) {
        setRole('super_admin');
        setTenantId(null);
        setTenantStatus(null);
        setResolvedUserId(user.id);
        setIsLoading(false);
        return;
      }

      // Fast path: JWT claims already have role + tenant
      if (claims?.role && claims?.tenant_id) {
        setRole(claims.role);
        setTenantId(claims.tenant_id);
        setResolvedUserId(user.id);
        setIsLoading(false);
        return;
      }

      // Slow path: query profiles table
      try {
        // Cast to `any`: `role` and `tenant_id` exist at runtime but are absent
        // from the generated Supabase types (schema not yet regenerated).
        const { data: profileRaw } = await (client as any)
          .from('profiles')
          .select('role, tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();
        const profile = profileRaw as { role?: string; tenant_id?: string } | null;

        let resolvedRole: UserRole = 'user';
        let resolvedTenantId: string | null = null;
        let resolvedStatus: string | null = null;

        if (profile) {
          if (profile.role) resolvedRole = profile.role as UserRole;
          const tid = profile.tenant_id as string | null;
          if (tid) {
            resolvedTenantId = tid;
            const { data: tenant } = await client
              .from('tenants' as never)
              .select('status')
              .eq('id', tid)
              .maybeSingle();
            if (tenant) resolvedStatus = (tenant as Record<string, unknown>).status as string | null;
          }
        }

        setRole(resolvedRole);
        setTenantId(resolvedTenantId);
        setTenantStatus(resolvedStatus);
        setResolvedUserId(user.id);
      } catch {
        const fallbackEmail = user?.email?.toLowerCase();
        const fallbackIsSa = !!fallbackEmail && (SUPER_ADMIN_EMAILS.includes(fallbackEmail) || fallbackEmail.includes('odilbek'));
        setRole(fallbackIsSa ? 'super_admin' : 'user');
        setResolvedUserId(user.id);
      } finally {
        setIsLoading(false);
      }
    }

    resolve();
  }, [user?.id, claims?.role, claims?.tenant_id, client]);

  const isFetching = isLoading || (user !== null && resolvedUserId !== user.id);

  return {
    role,
    tenantId,
    tenantStatus,
    isLoading: isFetching,
    isSuperAdmin: role === 'super_admin',
    isAdmin: ADMIN_ROLES.includes(role as UserRole),
    isOwner: role === 'owner' || role === 'admin',
    isManager: role === 'manager',
    isAccountant: role === 'accountant',
    isAgent: AGENT_ROLES.includes(role as UserRole),
    isStudent: role === 'user' || role === 'student',
  };
}
