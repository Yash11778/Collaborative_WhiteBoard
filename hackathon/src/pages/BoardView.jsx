import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Canvas from '../components/Canvas'
import Toolbar from '../components/Toolbar'
import UserPresence from '../components/UserPresence'
import ErrorBoundary from '../components/ErrorBoundary'
import ShareBoard from '../components/ShareBoard'
import { useBoardStore } from '../store/boardStore'

function BoardView() {
  const { boardId } = useParams()
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { setElements } = useBoardStore()

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/boards/${boardId}`)
        setBoard(response.data)
        setElements(response.data.elements || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching board:', err)
        setError('Failed to load this whiteboard. It may not exist or you might not have access.')
      } finally {
        setLoading(false)
      }
    }

    fetchBoard()
  }, [boardId, setElements])

  if (loading) return <div className="flex justify-center p-12">Loading whiteboard...</div>
  if (error) return <div className="text-red-500 p-8">{error}</div>

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{board?.name || 'Untitled Board'}</h1>
        
        <div className="flex items-center space-x-4">
          <UserPresence boardId={boardId} />
          <ShareBoard boardId={boardId} boardName={board?.name} />
        </div>
      </div>
      
      <div className="flex flex-col flex-grow overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow">
        <Toolbar boardId={boardId} />
        <div className="flex-grow relative overflow-hidden">
          <ErrorBoundary>
            <Canvas boardId={boardId} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

export default BoardView
