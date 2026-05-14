// src/contexts/LanguageContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { translations, TranslationKeys } from "@/lib/translations";

type Language = "hi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslationKeys;
  isLangLoading: boolean;
  showLangPopup: boolean;
  setShowLangPopup: React.Dispatch<React.SetStateAction<boolean>>;
  settings: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("hi");
  const [isLangLoading, setIsLangLoading] = useState(true);
  const [showLangPopup, setShowLangPopup] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Fetch settings once at the root level
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => setSettings(null));
  }, []);

  useEffect(() => {
    const storedLang = localStorage.getItem("language") as Language | null;
    if (storedLang && ["hi", "en"].includes(storedLang)) {
      setLanguageState(storedLang);
    } else {
      setShowLangPopup(true);
    }
    setIsLangLoading(false);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    setShowLangPopup(false);
  }, []);

  const t = translations[language];

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    isLangLoading,
    showLangPopup,
    setShowLangPopup,
    settings,
  }), [language, setLanguage, t, isLangLoading, showLangPopup, settings]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
