import { useAuth } from "@/hooks/useAuth";

/** True when current user is super_admin / admin (not just company owner). */
export const useIsSuperAdmin = () => {
  const { userRole, user } = useAuth();
  const isSuper = userRole === "super_admin" || userRole === "admin";
  const isHardcoded = user?.email?.toLowerCase() === "unipath.community@gmail.com";
  return isSuper || isHardcoded;
};
