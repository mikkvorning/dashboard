import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const mountElement =
  document.getElementById('datadein-dashboard-root') ??
  document.getElementById('root')

if (!mountElement) {
  throw new Error('Dashboard mount element was not found.')
}

createRoot(mountElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
