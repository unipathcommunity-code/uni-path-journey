import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = string | null;

// Roles that have admin-level access (can enter /admin/* routes)
export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'owner', 'manager', 'accountant'];
// Roles that use the agent layout
export const AGENT_ROLES: UserRole[] = ['specialist', 'mentor', 'agent'];

// Emails always treated as platform super_admin (lowercase). Also keep these
// users' DB profiles.role = 'super_admin' so server-side RLS recognizes them.
export const SUPER_ADMIN_EMAILS: string[] = [
  'admin@unipath.me',
  'root@unipath.me',
  'unipath.community@gmail.com',
];

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantStatus, setTenantStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Safety timeout of 3.5 seconds to prevent infinite hangs. For a known
    // super-admin email, default to 'super_admin' (not 'user') so the platform
    // owner is never locked out by a slow role lookup.
    const timeoutId = setTimeout(() => {
      if (active && isLoading) {
        const isSa = !!user?.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
        console.warn('useUserRole: checkUserRole timed out after 3.5s. Defaulting role.');
        setRole(isSa ? 'super_admin' : 'user');
        setLoadedUserId(user ? user.id : null);
        setIsLoading(false);
      }
    }, 3500);

    async function checkUserRole() {
      setIsLoading(true);
      if (!user) {
        if (active) {
          setRole(null);
          setTenantId(null);
          setTenantStatus(null);
          setLoadedUserId(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        let currentRole: UserRole = 'user';
        let tId: string | null = null;
        let tStatus: string | null = null;

        // 1. Check profiles table for role and tenant_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profileError && profile) {
          if (profile.role) {
            currentRole = profile.role as UserRole;
          }
          if (profile.tenant_id) {
            tId = profile.tenant_id;

            const { data: tenant } = await supabase
              .from('tenants')
              .select('status')
              .eq('id', profile.tenant_id)
              .maybeSingle();

            if (tenant) {
              tStatus = tenant.status;
            }
          }
        }

        // Owning a business makes you an owner — even if profiles.role was never
        // set to 'owner' (e.g. the handle_new_user trigger didn't copy the role
        // from signup metadata). Without this, a business owner could be
        // mis-routed to the student dashboard on the root domain. Only upgrades
        // plain users; never downgrades staff/admin roles. (Relies on the owner
        // SELECT policy from supabase_owner_multi_business.sql; fails safe to no
        // upgrade if the user can't read any owned tenant.)
        if (user.email && (currentRole === 'user' || currentRole === 'student' || !currentRole)) {
          const { data: ownedTenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('owner_email', user.email)
            .limit(1)
            .maybeSingle();
          if (ownedTenant) {
            currentRole = 'owner';
          }
        }

        // Auto-grant super_admin for system/owner emails. Runs even when no
        // profile row exists yet, so the platform owner is never mis-routed to
        // the student dashboard. Keep DB `profiles.role` in sync too (RLS
        // is_super_admin() reads the DB/JWT, not this allowlist).
        if (user.email) {
          const email = user.email.toLowerCase();
          if (
            SUPER_ADMIN_EMAILS.includes(email) ||
            email.includes('odilbek')
          ) {
            currentRole = 'super_admin';
          }
        }

        if (active) {
          setRole(currentRole);
          setTenantId(tId);
          setTenantStatus(tStatus);
          setLoadedUserId(user.id);
        }
      } catch (err) {
        console.warn('useUserRole: role check failed, defaulting to user:', err);
        if (active) {
          setRole('user');
          setLoadedUserId(user.id);
        }
      } finally {
        if (active) {
          setIsLoading(false);
          clearTimeout(timeoutId);
        }
      }
    }

    checkUserRole();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [user]);

  const isFetching = isLoading || (user !== null && loadedUserId !== user.id);

  return {
    role,
    tenantId,
    tenantStatus,
    isLoading: isFetching,
    isSuperAdmin: role === 'super_admin',
    isAdmin: ADMIN_ROLES.includes(role),
    isOwner: role === 'owner' || role === 'admin',
    isManager: role === 'manager',
    isAccountant: role === 'accountant',
    isAgent: AGENT_ROLES.includes(role),
    isStudent: role === 'user' || role === 'student',
  };
}
