import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translations, type Dict, type Lang } from './translations'

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: Dict
}

const LanguageContext = createContext<Ctx | null>(null)

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem('jomok-lang')
    if (saved === 'ru' || saved === 'ky') return saved
    // Смотрим на ОСНОВНОЙ язык устройства (первый в списке предпочтений),
    // а не на любой из списка — иначе вторичный ky-KG перебивал основной ru.
    const primary = (
      navigator.language ||
      (navigator.languages && navigator.languages[0]) ||
      'ru'
    ).toLowerCase()
    return primary.startsWith('ky') ? 'ky' : 'ru'
  } catch {
    return 'ru'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru')

  useEffect(() => {
    const detected = detectLang()
    setLangState(detected)
    document.documentElement.lang = detected
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem('jomok-lang', l)
    } catch {
      // ignore
    }
    document.documentElement.lang = l
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang(): Ctx {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
