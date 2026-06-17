import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTenant } from '@unipath/tenant';
import { supabase } from '@/integrations/supabase/client';
import { Language } from '@/lib/i18n';
import { injectTheme } from '@/lib/themes';

// ---------------------------------------------------------------------------
// TenantConfig — rich local typing for the JSONB `config` column.
// This is a superset of the package-level TenantConfig, adding app-specific
// settings (hideJobBoard, celebrationMusic, etc.).
// ---------------------------------------------------------------------------

export interface TenantConfig {
  modules?: {
    // Core feature flags
    api?: boolean;
    mentor?: boolean;
    unicoin?: boolean;
    accountant?: boolean;
    // Business verticals — exactly one flag should be true
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
    // Legacy aliases
    nova?: boolean;
    unitour?: boolean;
  };
  features?: {
    mentor?: boolean;
    unicoin?: boolean;
    accountant?: boolean;
    api_access?: boolean;
  };
  branding?: {
    name?: string;
    logo_url?: string;
    theme_color?: string;
    custom_domain?: string;
    telegram_bot_token?: string;
    telegram_bot_username?: string;
    // Public-site content (used by TenantPublicPage across all verticals)
    hero_title?: string;
    hero_subtitle?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  settings?: {
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
  };
}

// ---------------------------------------------------------------------------
// Tenant — local shape with richer config typing.
// The runtime value comes from @unipath/tenant's TenantProvider (cast below).
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  /** Canonical business vertical resolved by mapTenant() */
  business_type: string | null;
  config: TenantConfig | null;
  created_at: string | null;
  status: string | null;
  plan: string | null;
  owner_email: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  has_unicoin: boolean | null;
}

// ---------------------------------------------------------------------------
// SelectedCountry
// ---------------------------------------------------------------------------

export interface SelectedCountry {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  flag?: string | null;
  image_url?: string | null;
  avg_tuition?: string | null;
}

// ---------------------------------------------------------------------------
// AppContext value
// ---------------------------------------------------------------------------

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  selectedCountry: SelectedCountry | null;
  setSelectedCountry: (country: SelectedCountry | null) => void;
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  /** Active tenant — sourced from @unipath/tenant's TenantProvider */
  activeTenant: Tenant | null;
  /** Whether the tenant is still being resolved */
  isTenantLoading: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

const STORAGE_KEYS = {
  language: 'unipath_language',
  selectedCountry: 'unipath_selected_country',
  isOnboarded: 'unipath_is_onboarded',
} as const;

function safeParseLanguage(value: string | null): Language | null {
  if (value === 'en' || value === 'uz' || value === 'ru') return value;
  return null;
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// AppProvider
//
// Manages UI preferences (language, selected country, onboarding state) and
// forwards tenant state from the @unipath/tenant TenantProvider, which must
// be an ancestor in the tree (App.tsx enforces this).
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Tenant state — delegated to @unipath/tenant TenantProvider ────────────
  const { activeTenant: sharedTenant, isTenantLoading } = useTenant();
  // Cast to local Tenant type which has richer JSONB shape annotations.
  // Runtime values are identical — only typing differs.
  const activeTenant = sharedTenant as unknown as (Tenant | null);

  // ── UI preferences ────────────────────────────────────────────────────────

  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    return safeParseLanguage(window.localStorage.getItem(STORAGE_KEYS.language)) || 'en';
  });

  const [selectedCountry, setSelectedCountryState] = useState<SelectedCountry | null>(() => {
    if (typeof window === 'undefined') return null;
    return safeParseJson<SelectedCountry>(window.localStorage.getItem(STORAGE_KEYS.selectedCountry));
  });

  const [isOnboarded, setIsOnboardedState] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEYS.isOnboarded) === '1';
  });

  // ── Theme injection ────────────────────────────────────────────────────────
  // Re-inject whenever tenant changes or dark/light mode toggles.

  useEffect(() => {
    const themeId = activeTenant?.config?.branding?.theme_color || 'emerald';
    injectTheme(themeId);

    const observer = new MutationObserver(() => injectTheme(themeId));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [activeTenant]);

  // ── Language preference — DB sync ─────────────────────────────────────────
  // Load from DB on mount; override localStorage with the user's saved pref.

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('user_id', user.id)
        .maybeSingle();
      const lang = profile?.preferred_language;
      if (lang === 'en' || lang === 'uz' || lang === 'ru') {
        setLanguageState(lang as Language);
        window.localStorage.setItem(STORAGE_KEYS.language, lang);
      }
    })();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ preferred_language: lang }).eq('user_id', user.id);
      }
    })();
  };

  const setSelectedCountry = (country: SelectedCountry | null) => setSelectedCountryState(country);
  const setIsOnboarded = (value: boolean) => setIsOnboardedState(value);

  // ── Persist UI preferences to localStorage ────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.language, language);
  }, [language]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!selectedCountry) {
      window.localStorage.removeItem(STORAGE_KEYS.selectedCountry);
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.selectedCountry, JSON.stringify(selectedCountry));
  }, [selectedCountry]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.isOnboarded, isOnboarded ? '1' : '0');
  }, [isOnboarded]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        selectedCountry,
        setSelectedCountry,
        isOnboarded,
        setIsOnboarded,
        activeTenant,
        isTenantLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
