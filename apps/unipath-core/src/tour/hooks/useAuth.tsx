import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type UserRole = "super_admin" | "admin" | "moderator" | "company_owner" | "company_staff" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const bootstrapAndFetchRole = async (userId: string): Promise<UserRole | null> => {
    try {
      // Call bootstrap function to ensure profile and role exist
      // This also guarantees super-admin email always gets admin role
      await supabase.rpc("bootstrap_current_user");

      // Fetch highest-priority role (admin > moderator > user)
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("role", { ascending: true }); // 'admin' comes first alphabetically

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      // Return highest priority role
      if (data && data.length > 0) {
        const roles = data.map(r => r.role);
        if (roles.includes("super_admin")) return "super_admin";
        if (roles.includes("admin")) return "admin";
        if (roles.includes("moderator")) return "moderator";
        if (roles.includes("company_owner")) return "company_owner";
        if (roles.includes("company_staff")) return "company_staff";
        return "user";
      }

      return "user";
    } catch (err) {
      console.error("Error in bootstrapAndFetchRole:", err);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role fetching with setTimeout
        if (session?.user) {
          setTimeout(() => {
            bootstrapAndFetchRole(session.user.id).then(role => {
              setUserRole(role);
              setLoading(false);
            });
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        bootstrapAndFetchRole(session.user.id).then(role => {
          setUserRole(role);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('active_tenant');
      }
      const res = await Promise.race([
        supabase.auth.signOut(),
        new Promise<{ error: any }>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000))
      ]);
      if (res && res.error) {
        toast.error("Chiqishda xatolik: " + res.error.message);
      }
    } catch (e) {
      console.warn("Tour sign out failed or timed out:", e);
      if (typeof window !== 'undefined') {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            window.localStorage.removeItem(key);
          }
        }
      }
    } finally {
      setUser(null);
      setSession(null);
      setUserRole(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userRole,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
