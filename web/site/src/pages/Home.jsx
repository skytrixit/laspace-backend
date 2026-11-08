import Hero from '../components/sections/Hero'
import WhoWeAre from '../components/sections/WhoWeAre'
import Services from '../components/sections/Services'
import Portfolio from '../components/sections/Portfolio'
import Process from '../components/sections/Process'
import Stats from '../components/sections/Stats'
import Testimonials from '../components/sections/Testimonials'
import Partners from '../components/sections/Partners'
import Faq from '../components/sections/Faq'
import FinalCta from '../components/sections/FinalCta'

// Head meta for this document lives in index.html so crawlers get it with
// zero JS; JSON-LD graphs are injected at build time from src/data/site.js.
export default function Home() {
  return (
    <>
      <Hero />
      <WhoWeAre />
      <Services />
      <Portfolio />
      <Process />
      <Stats />
      <Testimonials />
      <Partners />
      <Faq />
      <FinalCta />
    </>
  )
}
