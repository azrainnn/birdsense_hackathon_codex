import { Navigate, Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { HistoryPage } from './pages/HistoryPage'
import { IdentifyPage } from './pages/IdentifyPage'
import { LandingPage } from './pages/LandingPage'
import { SpeciesPage } from './pages/SpeciesPage'

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/identify" element={<IdentifyPage />} />
          <Route path="/species" element={<SpeciesPage />} />
          <Route path="/field-log" element={<HistoryPage />} />
          <Route path="/history" element={<Navigate to="/field-log" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-forest/10 bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-5 py-5 text-xs text-muted sm:flex-row sm:px-8">
          <p><span className="font-semibold text-forest">BirdSense</span> · AI-assisted Bornean bird acoustic identification</p>
          <p>Designed with uncertainty and sensitive wildlife in mind.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
