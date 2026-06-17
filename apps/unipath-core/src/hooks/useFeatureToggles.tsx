import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FeatureToggle {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_enabled: boolean;
  updated_at: string;
}

export const useFeatureToggles = () => {
  const queryClient = useQueryClient();

  const { data: toggles = [], isLoading } = useQuery({
    queryKey: ["feature-toggles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_toggles")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data as FeatureToggle[];
    },
    staleTime: 30000,
  });

  const isFeatureEnabled = (key: string): boolean => {
    const toggle = toggles.find((t) => t.feature_key === key);
    return toggle?.is_enabled ?? true;
  };

  const updateToggle = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("feature_toggles")
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-toggles"] });
    },
  });

  return { toggles, isLoading, isFeatureEnabled, updateToggle };
};
