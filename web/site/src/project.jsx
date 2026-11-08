import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Layout from './components/Layout'
import Project from './pages/Project'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/project.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Layout>
      <Project />
    </Layout>
  </StrictMode>
)
