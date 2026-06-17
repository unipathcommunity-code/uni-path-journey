import { cn } from "@/lib/utils";
import novaLogoSrc from "@/assets/nova-logo.jpg";

interface NovaLogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { box: "w-7 h-7 rounded-lg", text: "text-sm" },
  md: { box: "w-9 h-9 rounded-xl", text: "text-base" },
  lg: { box: "w-11 h-11 rounded-xl", text: "text-lg" },
};

/**
 * Default platform brand mark — used as fallback when an organization
 * has no custom logo uploaded yet.
 */
export const NovaLogo = ({ className, showWordmark = true, size = "md" }: NovaLogoProps) => {
  const s = sizeMap[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex items-center justify-center overflow-hidden bg-background shadow-lg shadow-primary/20 ring-1 ring-border",
          s.box,
        )}
      >
        <img
          src={novaLogoSrc}
          alt="NOVA"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </span>
      {showWordmark && (
        <span className={cn("font-heading font-black tracking-tight text-foreground", s.text)}>
          NOVA
        </span>
      )}
    </span>
  );
};

export default NovaLogo;
