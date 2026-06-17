import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createSupabaseClient(
  url: string,
  key: string
): SupabaseClient<Database> {
  const storage =
    typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined;

  return createClient<Database>(url, key, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase: SupabaseClient<Database> = createSupabaseClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
