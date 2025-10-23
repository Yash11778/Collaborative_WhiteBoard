import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import './App.css'
import { preloadSounds } from './utils/soundUtils'
import { useAuthStore } from './store/authStore'

function App() {
  const { initAuth } = useAuthStore();
  
  useEffect(() => {
    // Initialize authentication from stored token
    initAuth();
    
    // Preload sound effects
    preloadSounds();
  }, [initAuth]);
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default App
