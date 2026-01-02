import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface I18nContextType {
  language: "en" | "es";
  setLanguage: (lang: "en" | "es") => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<"en" | "es">(
    (localStorage.getItem("i18nLanguage") as "en" | "es") || "en"
  );

  const setLanguage = (lang: "en" | "es") => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nLanguage", lang);
  };

  useEffect(() => {
    // Sync language on mount
    const savedLang =
      (localStorage.getItem("i18nLanguage") as "en" | "es") || "en";
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    <I18nContext.Provider value={{ language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
};
