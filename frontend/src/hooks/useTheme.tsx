import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'
interface ThemeContextValue { theme: Theme; toggleTheme: () => void; language: 'en' | 'ar'; toggleLanguage: () => void }
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('echocloud-theme') === 'dark' ? 'dark' : 'light')
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem('echocloud-theme', theme) }, [theme])
  useEffect(() => { document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = language }, [language])
  const value = useMemo(() => ({ theme, toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light'), language, toggleLanguage: () => setLanguage((current) => current === 'en' ? 'ar' : 'en') }), [language, theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
export function useTheme(): ThemeContextValue { const context = useContext(ThemeContext); if (!context) throw new Error('useTheme must be used inside ThemeProvider'); return context }
