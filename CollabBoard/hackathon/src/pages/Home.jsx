import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaUserCheck } from 'react-icons/fa';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

function Home() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, demoLogin } = useAuthStore();

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await axios.get('/api/boards');
        setBoards(response.data);
      } catch (err) {
        console.error('Error fetching boards:', err);
        setError('Failed to load boards. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    
    if (!newBoardName.trim()) {
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await axios.post('/api/boards', {
        name: newBoardName.trim()
      });
      
      setBoards([...boards, response.data]);
      setNewBoardName('');
      
      // Navigate to the new board
      navigate(`/board/${response.data._id}`);
    } catch (err) {
      console.error('Error creating board:', err);
      setError('Failed to create board. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTryDemo = async () => {
    // Try demo login
    const success = await demoLogin();
    if (success) {
      // If there's a demo board, navigate to it
      const demoBoard = boards.find(board => board._id === 'demo-board-123');
      if (demoBoard) {
        navigate(`/board/${demoBoard._id}`);
      } else {
        // Create a new board
        try {
          const response = await axios.post('/api/boards', {
            name: 'My Demo Board'
          });
          navigate(`/board/${response.data._id}`);
        } catch (err) {
          console.error('Error creating demo board:', err);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-pulse">
            Welcome to CollabBoard
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Create or join a board to start collaborating in real-time with your team
          </p>
        </header>

        {!isAuthenticated && (
          <div className="mb-12 p-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl border-2 border-blue-300 dark:border-blue-700 transform hover:scale-105 transition-transform duration-300">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-3">🎨 Try CollabBoard Now!</h2>
              <p className="mb-6 text-lg text-blue-100">Experience the collaborative whiteboard without registration</p>
              <button
                onClick={handleTryDemo}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition-all duration-200 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-110"
              >
                <FaUserCheck className="text-2xl" />
                Try Demo Board
              </button>
            </div>
          </div>
        )}

        <div className="mb-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800 dark:text-white">
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl">
              <FaPlus />
            </span>
            Create New Board
          </h2>
          <form onSubmit={handleCreateBoard} className="flex gap-3">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Enter board name..."
              className="flex-grow px-6 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg transition-all duration-200"
              disabled={isCreating}
            />
            <button
              type="submit"
              className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating}
            >
              <FaPlus className="text-xl" />
              {isCreating ? 'Creating...' : 'Create Board'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📋 Available Boards</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">Loading boards...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl p-6 text-center">
              <p className="text-red-600 dark:text-red-400 text-lg font-semibold">{error}</p>
            </div>
          ) : boards.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-gray-600 dark:text-gray-400 text-xl">No boards available yet. Create your first board to get started! 🚀</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {boards.map((board) => (
                <Link
                  key={board._id}
                  to={`/board/${board._id}`}
                  className="group block p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transform hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {board.name}
                    </h3>
                    <span className="text-2xl">🎨</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="font-medium">📅</span>
                    Created: {new Date(board.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                      Open Board →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
