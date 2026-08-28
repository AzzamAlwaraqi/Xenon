// Libraries
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Application
import App from './app/App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import './assets/styles/index.css'

const rootElement = document.getElementById('root')

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </StrictMode>,
)
