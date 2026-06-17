export type UnipathApp = 'nova' | 'unitour' | 'consulting'

export type NovaRole = 'superadmin' | 'owner' | 'admin' | 'teacher' | 'student' | 'parent' | 'accountant'
export type UniTourRole = 'super_admin' | 'admin' | 'moderator' | 'operator' | 'agent' | 'user'
export type ConsultingRole = 'super_admin' | 'admin' | 'agent' | 'student'

export interface UnipathUser {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  roles: {
    nova?: NovaRole
    unitour?: UniTourRole
    consulting?: ConsultingRole
  }
  activeApp?: UnipathApp
  tenantId?: string
  createdAt: string
}

export interface AuthState {
  user: UnipathUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface SignUpData {
  email: string
  password: string
  fullName: string
  app?: UnipathApp
}
