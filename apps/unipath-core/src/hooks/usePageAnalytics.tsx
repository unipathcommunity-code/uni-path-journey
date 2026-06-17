import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const getSessionId = () => {
  let sid = sessionStorage.getItem("unitour_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("unitour_session_id", sid);
  }
  return sid;
};

export const usePageAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();
  const startTime = useRef(Date.now());
  const lastPath = useRef("");

  useEffect(() => {
    const currentPath = location.pathname;

    // Log previous page time spent
    if (lastPath.current && lastPath.current !== currentPath) {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      if (timeSpent > 1) {
        supabase.from("page_analytics").insert({
          user_id: user?.id || null,
          page_path: lastPath.current,
          page_title: document.title,
          session_id: getSessionId(),
          time_spent_seconds: timeSpent,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        }).then(() => {});
      }
    }

    lastPath.current = currentPath;
    startTime.current = Date.now();

    // Log on unload
    const handleUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      if (timeSpent > 1) {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_analytics`,
          JSON.stringify({
            user_id: user?.id || null,
            page_path: currentPath,
            session_id: getSessionId(),
            time_spent_seconds: timeSpent,
          })
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [location.pathname, user?.id]);
};
