import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './base.css'
import PanoramaApp from './PanoramaApp.tsx'
import { applyLanguage, getInitialLanguage } from './lib/i18n'
import { applyTheme, getInitialTheme } from './lib/theme'

applyTheme(getInitialTheme())
applyLanguage(getInitialLanguage())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PanoramaApp />
  </StrictMode>,
)
