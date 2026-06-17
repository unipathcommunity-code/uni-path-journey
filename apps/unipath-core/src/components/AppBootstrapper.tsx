import { useEffect, useRef } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApp, type SelectedCountry } from "@/contexts/AppContext";

type DbCountry = {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  flag: string | null;
  image_url: string | null;
  avg_tuition: string | null;
};

type DbProfile = {
  selected_country: string | null;
  preferred_language: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Keeps AppContext in sync with the logged-in user's saved profile settings.
 * - Loads selected country from profile/user metadata on login
 * - Persists current selected country to profile
 */
export function AppBootstrapper() {
  const { user } = useAuth();
  const { selectedCountry, setSelectedCountry, language } = useApp();

  const lastLoadedUserIdRef = useRef<string | null>(null);
  const lastSavedCountryNameRef = useRef<string | null>(null);

  // Load selected country from backend once per login
  useEffect(() => {
    if (!user?.id) return;
    if (lastLoadedUserIdRef.current === user.id) return;

    lastLoadedUserIdRef.current = user.id;

    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_country, preferred_language")
        .eq("user_id", user.id)
        .maybeSingle();

      const profileData = (profile as DbProfile | null) ?? null;
      const selectedCountryName =
        profileData?.selected_country || (user.user_metadata as any)?.selected_country || null;

      if (!selectedCountryName) return;

      const { data: country } = await supabase
        .from("countries")
        .select("id, name, name_uz, name_ru, flag, image_url, avg_tuition")
        .eq("is_active", true)
        .eq("name", selectedCountryName)
        .maybeSingle();

      if (country) {
        setSelectedCountry(country as unknown as SelectedCountry);
        return;
      }

      // Fallback (still better than null; keeps UniversitySearch filter working)
      setSelectedCountry({
        id: selectedCountryName,
        name: selectedCountryName,
      });
    })();
  }, [user?.id, setSelectedCountry]);

  // Persist selected country to backend whenever student changes it
  useEffect(() => {
    if (!user?.id) return;
    if (!selectedCountry?.name) return;

    if (lastSavedCountryNameRef.current === selectedCountry.name) return;
    lastSavedCountryNameRef.current = selectedCountry.name;

    (async () => {
      await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            selected_country: selectedCountry.name,
            preferred_language: language,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
    })();
  }, [user?.id, selectedCountry?.name, language]);

  // If we ever stored a fallback id (not UUID), avoid breaking any grant filtering logic
  useEffect(() => {
    if (!selectedCountry?.id) return;
    if (isUuid(selectedCountry.id)) return;
    // no-op; this hook just documents the intent and keeps the linter happy
  }, [selectedCountry?.id]);

  return null;
}
