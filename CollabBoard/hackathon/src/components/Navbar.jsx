import { Link } from 'react-router-dom'
import { FaUser, FaSignOutAlt, FaPaintBrush } from 'react-icons/fa'
import { useAuthStore } from '../store/authStore'

function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  
  return (
    <nav className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-2xl">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-white p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
            <FaPaintBrush className="text-2xl text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-white drop-shadow-lg tracking-tight">
            CollabBoard
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="text-white hover:text-gray-200 font-medium transition-colors duration-200 hover:scale-105 transform"
          >
            Home
          </Link>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg hover:bg-white/30 transition-all duration-200"
              >
                <span 
                  className="w-3 h-3 rounded-full mr-2 animate-pulse shadow-lg"
                  style={{ backgroundColor: user?.color || '#3B82F6', boxShadow: `0 0 10px ${user?.color || '#3B82F6'}` }}
                />
                <span className="text-white font-semibold">{user?.username}</span>
              </div>
              
              <button 
                onClick={logout}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-all duration-200 font-medium shadow-lg hover:scale-105 transform"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="text-white hover:text-gray-200 font-medium px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-200"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2 rounded-lg hover:bg-gray-100 font-semibold shadow-lg hover:scale-105 transform transition-all duration-200"
              >
                <FaUser />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
