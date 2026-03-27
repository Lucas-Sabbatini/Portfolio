import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.VITE_UMAMI_URL && import.meta.env.VITE_UMAMI_WEBSITE_ID) {
  const script = document.createElement('script')
  script.defer = true
  script.src = `${import.meta.env.VITE_UMAMI_URL}/script.js`
  script.dataset.websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID
  document.head.appendChild(script)
}

createRoot(document.getElementById('root')!).render(<App />)
