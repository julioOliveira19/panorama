import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './base.css'
import PanoramaApp from './PanoramaApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PanoramaApp />
  </StrictMode>,
)
