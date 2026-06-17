import React from 'react';
import { motion } from 'framer-motion';
import { Globe, HelpCircle, ArrowRight } from 'lucide-react';

export const TenantNotFound = () => {
  const hostname = window.location.hostname;

  const handleReturnHome = () => {
    window.location.href = 'https://unipath.me';
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#030712] p-4 text-white overflow-hidden font-sans">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Glow effect card wrap */}
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-20 blur-sm pointer-events-none" />

        {/* Glassmorphic Container */}
        <div className="relative rounded-2xl border border-white/10 bg-neutral-900/60 p-8 md:p-10 backdrop-blur-xl shadow-2xl">
          
          {/* Neon Icon Circle */}
          <div className="flex justify-center mb-6">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Globe className="h-8 w-8 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 border border-white/10">
                <span className="text-red-400 text-xs font-bold font-mono">!</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Workspace Not Found
            </h1>
            
            {/* Hostname Badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              {hostname}
            </div>

            <p className="mt-6 text-sm text-neutral-400 leading-relaxed">
              We couldn't resolve the requested UniPath workspace. This could mean the subdomain is invalid, the custom domain isn't fully configured yet, or the subscription has expired.
            </p>
          </div>

          {/* Troubleshooter Checklist */}
          <div className="mt-8 rounded-xl border border-white/5 bg-white/5 p-4 text-left">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Troubleshooting Steps</h3>
            <ul className="mt-3 space-y-2 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <span>Double-check the spelling of the subdomain/domain.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <span>For custom domains, ensure DNS CNAME/A records are correctly pointing to unipath.me.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <span>Reach out to your system administrator to confirm activation status.</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              onClick={handleReturnHome}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              Go to UniPath.me
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <a
              href="mailto:support@unipath.me"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-neutral-200 transition hover:bg-white/10"
            >
              <HelpCircle className="h-4 w-4" />
              Contact Support
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TenantNotFound;
