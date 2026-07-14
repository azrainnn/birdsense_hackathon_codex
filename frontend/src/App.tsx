import { Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { HistoryPage } from './pages/HistoryPage'
import { IdentifyPage } from './pages/IdentifyPage'
import { SpeciesPage } from './pages/SpeciesPage'

function App() {
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<IdentifyPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/species" element={<SpeciesPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
