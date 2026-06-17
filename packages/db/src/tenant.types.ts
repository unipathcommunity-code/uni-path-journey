// Hand-maintained types for tables not yet present in the auto-generated Database type.
// When `supabase gen types` is run and the tables below appear in database.types.ts, remove them here.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ---------------------------------------------------------------------------
// TenantConfig — shape of the `tenants.config` JSONB column
// ---------------------------------------------------------------------------

export interface TenantModules {
  // Core feature flags
  api?: boolean;
  mentor?: boolean;
  unicoin?: boolean;
  accountant?: boolean;
  // Vertical flags — exactly one should be true per registration
  consulting?: boolean;
  academy?: boolean;
  tour?: boolean;
  hotel?: boolean;
  restaurant?: boolean;
  clinic?: boolean;
  gym?: boolean;
  manufacturing?: boolean;
  parking?: boolean;
  auto_service?: boolean;
  wholesale?: boolean;
  wedding_hall?: boolean;
  kindergarten?: boolean;
  library?: boolean;
  cosmetics?: boolean;
  stadium?: boolean;
  pharmacy?: boolean;
  car_showroom?: boolean;
  // Legacy aliases (mapped to canonical names at read time)
  nova?: boolean;
  unitour?: boolean;
}

export interface TenantFeatures {
  mentor?: boolean;
  unicoin?: boolean;
  accountant?: boolean;
  api_access?: boolean;
}

export interface TenantBranding {
  name?: string;
  logo_url?: string;
  theme_color?: string;
  custom_domain?: string;
  telegram_bot_token?: string;
  telegram_bot_username?: string;
  telegram_chat_id?: string;
}

export interface TenantSettings {
  emailNotifications?: boolean;
  autoApproveDocuments?: boolean;
  maintenanceMode?: boolean;
  allowNewRegistrations?: boolean;
  hideJobBoard?: boolean;
  hideHousing?: boolean;
  hideGrants?: boolean;
  hideMentors?: boolean;
  showAdBanner?: boolean;
  socialProofToasts?: boolean;
  celebrationMusic?: boolean;
  celebrationPreset?: string;
  notificationSounds?: boolean;
  notificationPreset?: string;
  socialProofFrequency?: number;
  socialProofMessages?: string[];
  socialProofUniversities?: string[];
  businessMode?: 'unicoin' | 'paid';
  showProfileCompletionBar?: boolean;
}

export interface TenantConfig {
  /** Business type stored at registration (e.g. 'tour', 'academy') */
  business_type?: string;
  modules?: TenantModules;
  features?: TenantFeatures;
  branding?: TenantBranding;
  settings?: TenantSettings;
}

// ---------------------------------------------------------------------------
// Row shapes for tables missing from generated types
// ---------------------------------------------------------------------------

export interface TenantRow {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  /** Supabase DB enum column — the most authoritative vertical source */
  vertical: string | null;
  config: TenantConfig | null;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  plan: string | null;
  owner_email: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  has_unicoin: boolean | null;
}

export interface BranchRow {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  currency: string | null;
  timezone: string | null;
  country: string | null;
  is_active: boolean;
  tenant_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: string | null;
  tenant_id: string | null;
  branch_id: string | null;
  preferred_language: string | null;
  created_at: string;
  updated_at: string;
}
