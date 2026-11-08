import Navbar from './Navbar'
import Footer from './Footer'
import ConsultationModal from './ConsultationModal'
import { currentPath } from '../lib/path'

/** Shared page chrome: skip link, fixed navbar, main landmark, footer, modal. */
export default function Layout({ children }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar currentPath={currentPath()} />
      <main id="main">{children}</main>
      <Footer />
      {/* Mounted once here, so every page has exactly one. */}
      <ConsultationModal />
    </>
  )
}
