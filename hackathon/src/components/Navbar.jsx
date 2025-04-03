import { Link } from 'react-router-dom'
import { FaUser, FaSignOutAlt } from 'react-icons/fa'
import { useAuthStore } from '../store/authStore'

function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  
  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-500">
          CollabBoard
        </Link>
        
        <div className="flex items-center">
          <Link 
            to="/" 
            className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 mr-4"
          >
            Home
          </Link>
          
          {isAuthenticated ? (
            <div className="flex items-center">
              <div 
                className="flex items-center mr-4 text-gray-600 dark:text-gray-300"
                style={{ color: user?.color || 'currentColor' }}
              >
                <span 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: user?.color || 'currentColor' }}
                />
                <span>{user?.username}</span>
              </div>
              
              <button 
                onClick={logout}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
              >
                <FaSignOutAlt className="mr-1" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <Link 
                to="/login" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 mr-4"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="flex items-center bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
              >
                <FaUser className="mr-1" />
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
