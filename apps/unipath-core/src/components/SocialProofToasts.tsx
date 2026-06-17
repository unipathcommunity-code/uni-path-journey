import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { useApp } from '@/contexts/AppContext';

const DEFAULT_NAMES = ['Aziz', 'Nodira', 'Sardor', 'Dilnoza', 'Jasur', 'Malika', 'Bobur', 'Kamola', 'Otabek', 'Shaxlo', 'Bekzod', 'Nilufar'];
const DEFAULT_UNIVERSITIES = [
  'Technical University of Munich', 'Korea University', 'University of Tokyo',
  'Charles University', 'Sungkyunkwan University', 'MIT',
  'Jagiellonian University', 'Bilkent University', 'Peking University',
];
const DEFAULT_FLAGS = ['🇩🇪', '🇰🇷', '🇯🇵', '🇨🇿', '🇰🇷', '🇺🇸', '🇵🇱', '🇹🇷', '🇨🇳'];

const DEFAULT_MESSAGES = [
  (n: string, u: string, f: string) => `${f} ${n} just got admitted to ${u}!`,
  (n: string, _u: string, f: string) => `${f} ${n} applied to 3 universities today!`,
  (_n: string, _u: string, _f: string) => `🔥 5 students applied in the last hour!`,
  (n: string, u: string, f: string) => `${f} ${n} received a scholarship from ${u}!`,
];

export function SocialProofToasts() {
  const { role } = useUserRole();
  const { activeTenant } = useApp();
  const location = useLocation();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const configSettings = activeTenant?.config?.settings;
  const enabled = configSettings?.socialProofToasts !== false;
  const frequency = (configSettings?.socialProofFrequency ?? 60) * 1000;
  const customMessages = configSettings?.socialProofMessages || [];
  const customUniversities = configSettings?.socialProofUniversities || [];

  useEffect(() => {
    const isSystemPath = 
      location.pathname.startsWith('/admin') || 
      location.pathname.startsWith('/super-admin') ||
      location.pathname.startsWith('/control') ||
      location.pathname === '/auth' ||
      location.pathname === '/onboarding' ||
      location.pathname === '/select-country' ||
      location.pathname === '/pending-approval';

    // Only show social proof toasts for students/visitors, not on system/admin/auth paths, and not for staff roles
    if (isSystemPath || !enabled || role === 'admin' || role === 'agent' || role === 'super_admin' || role === 'owner' || role === 'manager' || !activeTenant) return;


    const universities = customUniversities.length > 0 ? customUniversities : DEFAULT_UNIVERSITIES;

    const showToast = () => {
      const name = DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
      const uniIdx = Math.floor(Math.random() * universities.length);
      const uni = universities[uniIdx];
      const flag = DEFAULT_FLAGS[uniIdx % DEFAULT_FLAGS.length] || '🎓';

      let message: string;
      if (customMessages.length > 0) {
        message = customMessages[Math.floor(Math.random() * customMessages.length)]
          .replace('{name}', name)
          .replace('{university}', uni)
          .replace('{flag}', flag);
      } else {
        const msgFn = DEFAULT_MESSAGES[Math.floor(Math.random() * DEFAULT_MESSAGES.length)];
        message = msgFn(name, uni, flag);
      }

      toast(message, {
        duration: 3500,
        position: 'top-right',
        className: 'text-sm',
      });
    };

    const timeout = setTimeout(() => {
      showToast();
      intervalRef.current = setInterval(showToast, frequency);
    }, 20000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, frequency, customMessages, customUniversities, role, location.pathname, activeTenant]);

  return null;
}
