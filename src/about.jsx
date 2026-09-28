import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Layout from './components/Layout'
import About from './pages/About'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/shot.css'
import './styles/about.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Layout>
      <About />
    </Layout>
  </StrictMode>
)
