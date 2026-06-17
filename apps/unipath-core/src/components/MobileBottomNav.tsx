import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Home, GraduationCap, FolderOpen, Plane, User, Menu } from 'lucide-react';

const navItems = [
  { icon: Home, href: '/student/dashboard', labelKey: 'home' },
  { icon: GraduationCap, href: '/student/applications', labelKey: 'apps' },
  { icon: FolderOpen, href: '/student/documents', labelKey: 'docs' },
  { icon: Plane, href: '/student/visa', labelKey: 'visa' },
  { icon: User, href: '/student/profile', labelKey: 'profile' },
];

const labels: Record<string, Record<string, string>> = {
  home: { en: 'Home', uz: 'Bosh', ru: 'Главная' },
  apps: { en: 'Apply', uz: 'Ariza', ru: 'Заявки' },
  docs: { en: 'Docs', uz: 'Hujjat', ru: 'Доки' },
  visa: { en: 'Visa', uz: 'Viza', ru: 'Виза' },
  profile: { en: 'Profile', uz: 'Profil', ru: 'Профиль' },
};

interface MobileBottomNavProps {
  onMenuOpen?: () => void;
}

export function MobileBottomNav({ onMenuOpen }: MobileBottomNavProps) {
  const location = useLocation();
  const { language } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/96 backdrop-blur-xl border-t border-border lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href === '/student/profile' && location.pathname.startsWith('/student/profile'));
          const label = labels[item.labelKey]?.[language] || labels[item.labelKey]?.en;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors active:scale-95 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className={`w-[22px] h-[22px] ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className={`text-[9px] font-medium leading-none ${isActive ? 'font-semibold' : ''}`}>{label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </Link>
          );
        })}

        {/* More / Menu button */}
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg text-muted-foreground active:scale-95 transition-colors"
          >
            <Menu className="w-[22px] h-[22px] stroke-[1.75]" />
            <span className="text-[9px] font-medium leading-none">
              {language === 'uz' ? 'Ko\'proq' : language === 'ru' ? 'Ещё' : 'More'}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
