import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Crown, Building2, Shield, GraduationCap, BookOpen, Users, Wallet, LucideIcon } from "lucide-react";
import BackButton from "@/components/BackButton";
import ThemeLangSwitcher from "@/components/ThemeLangSwitcher";
import BranchSwitcher from "@/components/BranchSwitcher";

export type DashboardLayer =
  | "superadmin"
  | "owner"
  | "admin"
  | "teacher"
  | "student"
  | "parent"
  | "accountant";

interface LayerVisual {
  Icon: LucideIcon;
  /** Tailwind classes for the rounded icon tile (gradient + glow). Uses semantic tokens. */
  tileClass: string;
  /** Ribbon strip color along the top of the page */
  ribbonClass: string;
  /** Text gradient for the title */
  titleClass: string;
  /** Default badge label shown next to title */
  badge: string;
  /** Default subtitle if none provided */
  defaultSubtitle: string;
}

const LAYERS: Record<DashboardLayer, LayerVisual> = {
  superadmin: {
    Icon: Crown,
    tileClass:
      "bg-gradient-to-br from-accent to-primary shadow-lg shadow-accent/40",
    ribbonClass: "bg-gradient-to-r from-accent via-primary to-accent",
    titleClass: "text-gradient-primary",
    badge: "PLATFORM",
    defaultSubtitle: "Platforma egasi · barcha markazlarni boshqarish",
  },
  owner: {
    Icon: Building2,
    tileClass:
      "bg-gradient-to-br from-warning to-warning/70 shadow-lg shadow-warning/40",
    ribbonClass: "bg-gradient-to-r from-warning via-warning/60 to-warning",
    titleClass: "bg-clip-text text-transparent bg-gradient-to-r from-warning to-warning/70",
    badge: "OWNER",
    defaultSubtitle: "Markaz egasi · filiallar va xodimlarni boshqarish",
  },
  admin: {
    Icon: Shield,
    tileClass:
      "bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30",
    ribbonClass: "bg-gradient-to-r from-primary via-primary/60 to-primary",
    titleClass: "text-gradient-primary",
    badge: "ADMIN",
    defaultSubtitle: "Filial admini · kunlik operatsiyalar",
  },
  teacher: {
    Icon: BookOpen,
    tileClass:
      "bg-gradient-to-br from-accent to-accent/70 shadow-lg shadow-accent/30",
    ribbonClass: "bg-gradient-to-r from-accent via-accent/60 to-accent",
    titleClass: "bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary",
    badge: "TEACHER",
    defaultSubtitle: "O'qituvchi paneli",
  },
  student: {
    Icon: GraduationCap,
    tileClass:
      "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30",
    ribbonClass: "bg-gradient-to-r from-primary via-accent to-primary",
    titleClass: "text-gradient-primary",
    badge: "STUDENT",
    defaultSubtitle: "O'quvchi paneli",
  },
  parent: {
    Icon: Users,
    tileClass:
      "bg-gradient-to-br from-success to-success/70 shadow-lg shadow-success/30",
    ribbonClass: "bg-gradient-to-r from-success via-success/60 to-success",
    titleClass: "bg-clip-text text-transparent bg-gradient-to-r from-success to-primary",
    badge: "PARENT",
    defaultSubtitle: "Ota-ona oynasi",
  },
  accountant: {
    Icon: Wallet,
    tileClass:
      "bg-gradient-to-br from-success to-warning shadow-lg shadow-success/30",
    ribbonClass: "bg-gradient-to-r from-success via-warning to-success",
    titleClass: "bg-clip-text text-transparent bg-gradient-to-r from-success to-warning",
    badge: "FINANCE",
    defaultSubtitle: "Buxgalter paneli",
  },
};

interface DashboardHeaderProps {
  layer: DashboardLayer;
  title: string;
  subtitle?: string;
  backTo?: string;
  /** Slot for extra actions (branch switcher, profile button, etc.) */
  actions?: ReactNode;
  /** Override the default icon (e.g. SuperAdmin uses Crown by default) */
  icon?: LucideIcon;
}

const DashboardHeader = ({
  layer,
  title,
  subtitle,
  backTo = "/app",
  actions,
  icon,
}: DashboardHeaderProps) => {
  const v = LAYERS[layer];
  const Icon = icon || v.Icon;

  return (
    <>
      {/* Top color ribbon — instantly tells the user which layer they are in */}
      <div className={`absolute top-0 inset-x-0 h-1 ${v.ribbonClass} z-20`} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 relative z-30"
      >
        <BackButton to={backTo} />

        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${v.tileClass}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-base sm:text-2xl font-bold font-heading truncate ${v.titleClass}`}>
                {title}
              </h1>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-card/60 border border-border text-muted-foreground hidden sm:inline">
                {v.badge}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {subtitle || v.defaultSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {(layer === "owner" || layer === "admin" || layer === "teacher" || layer === "accountant") && <BranchSwitcher />}
          {actions}
          <ThemeLangSwitcher />
        </div>
      </motion.div>
    </>
  );
};

export default DashboardHeader;
