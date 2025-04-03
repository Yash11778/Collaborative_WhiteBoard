import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-500">
          CollabBoard
        </Link>
        
        <div>
          <Link 
            to="/" 
            className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 mr-4"
          >
            Home
          </Link>
          {/* Add more nav links as needed */}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
