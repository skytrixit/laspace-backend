import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Layout from './components/Layout'
import Projects from './pages/Projects'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/projects.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Layout>
      <Projects />
    </Layout>
  </StrictMode>
)
