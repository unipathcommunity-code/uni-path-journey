// @unipath/auth — Unified AuthProvider and auth hooks for all UniPath apps.
//
// Usage:
//   import { AuthProvider, useAuth, useUserRole } from '@unipath/auth';
//   import type { UserRole, UniPathJWTClaims, AuthContextValue } from '@unipath/auth';

export { AuthProvider, useAuth, AuthContext } from './AuthProvider';
export type { AuthProviderProps } from './AuthProvider';

export { useUserRole } from './useUserRole';

export type {
  UserRole,
  UniPathJWTClaims,
  AuthContextValue,
} from './types';

export { ADMIN_ROLES, AGENT_ROLES, STUDENT_ROLES } from './types';
