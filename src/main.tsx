import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './base.css'
import PanoramaApp from './PanoramaApp.tsx'
import { applyTheme, getInitialTheme } from './lib/theme'

applyTheme(getInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PanoramaApp />
  </StrictMode>,
)
