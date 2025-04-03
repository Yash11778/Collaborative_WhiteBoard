import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import BoardView from './pages/BoardView'
import Navbar from './components/Navbar'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/board/:boardId" element={<BoardView />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
