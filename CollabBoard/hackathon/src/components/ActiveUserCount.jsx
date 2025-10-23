import { useState, useEffect } from 'react';
import { FaUsers } from 'react-icons/fa';
import { useSocketStore } from '../store/socketStore';

function ActiveUserCount({ boardId }) {
  const [activeUsers, setActiveUsers] = useState(1); // Start with 1 (yourself)
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket || !boardId) return;
    
    const handleActiveUsersCount = (count) => {
      setActiveUsers(count);
    };
    
    socket.on('active-users-count', handleActiveUsersCount);
    
    return () => {
      socket.off('active-users-count', handleActiveUsersCount);
    };
  }, [socket, boardId]);

  return (
    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
      <FaUsers className="mr-2" />
      <span>{activeUsers} active</span>
    </div>
  );
}

export default ActiveUserCount;
