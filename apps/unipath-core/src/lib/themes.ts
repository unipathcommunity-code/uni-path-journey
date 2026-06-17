export interface ThemePreset {
  id: string;
  name: string;
  nameUz: string;
  nameRu: string;
  colorHex: string; // Preview color hex
  light: {
    primary: string;
    primaryGlow: string;
    ring: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    sidebarPrimary: string;
    sidebarRing: string;
  };
  dark: {
    primary: string;
    primaryGlow: string;
    ring: string;
    sidebarPrimary: string;
    sidebarRing: string;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'luxury',
    name: 'Cosmic Luxury',
    nameUz: 'Kosmik Lyuks',
    nameRu: 'Космический Люкс',
    colorHex: '#6366f1',
    light: {
      primary: '243 75% 59%',
      primaryGlow: '243 75% 69%',
      ring: '243 75% 59%',
      secondary: '243 30% 96%',
      secondaryForeground: '243 50% 25%',
      accent: '243 40% 92%',
      accentForeground: '243 60% 30%',
      sidebarPrimary: '243 75% 59%',
      sidebarRing: '243 75% 59%',
    },
    dark: {
      primary: '245 80% 64%',
      primaryGlow: '245 80% 74%',
      ring: '245 80% 64%',
      sidebarPrimary: '245 80% 64%',
      sidebarRing: '245 80% 64%',
    }
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    nameUz: 'Zumrad Yashil',
    nameRu: 'Изумрудный Зеленый',
    colorHex: '#10b981',
    light: {
      primary: '142 71% 45%',
      primaryGlow: '142 71% 55%',
      ring: '142 71% 45%',
      secondary: '142 30% 95%',
      secondaryForeground: '142 50% 25%',
      accent: '142 40% 92%',
      accentForeground: '142 60% 30%',
      sidebarPrimary: '142 71% 45%',
      sidebarRing: '142 71% 45%',
    },
    dark: {
      primary: '142 71% 50%',
      primaryGlow: '142 71% 60%',
      ring: '142 71% 50%',
      sidebarPrimary: '142 71% 50%',
      sidebarRing: '142 71% 50%',
    }
  },
  {
    id: 'blue',
    name: 'Royal Blue',
    nameUz: 'Qirollik Ko\'k',
    nameRu: 'Королевский Синий',
    colorHex: '#3b82f6',
    light: {
      primary: '221 83% 53%',
      primaryGlow: '221 83% 63%',
      ring: '221 83% 53%',
      secondary: '221 30% 95%',
      secondaryForeground: '221 50% 25%',
      accent: '221 40% 92%',
      accentForeground: '221 60% 30%',
      sidebarPrimary: '221 83% 53%',
      sidebarRing: '221 83% 53%',
    },
    dark: {
      primary: '217 91% 60%',
      primaryGlow: '217 91% 70%',
      ring: '217 91% 60%',
      sidebarPrimary: '217 91% 60%',
      sidebarRing: '217 91% 60%',
    }
  },
  {
    id: 'purple',
    name: 'Purple Premium',
    nameUz: 'Premium Siyohrang',
    nameRu: 'Премиум Пурпурный',
    colorHex: '#8b5cf6',
    light: {
      primary: '262 83% 58%',
      primaryGlow: '262 83% 68%',
      ring: '262 83% 58%',
      secondary: '262 30% 95%',
      secondaryForeground: '262 50% 25%',
      accent: '262 40% 92%',
      accentForeground: '262 60% 30%',
      sidebarPrimary: '262 83% 58%',
      sidebarRing: '262 83% 58%',
    },
    dark: {
      primary: '263 90% 64%',
      primaryGlow: '263 90% 74%',
      ring: '263 90% 64%',
      sidebarPrimary: '263 90% 64%',
      sidebarRing: '263 90% 64%',
    }
  },
  {
    id: 'rose',
    name: 'Sunrise Rose',
    nameUz: 'Tonggi Pushti',
    nameRu: 'Утренняя Роза',
    colorHex: '#f43f5e',
    light: {
      primary: '346 87% 55%',
      primaryGlow: '346 87% 65%',
      ring: '346 87% 55%',
      secondary: '346 30% 95%',
      secondaryForeground: '346 50% 25%',
      accent: '346 40% 92%',
      accentForeground: '346 60% 30%',
      sidebarPrimary: '346 87% 55%',
      sidebarRing: '346 87% 55%',
    },
    dark: {
      primary: '346 87% 60%',
      primaryGlow: '346 87% 70%',
      ring: '346 87% 60%',
      sidebarPrimary: '346 87% 60%',
      sidebarRing: '346 87% 60%',
    }
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    nameUz: 'Kechki Kehribar',
    nameRu: 'Закатный Янтарный',
    colorHex: '#f97316',
    light: {
      primary: '24 95% 50%',
      primaryGlow: '24 95% 60%',
      ring: '24 95% 50%',
      secondary: '24 30% 95%',
      secondaryForeground: '24 50% 25%',
      accent: '24 40% 92%',
      accentForeground: '24 60% 30%',
      sidebarPrimary: '24 95% 50%',
      sidebarRing: '24 95% 50%',
    },
    dark: {
      primary: '24 95% 55%',
      primaryGlow: '24 95% 65%',
      ring: '24 95% 55%',
      sidebarPrimary: '24 95% 55%',
      sidebarRing: '24 95% 55%',
    }
  }
];

export function injectTheme(themeId: string | null | undefined) {
  if (typeof window === 'undefined') return;

  const theme = THEME_PRESETS.find(t => t.id === themeId) || THEME_PRESETS[0];

  // Helper to set variables
  const setVar = (name: string, value: string) => {
    document.documentElement.style.setProperty(name, value);
  };

  // We detect dark mode by looking at the 'dark' class on documentElement or local storage settings
  const isDarkMode = document.documentElement.classList.contains('dark');
  const values = isDarkMode ? { ...theme.light, ...theme.dark } : theme.light;

  // Apply to document element style
  setVar('--primary', values.primary);
  setVar('--primary-glow', values.primaryGlow);
  setVar('--ring', values.ring);
  
  if (!isDarkMode) {
    setVar('--secondary', values.secondary);
    setVar('--secondary-foreground', values.secondaryForeground);
    setVar('--accent', values.accent);
    setVar('--accent-foreground', values.accentForeground);
  }

  setVar('--sidebar-primary', values.sidebarPrimary);
  setVar('--sidebar-ring', values.sidebarRing);
}
