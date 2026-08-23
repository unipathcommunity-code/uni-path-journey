import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth as useMainAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Role-aware auth facade.
 *
 * This used to be a bare hook, so every one of its ~20 consumers ran its own
 * `useUserRole()` (a separate Supabase round-trip) and got a fresh `hasRole`
 * identity on every render. Providers that put `hasRole` in a dependency array
 * — BranchProvider did — then re-ran their effects forever ("Maximum update
 * depth exceeded"). It is now a context: the role is resolved once, and every
 * value handed out is referentially stable.
 */

export interface AuthFacade {
  user: ReturnType<typeof useMainAuth>["user"];
  session: ReturnType<typeof useMainAuth>["session"];
  loading: boolean;
  userRole: string | null;
  roles: string[];
  profile: any;
  hasRole: (roleToCheck: string) => boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
  ) => Promise<{ error: any }>;
  signOut: ReturnType<typeof useMainAuth>["signOut"];
  refresh: () => Promise<void>;
}

const AuthFacadeContext = createContext<AuthFacade | undefined>(undefined);

/** Builds the facade. Called exactly once, inside AuthProvider. */
function useAuthFacade(): AuthFacade {
  const mainAuth = useMainAuth();
  const { role, isLoading: roleLoading, isSuperAdmin, isAdmin, isAgent, isStudent } = useUserRole();
  const [profile, setProfile] = useState<any>(null);

  const userId = mainAuth.user?.id ?? null;

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) setProfile(data);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) toast.error("Google bilan kirishda xatolik: " + error.message);
  }, []);

  const signInWithEmail = useCallback(
    (email: string, password: string) => mainAuth.signIn(email, password),
    [mainAuth.signIn],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, fullName: string, phone?: string) => {
      const res = await mainAuth.signUp(email, password, fullName, phone ? { phone } : {});
      return { error: res.error };
    },
    [mainAuth.signUp],
  );

  const hasRole = useCallback(
    (roleToCheck: string) => {
      if (roleToCheck === "superadmin" || roleToCheck === "super_admin") return isSuperAdmin;
      if (roleToCheck === "admin") return isAdmin;
      if (roleToCheck === "mentor" || roleToCheck === "agent") {
        return isAgent || role === "mentor";
      }
      if (roleToCheck === "student" || roleToCheck === "user") return isStudent;
      return role === roleToCheck;
    },
    [role, isSuperAdmin, isAdmin, isAgent, isStudent],
  );

  return useMemo(
    () => ({
      user: mainAuth.user,
      session: mainAuth.session,
      loading: mainAuth.isLoading || roleLoading,
      userRole: role,
      roles: role ? [role] : [],
      profile,
      hasRole,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut: mainAuth.signOut,
      refresh: fetchProfile,
    }),
    [
      mainAuth.user,
      mainAuth.session,
      mainAuth.isLoading,
      mainAuth.signOut,
      roleLoading,
      role,
      profile,
      hasRole,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      fetchProfile,
    ],
  );
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const value = useAuthFacade();
  return <AuthFacadeContext.Provider value={value}>{children}</AuthFacadeContext.Provider>;
};

export const useAuth = (): AuthFacade => {
  const ctx = useContext(AuthFacadeContext);
  if (!ctx) {
    throw new Error(
      "useAuth must be used within the AuthProvider from @/hooks/useAuth " +
        "(mounted in App.tsx below TenantProvider and contexts/AuthProvider).",
    );
  }
  return ctx;
};
