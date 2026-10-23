import type { Theme } from '../types'

const THEME_STORAGE_KEY = 'panorama-theme'

export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // A preferência do sistema continua funcionando quando o armazenamento está bloqueado.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#101614' : '#f3f5f1')
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // O tema ainda pode ser aplicado durante a sessão sem armazenamento persistente.
  }
  applyTheme(theme)
}
