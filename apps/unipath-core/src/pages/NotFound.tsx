import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import CompanyPublicSite from "./CompanyPublicSite";

/**
 * NotFound also acts as a slug resolver: if the URL is a single segment that
 * matches an approved tour company slug (e.g. unitour.me/silk), render the
 * branded site in-place — keeping the short URL visible.
 */
const NotFound = () => {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [companySlug, setCompanySlug] = useState<string | null>(null);

  useEffect(() => {
    const path = location.pathname.replace(/^\/+|\/+$/g, "");
    const isCandidate = /^[a-z0-9]{3,12}$/i.test(path);
    if (!isCandidate) {
      setChecking(false);
      return;
    }
    (async () => {
      const { data } = await (supabase as any)
        .from("tour_companies")
        .select("slug")
        .eq("slug", path.toLowerCase())
        .eq("status", "approved")
        .eq("is_active", true)
        .maybeSingle();
      if (data?.slug) setCompanySlug(data.slug);
      setChecking(false);
    })();
  }, [location.pathname]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (companySlug) return <CompanyPublicSite slugOverride={companySlug} />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Sahifa topilmadi</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Bosh sahifaga qaytish
        </a>
      </div>
    </div>
  );
};

export default NotFound;
