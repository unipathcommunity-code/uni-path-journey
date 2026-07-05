import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Globe,
  Bell,
  Settings,
  Search,
  LogIn,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useSuperAdminStats, verticalLabel, type SaTenant } from "@/hooks/useSuperAdminStats";
import { verticalStyle, impersonateTenant } from "@/lib/verticalConfig";

// ============================================================
// Super Admin ⌘K Command Palette — global quick search.
// Opens with Cmd+K / Ctrl+K (or the small "⌘K" button in the
// top bar). Lists every tenant (searchable by name, subdomain,
// vertical) for one-keystroke impersonation + quick navigation
// to every super-admin panel. Vertical-neutral by design.
// ============================================================

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Bosh panel", href: "/super-admin" },
  { icon: Building2, label: "Firmalar", href: "/super-admin/tenants" },
  { icon: Users, label: "Adminlar (Firma Egalari)", href: "/super-admin/users" },
  { icon: CreditCard, label: "To'lovlar", href: "/super-admin/billing" },
  { icon: BarChart3, label: "Analitika", href: "/super-admin/analytics" },
  { icon: Globe, label: "Domenlar", href: "/super-admin/domains" },
  { icon: Bell, label: "Bildirishnomalar", href: "/super-admin/notifications" },
  { icon: Settings, label: "Sozlamalar", href: "/super-admin/settings" },
];

const itemCls =
  "rounded-xl px-3 py-2.5 text-sm text-white/80 data-[selected=true]:bg-white/10 data-[selected=true]:text-white cursor-pointer";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data } = useSuperAdminStats();
  const tenants: SaTenant[] = data?.tenants || [];

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const enterTenant = (t: SaTenant) => {
    setOpen(false);
    impersonateTenant(t as any);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Tezkor qidiruv (Ctrl+K)"
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 transition-colors text-xs"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Qidiruv</span>
        <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-[10px] font-mono font-bold">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        title="Tezkor qidiruv"
        className="sm:hidden p-2 rounded-lg hover:bg-white/5 text-foreground/60"
      >
        <Search className="w-5 h-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 max-w-lg bg-[#0D0D11]/95 border border-white/10 text-white rounded-2xl backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.7)]">
          <Command
            className="bg-transparent text-white [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-white/40"
            loop
          >
            <CommandInput
              placeholder="Qidiruv: firma, panel, amal..."
              className="text-white placeholder:text-white/35 h-12"
            />
            <CommandList className="max-h-[420px] p-1.5 custom-scrollbar">
              <CommandEmpty className="py-8 text-center text-sm text-white/40">
                Hech narsa topilmadi.
              </CommandEmpty>

              {/* Tenants — every registered business, any vertical */}
              {tenants.length > 0 && (
                <CommandGroup heading={`Firmalar (${tenants.length})`}>
                  {tenants.map((t) => {
                    const vs = verticalStyle(t.vertical);
                    const Icon = vs.icon;
                    return (
                      <CommandItem
                        key={t.id}
                        value={`${t.name} ${t.subdomain || ""} ${t.vertical} ${verticalLabel(t.vertical)}`}
                        onSelect={() => enterTenant(t)}
                        className={itemCls}
                      >
                        <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${vs.grad} border ${vs.ring} flex items-center justify-center mr-3 shrink-0`}>
                          <Icon className={`w-4 h-4 ${vs.text}`} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold truncate">{t.name}</span>
                          <span className="block text-[10px] text-white/40 truncate font-mono">
                            {t.subdomain ? `${t.subdomain}.unipath.me` : t.custom_domain || "—"} · {verticalLabel(t.vertical)}
                          </span>
                        </span>
                        <LogIn className="w-3.5 h-3.5 text-white/30 ml-2 shrink-0" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              <CommandSeparator className="bg-white/10 my-1" />

              {/* Panel navigation */}
              <CommandGroup heading="Panellar">
                {NAV_ITEMS.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${item.href}`}
                    onSelect={() => go(item.href)}
                    className={itemCls}
                  >
                    <item.icon className="w-4 h-4 mr-3 text-white/50" />
                    <span className="font-medium">{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>

            <div className="border-t border-white/10 px-3 py-2 flex items-center gap-3 text-[10px] text-white/35">
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">↑↓</kbd> tanlash</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">Enter</kbd> kirish</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">Esc</kbd> yopish</span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CommandPalette;
