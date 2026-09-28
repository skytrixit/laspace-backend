import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Layout from './components/Layout'
import Services from './pages/Services'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/shot.css'
import './styles/services.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Layout>
      <Services />
    </Layout>
  </StrictMode>
)
