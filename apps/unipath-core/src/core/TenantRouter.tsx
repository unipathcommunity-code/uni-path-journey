import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { TenantNotFound } from '@/pages/TenantNotFound';
import { motion } from 'framer-motion';

export const TenantRouter = ({ children }: { children: React.ReactNode }) => {
  const { activeTenant, isTenantLoading } = useApp();

  // Get current hostname and determine if it is a core SaaS root domain
  const hostname = window.location.hostname;
  const coreDomains = ['unipath.me', 'unipath.uz', 'localhost', '127.0.0.1', 'vercel.app', 'unipath-journey.vercel.app'];
  const isCoreDomain = coreDomains.some(d => hostname === d || hostname.endsWith('.' + d));
  const isCoreRoot = hostname === 'unipath.me' || hostname === 'www.unipath.me' ||
                     hostname === 'unipath.uz' || hostname === 'www.unipath.uz' ||
                     hostname === 'localhost' || hostname === '127.0.0.1' ||
                     hostname.endsWith('.vercel.app') || hostname === 'vercel.app' ||
                     hostname === 'unipath-journey.vercel.app' || hostname === 'www.unipath-journey.vercel.app';

  // Check if we have a query parameter or session storage override
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant') || urlParams.get('company');
  const storedTenant = window.sessionStorage.getItem('unipath_session_tenant');
  const hasTenantOverride = !!(tenantParam || storedTenant);

  // Try to guess the tenant name from URL for the loading screen
  let loadingName = 'UniPath';
  if (!isCoreRoot && !hasTenantOverride) {
    const matchedCore = coreDomains.find(d => hostname.endsWith('.' + d));
    if (matchedCore) {
      const prefix = hostname.substring(0, hostname.length - matchedCore.length - 1);
      const parts = prefix.split('.');
      const sub = parts[parts.length - 1];
      if (sub && sub !== 'www') {
        loadingName = sub.charAt(0).toUpperCase() + sub.slice(1);
      }
    } else {
      loadingName = 'Workspace';
    }
  }

  // Update document title and favicon once tenant is loaded
  React.useEffect(() => {
    if (activeTenant) {
      document.title = activeTenant.name ? `${activeTenant.name} — UniPath` : 'UniPath Workspace';
      
      const logoUrl = activeTenant.config?.branding?.logo_url;
      if (logoUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = logoUrl;
      }
    } else if (isCoreRoot) {
      document.title = 'UniPath — Business Management SaaS Platform';
    }
  }, [activeTenant, isCoreRoot]);

  // 1. The platform's own root domain has no tenant to wait for. Render the
  //    SaaS site straight away — waiting here was showing several seconds of
  //    spinner on the landing page and /auth for no reason.
  if (isCoreRoot && !hasTenantOverride) {
    return <>{children}</>;
  }

  // 2. On an agency subdomain the tenant gates everything — hold the UI
  //    behind the spinner until it resolves.
  if (isTenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 3. Tenant resolved — load the main React tree.
  if (activeTenant) {
    return <>{children}</>;
  }

  // 4. If not core root and no tenant is resolved, show the premium TenantNotFound page.
  return <TenantNotFound />;
};

export default TenantRouter;
