import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, TranslationKey, TranslationSubKey } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: <T extends TranslationKey>(category: T, key: TranslationSubKey<T>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'healthcare-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'ko' || saved === 'en') {
        return saved;
      }
    }
    return 'ko';
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = <T extends TranslationKey>(category: T, key: TranslationSubKey<T>): string => {
    const categoryData = translations[category];
    if (!categoryData) return String(key);
    
    const translation = categoryData[key as keyof typeof categoryData] as unknown as { ko: string; en: string } | undefined;
    if (!translation) return String(key);
    
    return translation[language] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
