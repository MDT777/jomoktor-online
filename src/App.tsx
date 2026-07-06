import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Benefits } from './components/Benefits'
import { Examples } from './components/Examples'
import { Library } from './components/Library'
import { Faq } from './components/Faq'
import { ComingSoon } from './components/ComingSoon'
import { Footer } from './components/Footer'
import { LeadModal } from './components/LeadModal'
import { AuthPage } from './pages/AuthPage'
import { AccountPage } from './pages/AccountPage'

function Landing() {
  const [leadOpen, setLeadOpen] = useState(false)
  const openLead = () => setLeadOpen(true)

  return (
    <>
      <Nav onCreate={openLead} />
      <main>
        <Hero onCreate={openLead} />
        <HowItWorks />
        <Benefits />
        <Examples onCreate={openLead} />
        <Library onCreate={openLead} />
        <Faq />
        <ComingSoon />
      </main>
      <Footer />
      <LeadModal open={leadOpen} onClose={() => setLeadOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/account" element={<AccountPage />} />
    </Routes>
  )
}
