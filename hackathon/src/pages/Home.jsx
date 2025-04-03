import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function Home() {
  const [boards, setBoards] = useState([])
  const [newBoardName, setNewBoardName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/boards')
        setBoards(response.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching boards:', err)
        setError('Failed to load boards. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchBoards()
  }, [])

  const handleCreateBoard = async (e) => {
    e.preventDefault()
    if (!newBoardName.trim()) return

    try {
      const response = await axios.post('/api/boards', {
        name: newBoardName,
        elements: []
      })
      setBoards([...boards, response.data])
      setNewBoardName('')
    } catch (err) {
      setError('Failed to create board. Please try again.')
      console.error('Error creating board:', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">CollabBoard</h1>
        <p className="text-gray-600 dark:text-gray-300">
          A real-time collaborative whiteboard where you can draw, sketch, and work together with your team.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Board</h2>
        <form onSubmit={handleCreateBoard} className="flex gap-2">
          <input
            type="text"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="Enter board name"
            className="flex-grow px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Board
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Boards</h2>
        
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        {loading ? (
          <p>Loading boards...</p>
        ) : boards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boards.map(board => (
              <Link
                key={board._id}
                to={`/board/${board._id}`}
                className="block p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700"
              >
                <h3 className="font-medium">{board.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {new Date(board.updatedAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No boards yet. Create your first board above!</p>
        )}
      </div>
    </div>
  )
}

export default Home
