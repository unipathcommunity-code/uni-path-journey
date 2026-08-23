import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uz from "./locales/uz.json";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

// AppContext owns the language; this is only the first-paint default.
const savedLang = localStorage.getItem("unipath_language") || "uz";

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: savedLang,
  fallbackLng: "uz",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("unipath_language", lng);
});

export default i18n;
