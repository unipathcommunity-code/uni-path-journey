import unipathLogo from '@/assets/unipath-logo.png';
import { useApp } from '@/contexts/AppContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  forcePlatform?: boolean;
}

export function Logo({ size = 'md', showText = true, forcePlatform = false }: LogoProps) {
  const { activeTenant } = useApp();

  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-16',
  };

  const logoSizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-2xl',
  };

  if (activeTenant && !forcePlatform) {
    const tenantName = activeTenant.config?.branding?.name || activeTenant.name;
    const logoUrl = activeTenant.config?.branding?.logo_url;

    return (
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={tenantName} 
            className={`${sizes[size]} w-auto object-contain max-w-[150px]`} 
          />
        ) : (
          <div className={`${logoSizes[size]} rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0`}>
            {tenantName.charAt(0).toUpperCase()}
          </div>
        )}
        {showText && (
          <span className="font-bold text-foreground text-xl tracking-tight">
            {tenantName}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img src={unipathLogo} alt="UniPath" className={`${sizes[size]} w-auto`} />
      {showText && (
        <span className="font-bold text-foreground text-xl">UniPath</span>
      )}
    </div>
  );
}

