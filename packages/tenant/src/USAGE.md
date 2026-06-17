# @unipath/tenant — Integration guide

## 1. Wire providers in app entry point

```tsx
// apps/unipath-core/src/main.tsx  (or App.tsx)
import { createUnipathClient } from '@unipath/db';
import { AuthProvider } from '@unipath/auth';
import { TenantProvider } from '@unipath/tenant';

const supabase = createUnipathClient({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

export default function App() {
  return (
    <AuthProvider client={supabase}>
      <TenantProvider client={supabase}>
        <Router />
      </TenantProvider>
    </AuthProvider>
  );
}
```

## 2. Read tenant + branches

```tsx
import { useTenant } from '@unipath/tenant';

function Sidebar() {
  const { activeTenant, activeBranch, isTenantLoading } = useTenant();
  if (isTenantLoading) return <Spinner />;
  return <p>{activeTenant?.name} / {activeBranch?.name}</p>;
}
```

## 3. Plan limits

```tsx
import { usePlanLimits } from '@unipath/tenant';

function StaffTab() {
  const { canAddStaff, maxStaff, tier } = usePlanLimits();
  return (
    <div>
      <p>Plan: {tier} — up to {maxStaff === Infinity ? '∞' : maxStaff} staff</p>
      {canAddStaff(currentCount) ? <AddButton /> : <UpgradePrompt />}
    </div>
  );
}
```

## 4. Declarative gating

```tsx
import { PlanGate, UpgradeBadge } from '@unipath/tenant';

function TelegramSettings() {
  return (
    <PlanGate
      feature="telegramBot"
      fallback={
        <div className="opacity-50">
          Telegram Bot <UpgradeBadge requiredTier="growth" />
        </div>
      }
    >
      <TelegramBotForm />
    </PlanGate>
  );
}
```

## 5. BranchSwitcher in sidebar

```tsx
import { BranchSwitcher } from '@unipath/tenant';
import { useNavigate } from 'react-router-dom';

function AppSidebar() {
  const navigate = useNavigate();
  return (
    <BranchSwitcher
      lang="uz"
      showVertical
      onNavigate={(href) => navigate(href)}
      apps={[
        { id: 'tour', label: 'UniTour', icon: '✈️', href: '/admin/dashboard' },
        { id: 'academy', label: 'NOVA', icon: '🎓', href: '/nova/admin' },
      ]}
    />
  );
}
```
