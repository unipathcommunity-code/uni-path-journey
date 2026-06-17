import { ReactNode, useEffect, useState } from "react";
import { useAuth as useMainAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const useAuth = () => {
  const mainAuth = useMainAuth();
  const { role, isLoading: roleLoading, isSuperAdmin, isAdmin, isAgent, isStudent } = useUserRole();
  const [profile, setProfile] = useState<any>(null);

  const fetchProfile = async () => {
    if (!mainAuth.user) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", mainAuth.user.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [mainAuth.user]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast.error("Google bilan kirishda xatolik: " + error.message);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    return mainAuth.signIn(email, password);
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => {
    const res = await mainAuth.signUp(email, password, fullName, phone ? { phone } : {});
    return { error: res.error };
  };

  const hasRole = (roleToCheck: string) => {
    if (roleToCheck === "superadmin" || roleToCheck === "super_admin") return isSuperAdmin;
    if (roleToCheck === "admin") return isAdmin;
    if (roleToCheck === "teacher" || roleToCheck === "mentor" || roleToCheck === "agent") {
      return isAgent || role === "mentor" || role === "teacher";
    }
    if (roleToCheck === "student" || roleToCheck === "user") return isStudent;
    return role === roleToCheck;
  };

  return {
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
  };
};

