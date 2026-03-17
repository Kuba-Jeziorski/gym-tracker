import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import {
  type Locale,
  translations,
  getStoredLocale,
  setStoredLocale,
} from '../i18n/translations'

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    setStoredLocale(next)
  }, [])

  const t = useCallback(
    (key: string): string => {
      const dict = translations[locale]
      return dict[key] ?? translations.en[key] ?? key
    },
    [locale]
  )

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (value === null) throw new Error('useLanguage must be used within LanguageProvider')
  return value
}
