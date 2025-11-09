import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserData, updateUserData } from '../services/firebaseService';
import { supportedLanguages, type LanguageCode } from '../types';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define a type for our translations
type Translations = { [key: string]: string };

// In-memory cache for translations to prevent re-fetching
const translationsCache: { [key in LanguageCode]?: Translations } = {};

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500"></div>
    </div>
);


export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [translations, setTranslations] = useState<Translations | null>(null);

  // Load initial language from Firebase, then localStorage, then browser settings
  useEffect(() => {
    const initializeLanguage = async () => {
      let initialLang: LanguageCode = 'en'; // Default

      // 1. If user is logged in, try fetching from Firebase
      if (currentUser) {
        const userData = await getUserData(currentUser.uid);
        if (userData?.language && supportedLanguages[userData.language]) {
          setLanguageState(userData.language);
          return; // Exit after setting from Firebase
        }
      }
      
      // 2. If no user or no Firebase preference, check localStorage
      const savedLang = localStorage.getItem('agriGenius-lang') as LanguageCode;
      if (savedLang && supportedLanguages[savedLang]) {
        initialLang = savedLang;
      } else {
        // 3. Fallback to browser language
        const browserLang = navigator.language.split('-')[0] as LanguageCode;
        if (supportedLanguages[browserLang]) {
          initialLang = browserLang;
        }
      }
      setLanguageState(initialLang);
    };

    initializeLanguage();
  }, [currentUser]);
  
  // Effect to load translation files dynamically
  useEffect(() => {
    let isMounted = true;
    
    const loadTranslations = async (langToLoad: LanguageCode) => {
        // Use cached version if available
        if (translationsCache[langToLoad]) {
            if (isMounted) setTranslations(translationsCache[langToLoad]!);
            return;
        }

        try {
            // Use root-relative paths, assuming server serves from project root
            const response = await fetch(`/locales/${langToLoad}.json`);
            if (!response.ok) throw new Error(`Failed to fetch ${langToLoad}.json`);
            const data = await response.json();
            translationsCache[langToLoad] = data; // Cache the new translations
            if (isMounted) setTranslations(data);
        } catch (error) {
            console.warn(`Could not load translations for '${langToLoad}'. Falling back to English.`);
            // Fallback to English if the requested language fails
            if (langToLoad !== 'en' && isMounted) {
                await loadTranslations('en');
            } else if (isMounted) {
                // If English itself fails, set an empty object to stop the loader
                setTranslations({ "error": "Could not load any language files." });
            }
        }
    };

    loadTranslations(language);

    return () => {
        isMounted = false;
    };
  }, [language]);

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    localStorage.setItem('agriGenius-lang', lang);
    if (currentUser) {
      // Don't wait for this to finish to make the UI feel faster
      updateUserData(currentUser.uid, { language: lang }).catch(err => console.error("Failed to save language", err));
    }
    setTranslations(null); // Set to null to show loading spinner while fetching new language
    setLanguageState(lang);
    document.documentElement.lang = lang; // Set the lang attribute on the HTML tag for accessibility
  }, [currentUser]);

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }): string => {
    if (!translations) return key; // Should only happen briefly during load
    let translation = translations[key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
        });
    }
    return translation;
  }, [translations]);

  useEffect(() => {
    if (language) {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Show a loading spinner until the initial translations are loaded
  if (!translations) {
    return <LoadingSpinner />;
  }

  const value = { language, setLanguage, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};