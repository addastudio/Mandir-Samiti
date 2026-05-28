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
  // This overrides any default browser/host icons (e.g. Firebase logo)
  useEffect(() => {
    if (settings?.favicon) {
      // 1. Update/Inject standard favicon
      let iconLink: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
      }
      iconLink.href = settings.favicon;

      // 2. Update/Inject Apple Touch Icon
      let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      appleLink.href = settings.favicon;

      // 3. Update Title dynamically if needed
      const siteTitle = language === 'hi' ? settings.site_title_hi : settings.site_title_en;
      if (siteTitle) {
        document.title = siteTitle;
      }
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
