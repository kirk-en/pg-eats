import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import esTranslations from "./locales/es.json";

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem("i18nLanguage") || "en";

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    es: { translation: esTranslations },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18next;
