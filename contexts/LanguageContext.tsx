import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  FC,
  ReactNode,
} from "react";

type Language = "nl" | "en";

interface Translations {
  pricing: {
    title: string;
    subtitle: string;
    standardAccess: string;
    standardDesc: string;
    turns: string;
    moreSoon: string;
  };
  common: {
    madeBy: string;
  };
  nav: {
    signOut: string;
  };
}

const translations: Record<Language, Translations> = {
  nl: {
    pricing: {
      title: "Credits & Toegang",
      subtitle: "Kies je neurale capaciteit. Betaal per credit of kies een abonnement.",
      standardAccess: "Credits Kopen",
      standardDesc: "Eenmalige credits, nooit verlopen.",
      turns: "Credits",
      moreSoon: "Alle pakketten worden direct verwerkt via Stripe.",
    },
    common: {
      madeBy: "Gemaakt door",
    },
    nav: {
      signOut: "Uitloggen",
    },
  },
  en: {
    pricing: {
      title: "Credits & Access",
      subtitle: "Choose your neural capacity. Pay per credit or subscribe.",
      standardAccess: "Buy Credits",
      standardDesc: "One-time credits, never expire.",
      turns: "Credits",
      moreSoon: "All packages processed instantly via Stripe.",
    },
    common: {
      madeBy: "Made by",
    },
    nav: {
      signOut: "Sign out",
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("nl");

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
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
