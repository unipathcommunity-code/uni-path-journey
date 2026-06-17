import { Wallet } from "lucide-react";
import BackButton from "@/components/BackButton";
import ThemeLangSwitcher from "@/components/ThemeLangSwitcher";
import NotificationsBell from "@/components/NotificationsBell";

const AccountantHeader = () => (
  <header className="sticky top-0 z-30 glass-strong border-b border-border/50">
    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="font-heading font-bold text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Buxgalteriya
          </h1>
          <p className="text-xs text-muted-foreground">Hisob-fakturalar, maoshlar, taqqoslash</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationsBell />
        <ThemeLangSwitcher />
      </div>
    </div>
  </header>
);

export default AccountantHeader;
