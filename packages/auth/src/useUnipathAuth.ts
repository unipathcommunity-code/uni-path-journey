import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { UnipathUser, AuthState, SignUpData, UnipathApp, NovaRole, UniTourRole, ConsultingRole } from './types'

const supabase: SupabaseClient = createClient(
  (import.meta as Record<string, any>).env.VITE_SUPABASE_URL as string,
  (import.meta as Record<string, any>).env.VITE_SUPABASE_PUBLISHABLE_KEY as string
)

type RawRole = { role: string; app?: string | null }
type RawProfile = { full_name: string | null; avatar_url: string | null; organization_id: string | null } | null

function buildUnipathUser(
  supabaseUser: User,
  rolesData: RawRole[],
  profile: RawProfile
): UnipathUser {
  const roles: UnipathUser['roles'] = {}

  for (const r of rolesData) {
    if (r.app === 'nova') roles.nova = r.role as NovaRole
    else if (r.app === 'unitour') roles.unitour = r.role as UniTourRole
    else if (r.app === 'consulting') roles.consulting = r.role as ConsultingRole
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    fullName: profile?.full_name ?? ((supabaseUser.user_metadata?.full_name as string) ?? ''),
    avatarUrl: profile?.avatar_url ?? undefined,
    roles,
    tenantId: profile?.organization_id ?? undefined,
    createdAt: supabaseUser.created_at,
  }
}

async function fetchUserData(userId: string): Promise<{ roles: RawRole[]; profile: RawProfile }> {
  const [rolesRes, profileRes] = await Promise.all([
    supabase.from('user_roles').select('role, app').eq('user_id', userId),
    supabase.from('profiles').select('full_name, avatar_url, organization_id').eq('user_id', userId).maybeSingle(),
  ])
  return {
    roles: (rolesRes.data as RawRole[]) ?? [],
    profile: (profileRes.data as RawProfile) ?? null,
  }
}

export function useUnipathAuth() {
  const [user, setUser] = useState<UnipathUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTimeout(async () => {
          const { roles, profile } = await fetchUserData(session.user.id)
          setUser(buildUnipathUser(session.user, roles, profile))
          setIsLoading(false)
        }, 0)
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { roles, profile } = await fetchUserData(session.user.id)
        setUser(buildUnipathUser(session.user, roles, profile))
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (data: SignUpData) => {
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : '/'
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: data.fullName,
          app: data.app,
        },
      },
    })
    return {
      error: error as Error | null,
      data: authData ? { user: authData.user ?? null, session: authData.session ?? null } : null,
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth?type=recovery`
      : '/auth?type=recovery'
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl })
    return { error: error as Error | null }
  }, [])

  const hasRole = useCallback((app: UnipathApp, role: string): boolean => {
    if (!user) return false
    const appRole = user.roles[app]
    if (!appRole) return false
    if (app === 'nova' && appRole === 'superadmin') return true
    return appRole === role
  }, [user])

  const isAdmin = useCallback((app?: UnipathApp): boolean => {
    if (!user) return false
    const adminRoles: Record<UnipathApp, string[]> = {
      nova: ['superadmin', 'owner', 'admin'],
      unitour: ['super_admin', 'admin', 'moderator'],
      consulting: ['super_admin', 'admin'],
    }
    if (app) {
      const appRole = user.roles[app]
      return appRole ? adminRoles[app].includes(appRole) : false
    }
    return (
      (user.roles.nova ? adminRoles.nova.includes(user.roles.nova) : false) ||
      (user.roles.unitour ? adminRoles.unitour.includes(user.roles.unitour) : false) ||
      (user.roles.consulting ? adminRoles.consulting.includes(user.roles.consulting) : false)
    )
  }, [user])

  const authState: AuthState = {
    user,
    isLoading,
    isAuthenticated: user !== null && !isLoading,
  }

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    hasRole,
    isAdmin,
  }
}
