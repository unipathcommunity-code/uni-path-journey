import { motion } from "framer-motion";
import { Sun, Moon, Globe } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage, Language } from "@/hooks/useLanguage";
import { useState } from "react";

const langs: { code: Language; label: string; flag: string }[] = [
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const ThemeLangSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [showLangs, setShowLangs] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? (
          <Sun className="w-4.5 h-4.5 text-warning" />
        ) : (
          <Moon className="w-4.5 h-4.5 text-primary" />
        )}
      </motion.button>

      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowLangs(!showLangs)}
          className="p-2 rounded-xl hover:bg-muted/50 transition-colors flex items-center gap-1"
        >
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase">{language}</span>
        </motion.button>

        {showLangs && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowLangs(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 top-full mt-1 z-50 glass-strong p-1.5 min-w-[140px]"
            >
              {langs.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setShowLangs(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    language === l.code ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span className="font-medium">{l.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default ThemeLangSwitcher;
