import { useState, useEffect } from 'react'
import { useSocketStore } from '../store/socketStore'

function UserPresence({ boardId }) {
  const [users, setUsers] = useState([])
  const { socket } = useSocketStore()

  useEffect(() => {
    if (!socket || !boardId) return

    const handleUserJoined = (user) => {
      setUsers(prev => {
        // Check if user already exists
        const exists = prev.some(u => u.id === user.id)
        if (exists) return prev
        return [...prev, user]
      })
    }

    const handleUserLeft = (userId) => {
      setUsers(prev => prev.filter(user => user.id !== userId))
    }

    const handleCursorPositions = (updatedUsers) => {
      setUsers(updatedUsers)
    }

    socket.on('user-joined', handleUserJoined)
    socket.on('user-left', handleUserLeft)
    socket.on('cursor-positions', handleCursorPositions)

    return () => {
      socket.off('user-joined', handleUserJoined)
      socket.off('user-left', handleUserLeft)
      socket.off('cursor-positions', handleCursorPositions)
    }
  }, [socket, boardId])

  return (
    <div className="user-presence flex items-center">
      {users.length > 0 ? (
        <div className="flex -space-x-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
              style={{ backgroundColor: user.color || '#6366F1' }}
              title={user.name || 'Anonymous'}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          ))}
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold ml-1 border-2 border-white dark:border-gray-800">
            {users.length}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No other users online</div>
      )}
    </div>
  )
}

export default UserPresence
