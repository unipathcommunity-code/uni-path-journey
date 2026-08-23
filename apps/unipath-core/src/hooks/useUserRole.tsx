import {
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
  createContext,
  type ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TenantContext } from '@unipath/tenant';

export type UserRole = string | null;

// Roles that have admin-level access (can enter /admin/* routes)
export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'owner', 'manager', 'accountant'];
// Roles that use the agent layout
export const AGENT_ROLES: UserRole[] = ['specialist', 'mentor', 'agent'];

// Emails always treated as platform super_admin (lowercase). Also keep these
// users' DB profiles.role = 'super_admin' so server-side RLS recognizes them.
// The ONE and only platform super admin. Everything else is a normal tenant user.
export const SUPER_ADMIN_EMAILS: string[] = [
  'unipath.community@gmail.com',
];

function useResolvedUserRole() {
  const { user } = useAuth();
  // Identity of `user` churns on every token refresh; the id does not.
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;
  // Read the resolved tenant directly from context (not useTenant()) so this
  // hook stays safe even when mounted outside a TenantProvider.
  const tenantCtx = useContext(TenantContext as any) as any;
  const activeTenantId: string | null = tenantCtx?.activeTenant?.id ?? null;
  const [role, setRole] = useState<UserRole>(null);
  const [roleSource, setRoleSource] = useState<'membership' | 'profile' | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantStatus, setTenantStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const queryFinishedRef = useRef(false);

  useEffect(() => {
    let active = true;
    queryFinishedRef.current = false;

    // Safety timeout of 3.5 seconds to prevent infinite hangs. For a known
    // super-admin email, default to 'super_admin' (not 'user') so the platform
    // owner is never locked out by a slow role lookup.
    const timeoutId = setTimeout(() => {
      if (active && !queryFinishedRef.current && userId) {
        const email = userEmail?.toLowerCase();
        const isSa = !!email && (SUPER_ADMIN_EMAILS.includes(email));
        console.warn('useUserRole: checkUserRole timed out after 3.5s. Defaulting role. isSa:', isSa);
        setRole(isSa ? 'super_admin' : 'user');
        setLoadedUserId(userId);
        setIsLoading(false);
        queryFinishedRef.current = true;
      }
    }, 3500);

    async function checkUserRole() {
      setIsLoading(true);
      if (!userId) {
        // Nothing to resolve — settle immediately and stand the timer down.
        queryFinishedRef.current = true;
        clearTimeout(timeoutId);
        if (active) {
          setRole(null);
          setTenantId(null);
          setTenantStatus(null);
          setLoadedUserId(null);
          setIsLoading(false);
        }
        return;
      }

      // Fast-path: Check email allowlist first.
      // Super admins do not require database profile lookups to resolve their role.
      // This protects them from database network timeouts, adblocker blocks, or RLS failures.
      const email = user.email?.toLowerCase();
      const isSa = !!email && (SUPER_ADMIN_EMAILS.includes(email));

      if (isSa) {
        console.log('useUserRole: detected super admin email, executing fast-path role resolution');
        let tId: string | null = null;
        let tStatus: string | null = null;

        // Override with impersonated/selected tenant from localStorage if present
        const impRaw = typeof window !== 'undefined' ? window.localStorage.getItem('active_tenant') : null;
        if (impRaw) {
          try {
            const parsed = JSON.parse(impRaw);
            if (parsed && parsed.id) {
              tId = parsed.id;
              tStatus = parsed.status || null;
              console.log('useUserRole: loaded impersonated tenant:', tId);
            }
          } catch (e) {
            console.warn('useUserRole: failed to parse active_tenant:', e);
          }
        }

        if (active) {
          setRole('super_admin');
          setTenantId(tId);
          setTenantStatus(tStatus);
          setLoadedUserId(user.id);
          setIsLoading(false);
          queryFinishedRef.current = true;
          clearTimeout(timeoutId);
        }
        return;
      }

      // Normal path for non-superadmin users:
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

        if (profileError) {
          console.warn('useUserRole: profile fetch error:', profileError.message);
        }

        if (!profileError && profile) {
          if (profile.role) {
            currentRole = profile.role as UserRole;
          }
          if (profile.tenant_id) {
            tId = profile.tenant_id;

            const { data: tenant, error: tenantError } = await supabase
              .from('tenants')
              .select('status')
              .eq('id', profile.tenant_id)
              .maybeSingle();

            if (tenantError) {
              console.warn('useUserRole: tenant status fetch error:', tenantError.message);
            } else if (tenant) {
              tStatus = tenant.status;
            }
          }
        }

        // 2. Membership role for the ACTIVE tenant (one account, many agencies).
        //    If the user has a tenant_memberships row for the current subdomain's
        //    tenant, that per-business role wins over the global profiles.role.
        let fromMembership = false;
        if (activeTenantId) {
          try {
            const { data: mRole, error: mErr } = await (supabase as any)
              .rpc('get_membership_role', { p_tenant_id: activeTenantId });
            if (!mErr && mRole) {
              currentRole = mRole as UserRole;
              tId = activeTenantId;
              fromMembership = true;
            }
          } catch (e) {
            // RPC may not exist until the migration is applied — fall back silently.
            console.warn('useUserRole: get_membership_role unavailable:', e);
          }
        }

        // Owning a business makes you an owner — even if profiles.role was never
        // set to 'owner' (e.g. the handle_new_user trigger didn't copy the role
        // from signup metadata).
        if (user.email && (currentRole === 'user' || currentRole === 'student' || !currentRole)) {
          const { data: ownedTenant, error: ownerError } = await supabase
            .from('tenants')
            .select('id')
            .eq('owner_email', user.email)
            .limit(1)
            .maybeSingle();
          
          if (!ownerError && ownedTenant) {
            currentRole = 'owner';
          }
        }

        // Override with impersonated/selected tenant from localStorage if present
        const impRaw = typeof window !== 'undefined' ? window.localStorage.getItem('active_tenant') : null;
        if (impRaw) {
          try {
            const parsed = JSON.parse(impRaw);
            if (parsed && parsed.id) {
              tId = parsed.id;
              tStatus = parsed.status || null;
            }
          } catch (e) {
            console.warn('useUserRole: failed to parse active_tenant:', e);
          }
        }

        if (active) {
          setRole(currentRole);
          setRoleSource(fromMembership ? 'membership' : 'profile');
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
          queryFinishedRef.current = true;
          clearTimeout(timeoutId);
        }
      }
    }

    checkUserRole();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
    // Keyed by identity, not by object reference — see `userId` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail, activeTenantId]);

  const isFetching = isLoading || (userId !== null && loadedUserId !== userId);

  return useMemo(
    () => ({
      role,
      roleSource,
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
    }),
    [role, roleSource, tenantId, tenantStatus, isFetching],
  );
}


// ---------------------------------------------------------------------------
// Single-resolution context
// ---------------------------------------------------------------------------
// useUserRole used to be a plain hook called from 13 components. Each call site
// mounted its own effect and fired its own `profiles` + `tenants` round-trips,
// so a single page load hammered Supabase hard enough to get answered with
// ERR_HTTP2_SERVER_REFUSED_STREAM. The role is now resolved once, at the top of
// the tree, and shared.

export type UserRoleValue = ReturnType<typeof useResolvedUserRole>;

const UserRoleContext = createContext<UserRoleValue | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const value = useResolvedUserRole();
  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}

export function useUserRole(): UserRoleValue {
  const ctx = useContext(UserRoleContext);
  if (!ctx) {
    throw new Error(
      'useUserRole must be used within <UserRoleProvider> (mounted in App.tsx ' +
        'below TenantProvider and AuthProvider).',
    );
  }
  return ctx;
}
