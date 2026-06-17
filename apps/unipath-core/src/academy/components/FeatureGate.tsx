import { ReactNode } from "react";
import { Lock, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useFeatureFlag, type FeatureKey } from "@/hooks/useFeatureFlag";

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** What to show when the feature is locked. If omitted, a default upgrade card is rendered. */
  fallback?: ReactNode;
  /** When true, renders nothing if locked. Useful for nav items. */
  hideWhenLocked?: boolean;
}

/**
 * Wraps any subtree and renders it only when the org's plan unlocks `feature`.
 * Superadmin always sees the children (handled inside useFeatureFlag).
 */
const FeatureGate = ({ feature, children, fallback, hideWhenLocked }: FeatureGateProps) => {
  const { isEnabled, loading, serverValidated } = useFeatureFlag();

  // Fail-closed: while we're still validating with the server, render nothing rather
  // than briefly showing premium UI to a user whose plan doesn't include it.
  if (loading || !serverValidated) return null;
  if (isEnabled(feature)) return <>{children}</>;
  if (hideWhenLocked) return null;
  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <div className="glass p-6 rounded-2xl border border-border text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
        <Lock className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-heading font-bold text-lg mb-1">Premium funksiya</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Bu modul sizning joriy tarifingizda mavjud emas. Yuqoriroq tarifga o'ting.
      </p>
      <Link
        to="/pricing"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition"
      >
        <Crown className="w-4 h-4" /> Tariflar
      </Link>
    </div>
  );
};

export default FeatureGate;
