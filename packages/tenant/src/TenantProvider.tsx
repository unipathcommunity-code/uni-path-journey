import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import type { TypedSupabaseClient } from '@unipath/db';
import type { Tenant, BranchConfig, TenantContextValue } from './types';
import { mapTenant } from './verticals';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Core domain list — subdomains on these are tenant slugs, not custom domains
// ---------------------------------------------------------------------------

const DEFAULT_CORE_DOMAINS = [
  'unipath.me',
  'unipath.uz',
  'localhost',
  '127.0.0.1',
  'vercel.app',
];

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface TenantProviderProps {
  /** Configured Supabase client from @unipath/db */
  client: TypedSupabaseClient;
  children: ReactNode;
  /**
   * Override the list of "core" domains where subdomains are treated as tenant
   * slugs. Useful in tests or different deployment environments.
   */
  coreDomains?: string[];
  /**
   * Emails always treated as platform super_admin for impersonation, even if
   * the DB `profiles.role` hasn't been set to 'super_admin' yet (e.g. the
   * set-superadmin migration hasn't run). Mirrors the frontend allowlist so
   * "enter business (impersonate)" works for the platform owner. Lowercased.
   */
  superAdminEmails?: string[];
}

export function TenantProvider({
  client,
  children,
  coreDomains = DEFAULT_CORE_DOMAINS,
  superAdminEmails = [],
}: TenantProviderProps) {
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(() => {
    if (typeof window === 'undefined') return null;

    // If we are on the root domain, do NOT load active_tenant from localStorage on mount!
    // Except if there is a tenant override in query parameters.
    const hostname = window.location.hostname;
    const isRoot =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.vercel.app') ||
      hostname === 'vercel.app' ||
      coreDomains.some((d) => hostname === d || hostname === 'www.' + d);

    const params = new URLSearchParams(window.location.search);
    const hasTenantOverride = !!(params.get('tenant') ?? params.get('company') ?? window.sessionStorage.getItem('unipath_session_tenant'));

    if (isRoot && !hasTenantOverride) {
      return null;
    }

    const raw = window.localStorage.getItem('active_tenant');
    if (!raw) return null;
    try { return mapTenant(JSON.parse(raw)); } catch { return null; }
  });

  const [isTenantLoading, setIsTenantLoading] = useState(true);
  const resolveInFlight = useRef<Promise<void> | null>(null);
  const [activeBranch, setActiveBranch] = useState<BranchConfig | null>(null);
  const [availableBranches, setAvailableBranches] = useState<BranchConfig[]>([]);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [ownedTenants, setOwnedTenants] = useState<Tenant[]>([]);
  const [isOwnerSwitch, setIsOwnerSwitch] = useState(false);

  // ── Subdomain / custom-domain resolution ──────────────────────────────────

  useEffect(() => {
    resolveTenant();
    
    // Safety net: never leave the spinner up indefinitely. Must be longer than
    // the resolution budget above, or it hides a resolution still in flight.
    const timeout = setTimeout(() => {
      setIsTenantLoading(false);
    }, 13000);
    
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-resolve on auth state changes ──────────────────────────────────────
  // Re-fetch tenant when the user logs in (profile.tenant_id becomes readable)
  // and clear it on sign-out (unless impersonation is active).
  useEffect(() => {
    // NOTE: supabase-js holds its auth lock for the lifetime of this callback.
    // Any Supabase call made synchronously inside it deadlocks, so every branch
    // that touches the client must be deferred with setTimeout(..., 0).
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN') {
          setTimeout(() => { void resolveTenant(); }, 0);
        } else if (event === 'SIGNED_OUT') {
          const hasImpersonation =
            typeof window !== 'undefined' &&
            !!window.localStorage.getItem('active_tenant');
          if (!hasImpersonation) {
            setActiveTenant(null);
            setIsImpersonating(false);
          }
          setIsTenantLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  async function resolveTenant(attempt = 1) {
    // Coalesce overlapping calls (mount effect + SIGNED_IN + StrictMode
    // double-invoke) onto a single in-flight resolution.
    if (attempt === 1 && resolveInFlight.current) {
      return resolveInFlight.current;
    }

    setIsTenantLoading(true);

    const resolvePromise = (async () => {
      // 1. Active tenant from localStorage — either SuperAdmin impersonation
      //    or an owner switching between businesses they own.
      const impRaw = typeof window !== 'undefined'
        ? window.localStorage.getItem('active_tenant')
        : null;

      if (impRaw) {
        let parsed: any = null;
        try { parsed = JSON.parse(impRaw); } catch { parsed = null; }

        const { data: sessionData } = await client.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        const userEmail = sessionData?.session?.user?.email ?? null;

        let isSuperAdmin = false;
        if (userId) {
          const { data: profile } = await (client as any)
            .from('profiles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();

          isSuperAdmin = profile?.role === 'super_admin';
        }
        // Email-allowlist fallback: the platform owner is super_admin on the
        // frontend (and reached the impersonate button) even if the DB role
        // lookup said otherwise — honor the impersonation instead of clearing it.
        if (!isSuperAdmin && userEmail && superAdminEmails.includes(userEmail.toLowerCase())) {
          isSuperAdmin = true;
        }

        // 1a. SuperAdmin → trust the stored row (impersonation).
        if (parsed && isSuperAdmin) {
          setActiveTenant(mapTenant(parsed));
          setIsImpersonating(true);
          setIsOwnerSwitch(false);
          return;
        }

        // 1b. Owner business-switch → honor only if the signed-in user owns the
        //     target tenant. Re-fetch from DB (RLS-protected) both to validate
        //     ownership and to refresh against tampered/stale localStorage.
        if (parsed?.id && userEmail) {
          const { data: ownedRow } = await client
            .from('tenants' as never)
            .select('*')
            .eq('id', parsed.id)
            .maybeSingle();

          const ownerEmail = (ownedRow as any)?.owner_email as string | null;
          if (
            ownedRow &&
            ownerEmail &&
            ownerEmail.toLowerCase() === userEmail.toLowerCase()
          ) {
            setActiveTenant(mapTenant(ownedRow as any));
            setIsOwnerSwitch(true);
            setIsImpersonating(false);
            return;
          }
        }

        // 1c. Neither SuperAdmin nor owner of the target → clear it to prevent
        //     tenant bleeding, then continue with normal resolution.
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('active_tenant');
        }
        setIsImpersonating(false);
        setIsOwnerSwitch(false);
      }

      if (typeof window === 'undefined') {
        return;
      }

      const hostname = window.location.hostname;
      const params = new URLSearchParams(window.location.search);

      // 2. SSO token in query string (cross-subdomain login redirect)
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          const clean = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', clean);
        }
      }

      // 3. Resolve subdomain
      const isCore = coreDomains.some(
        (d) => hostname === d || hostname.endsWith('.' + d)
      );
      const isRoot =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.vercel.app') ||
        hostname === 'vercel.app' ||
        coreDomains.some((d) => hostname === d || hostname === 'www.' + d);

      let subdomain: string | null = null;

      // ?tenant= query param takes priority (local dev convenience)
      const tenantParam = params.get('tenant') ?? params.get('company');
      if (tenantParam) {
        subdomain = tenantParam;
        window.sessionStorage.setItem('unipath_session_tenant', subdomain);
      } else if (isRoot) {
        window.sessionStorage.removeItem('unipath_session_tenant');
      } else {
        const stored = window.sessionStorage.getItem('unipath_session_tenant');
        if (stored) subdomain = stored;
      }

      if (!subdomain) {
        const matchedCore = coreDomains.find((d) => hostname.endsWith('.' + d));
        if (matchedCore) {
          const prefix = hostname.slice(0, hostname.length - matchedCore.length - 1);
          const seg = prefix.split('.').pop();
          if (seg && seg !== 'www') subdomain = seg;
        } else if (hostname.endsWith('.localhost')) {
          subdomain = hostname.split('.')[0];
        }
      }

      // Skip if subdomain is literally 'unipath' on a core domain
      if (subdomain && !(subdomain === 'unipath' && isCore)) {
        const { data } = await client
          .from('tenants' as never)
          .select('*')
          .eq('subdomain', subdomain.toLowerCase())
          .maybeSingle();

        if (data) {
          setActiveTenant(mapTenant(data as any));
          setIsImpersonating(false);
          return;
        }
      }

      // 4. Custom domain lookup (hostname not in core domains)
      if (!isCore) {
        const { data } = await client
          .from('tenants' as never)
          .select('*')
          .eq('custom_domain', hostname.toLowerCase())
          .maybeSingle();

        if (data) {
          setActiveTenant(mapTenant(data as any));
          setIsImpersonating(false);
          return;
        }
      }

      // 5. Authenticated user → resolve tenant from profiles.tenant_id
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (userId && !isRoot) {
        const { data: profile } = await (client as any)
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', userId)
          .maybeSingle();

        const tenantId = (profile as any)?.tenant_id as string | null;

        if (tenantId) {
          const { data: tenantData } = await client
            .from('tenants' as never)
            .select('*')
            .eq('id', tenantId)
            .maybeSingle();

          if (tenantData) {
            setActiveTenant(mapTenant(tenantData as any));
            setIsImpersonating(false);
            return;
          }
        }
      }

      // No tenant found — root domain or unauthenticated landing page
      setActiveTenant(null);
      setIsImpersonating(false);
    })();

    // 8s is generous enough for a cold connection while still bounding the
    // spinner. A slow answer is not the same as "no such workspace", so the
    // timeout branch must never clear an already-resolved tenant.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<void>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Timeout")), 3000);
    });

    if (attempt === 1) {
      resolveInFlight.current = resolvePromise.catch(() => undefined);
    }

    try {
      await Promise.race([resolvePromise, timeoutPromise]);
    } catch (err) {
      if (attempt < 2) {
        console.warn("TenantProvider: resolveTenant slow, retrying once.", err);
        if (timer) clearTimeout(timer);
        return resolveTenant(attempt + 1);
      }
      // Give up, but keep whatever tenant we already had rather than
      // downgrading a real workspace to "not found".
      console.warn("TenantProvider: resolveTenant failed twice; keeping current tenant.", err);
    } finally {
      if (timer) clearTimeout(timer);
      if (attempt === 1) resolveInFlight.current = null;
      setIsTenantLoading(false);
    }
  }

  // ── Branch loading ─────────────────────────────────────────────────────────

  const fetchBranches = useCallback(async () => {
    if (!activeTenant?.id) return;
    const { data } = await client
      .from('branches' as never)
      .select('id, name, city, address, currency, timezone, is_active')
      .eq('tenant_id', activeTenant.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (data) {
      const mapped: BranchConfig[] = (data as Record<string, unknown>[]).map((b) => ({
        id: b.id as string,
        name: b.name as string,
        city: (b.city as string) ?? '',
        address: (b.address as string | null) ?? null,
        currency: (b.currency as string) ?? 'USD',
        timezone: (b.timezone as string) ?? 'Asia/Tashkent',
        is_active: b.is_active as boolean,
      }));
      setAvailableBranches(mapped);
      setActiveBranch((prev) => {
        if (prev && mapped.find((b) => b.id === prev.id)) return prev;
        return mapped[0] ?? null;
      });
    }
  }, [activeTenant?.id, client]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // ── Branch switching ───────────────────────────────────────────────────────

  const switchBranch = useCallback(
    (branchId: string) => {
      const target = availableBranches.find((b) => b.id === branchId);
      if (target) setActiveBranch(target);
    },
    [availableBranches]
  );

  // ── Owned tenants (multi-business owner) ────────────────────────────────────

  const fetchOwnedTenants = useCallback(async () => {
    const { data: sessionData } = await client.auth.getSession();
    const userEmail = sessionData?.session?.user?.email;
    if (!userEmail) {
      setOwnedTenants([]);
      return;
    }
    const { data } = await client
      .from('tenants' as never)
      .select('*')
      .eq('owner_email', userEmail)
      .order('created_at', { ascending: false });

    if (data) {
      setOwnedTenants((data as Record<string, unknown>[]).map((t) => mapTenant(t as any)));
    }
  }, [client]);

  useEffect(() => {
    fetchOwnedTenants();
  }, [fetchOwnedTenants]);

  // Refresh owned tenants on sign-in / sign-out.
  useEffect(() => {
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Deferred: see the auth-lock note above.
        setTimeout(() => { void fetchOwnedTenants(); }, 0);
      } else if (event === 'SIGNED_OUT') {
        setOwnedTenants([]);
        setIsOwnerSwitch(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [client, fetchOwnedTenants]);

  // ── Switch active business (owner) ──────────────────────────────────────────

  const switchTenant = useCallback(
    (tenantId: string) => {
      const target = ownedTenants.find((t) => t.id === tenantId);
      if (!target) return;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('active_tenant', JSON.stringify(target));
      }
      // Optimistic UI update, then re-resolve from DB (validates ownership).
      setActiveTenant(target);
      setIsOwnerSwitch(true);
      setIsImpersonating(false);
      resolveTenant();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ownedTenants]
  );

  // ── End impersonation ──────────────────────────────────────────────────────

  const endImpersonation = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('active_tenant');
      // Hard reload so AppContext re-reads from scratch
      window.location.href = '/super-admin';
    }
  }, []);

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        isTenantLoading,
        activeBranch,
        availableBranches,
        switchBranch,
        refetchBranches: fetchBranches,
        isImpersonating,
        endImpersonation,
        ownedTenants,
        refetchOwnedTenants: fetchOwnedTenants,
        switchTenant,
        isOwnerSwitch,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be called inside <TenantProvider>');
  return ctx;
}

export { TenantContext };
