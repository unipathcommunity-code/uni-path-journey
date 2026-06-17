import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type TypedSupabaseClient = SupabaseClient<Database>;

export interface UnipathClientOptions {
  supabaseUrl: string;
  supabaseKey: string;
  /** Custom storage adapter. Defaults to localStorage when available. */
  storage?: Storage;
}

/**
 * Create a fully-typed Supabase client for any UniPath app.
 *
 * Usage in app entry point:
 *   const supabase = createUnipathClient({
 *     supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
 *     supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
 *   });
 */
export function createUnipathClient(options: UnipathClientOptions): TypedSupabaseClient {
  const storage =
    options.storage ??
    (typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined);

  return createClient<Database>(options.supabaseUrl, options.supabaseKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Vite-aware singleton factory.
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from import.meta.env.
 * Throws at runtime if env vars are missing.
 */
let _singleton: TypedSupabaseClient | null = null;

export function getUnipathClient(): TypedSupabaseClient {
  if (_singleton) return _singleton;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env ?? {};
  const url: string | undefined = env.VITE_SUPABASE_URL;
  const key: string | undefined = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      '@unipath/db: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be defined in .env'
    );
  }

  _singleton = createUnipathClient({ supabaseUrl: url, supabaseKey: key });
  return _singleton;
}

/** Reset the singleton (useful in tests). */
export function resetUnipathClient(): void {
  _singleton = null;
}
