import { useNavigate } from 'react-router-dom';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useTenant, VERTICAL_LABELS, type BusinessVertical } from '@unipath/tenant';
import { useApp } from '@/contexts/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/** Emoji per vertical — matches @unipath/tenant BranchSwitcher, no icon dep. */
const VERTICAL_ICONS: Record<string, string> = {
  tour: '✈️',
  academy: '🎓',
  hotel: '🏨',
  restaurant: '🍽️',
  clinic: '🏥',
  gym: '💪',
  manufacturing: '🏭',
  parking: '🅿️',
  auto_service: '🔧',
  wholesale: '📦',
  wedding_hall: '💍',
  kindergarten: '🧸',
  library: '📚',
  cosmetics: '💄',
  stadium: '🏟️',
  pharmacy: '💊',
  consulting: '💼',
};

const LABELS = {
  myBusinesses: { uz: 'Bizneslarim', ru: 'Мои бизнесы', en: 'My businesses' },
  addBusiness: { uz: 'Yangi biznes qo\'shish', ru: 'Добавить бизнес', en: 'Add business' },
} as const;

/**
 * BusinessSwitcher — lets an owner switch the active business in-place (like a
 * branch switch) and add a new one, without returning to /hub. Renders only
 * when the signed-in user owns at least one business (so regular staff, whose
 * ownedTenants is empty, never see it).
 */
export function BusinessSwitcher() {
  const { activeTenant, ownedTenants, switchTenant } = useTenant();
  const { language } = useApp();
  const navigate = useNavigate();

  // Only owners (ownedTenants matched by owner_email) see this control.
  if (ownedTenants.length < 1) return null;

  const vertical = (activeTenant?.business_type ?? 'consulting') as BusinessVertical;
  const activeIcon = VERTICAL_ICONS[vertical] ?? '🏢';
  const hasMultiple = ownedTenants.length > 1;

  const handleSwitch = (tenantId: string) => {
    if (activeTenant?.id === tenantId) return;
    switchTenant(tenantId);
    // Land on the dashboard so the vertical route tree re-resolves cleanly.
    navigate('/admin');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 max-w-[180px]"
          title={LABELS.myBusinesses[language]}
        >
          <span className="text-base leading-none">{activeIcon}</span>
          <span className="hidden sm:inline truncate font-semibold">
            {activeTenant?.name ?? '—'}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          {LABELS.myBusinesses[language]}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasMultiple &&
          ownedTenants.map((tenant) => {
            const tVertical = (tenant.business_type ?? 'consulting') as BusinessVertical;
            const icon = VERTICAL_ICONS[tVertical] ?? '🏢';
            const verticalLabel =
              VERTICAL_LABELS[tVertical]?.[language] ?? tenant.business_type ?? '';
            const isActive = activeTenant?.id === tenant.id;
            return (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => handleSwitch(tenant.id)}
                className={isActive ? 'bg-accent' : ''}
              >
                <span className="text-base leading-none mr-2">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{tenant.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate capitalize">
                    {verticalLabel}
                  </p>
                </div>
                {isActive ? (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Building2 className="h-4 w-4 opacity-30 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}
        {hasMultiple && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={() => navigate('/tizimlashtirish')}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">{LABELS.addBusiness[language]}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
