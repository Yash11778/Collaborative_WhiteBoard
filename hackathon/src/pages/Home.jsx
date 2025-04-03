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
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          Welcome to CollabBoard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create or join a board to start collaborating in real-time
        </p>
      </header>

      {!isAuthenticated && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">Try CollabBoard</h2>
          <p className="mb-4">Experience the collaborative whiteboard without registration</p>
          <button
            onClick={handleTryDemo}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <FaUserCheck className="mr-2" />
            Try Demo
          </button>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Create New Board</h2>
        <form onSubmit={handleCreateBoard} className="flex items-center">
          <input
            type="text"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="Board name"
            className="flex-grow p-2 border border-gray-300 dark:border-gray-700 rounded-l shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            disabled={isCreating}
          />
          <button
            type="submit"
            className="flex items-center bg-green-600 text-white p-2 rounded-r hover:bg-green-700 transition-colors"
            disabled={isCreating}
          >
            <FaPlus className="mr-2" />
            Create
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Available Boards</h2>
        
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading boards...</p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        ) : boards.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No boards available. Create one to get started!</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {boards.map((board) => (
              <Link
                key={board._id}
                to={`/board/${board._id}`}
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-medium text-lg mb-2">{board.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Created: {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
