// @unipath/db — Unified typed Supabase client + database schema types.
//
// Usage:
//   import { createUnipathClient } from '@unipath/db';
//   import type { TypedSupabaseClient, TenantRow } from '@unipath/db';

export { createUnipathClient, getUnipathClient, resetUnipathClient } from './client';
export type { TypedSupabaseClient, UnipathClientOptions } from './client';

// Auto-generated Supabase schema types
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './database.types';

// Hand-maintained domain types for tables not yet in generated types
export type {
  TenantRow,
  TenantConfig,
  TenantModules,
  TenantFeatures,
  TenantBranding,
  TenantSettings,
  BranchRow,
  ProfileRow,
} from './tenant.types';
