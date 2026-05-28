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
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

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
  const [localSettings, setLocalSettings] = useState<any>(null);
  
  const firestore = useFirestore();

  // Reference to global site settings in Firestore
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "website");
  }, [firestore]);

  const { data: firestoreSettings } = useDoc(settingsRef);

  // Fetch local fallback settings once
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setLocalSettings(data))
      .catch(() => setLocalSettings(null));
  }, []);

  // Merge Firestore settings with local fallbacks
  const settings = useMemo(() => {
    if (!firestoreSettings) return localSettings;
    return {
      ...localSettings,
      site_title_en: firestoreSettings.siteTitleEn || localSettings?.site_title_en,
      site_title_hi: firestoreSettings.siteTitleHi || localSettings?.site_title_hi,
      favicon: firestoreSettings.favicon || localSettings?.favicon,
      liveAartiUrl: firestoreSettings.liveAartiUrl
    };
  }, [firestoreSettings, localSettings]);

  // Dynamically update Favicon and Apple Touch Icon in the document head
  // This logic runs safely after hydration to prevent Next.js metadata conflicts.
  useEffect(() => {
    if (typeof window === 'undefined' || !settings?.favicon) return;

    const updateLinkTag = (rel: string, href: string) => {
      let link: HTMLLinkElement | null = document.querySelector(`link[rel='${rel}']`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Update standard favicon
    updateLinkTag('icon', settings.favicon);
    // Update Apple Touch Icon
    updateLinkTag('apple-touch-icon', settings.favicon);

    // Update Title dynamically if provided
    const siteTitle = language === 'hi' ? settings.site_title_hi : settings.site_title_en;
    if (siteTitle) {
      document.title = siteTitle;
    }
  }, [settings, language]);

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
