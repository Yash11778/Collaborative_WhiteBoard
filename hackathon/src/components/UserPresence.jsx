import { useState, useEffect } from 'react';
import { useSocketStore } from '../store/socketStore';
import { useAuthStore } from '../store/authStore';

function UserPresence({ boardId }) {
  const [cursors, setCursors] = useState({});
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (!socket) return;

    // Handle incoming cursor updates
    const handleCursorPositions = (userPositions) => {
      // Filter out your own cursor and users without position data
      const otherUserCursors = userPositions.filter(
        userData => userData.id !== socket.id && userData.position
      );
      
      // Convert array to object for easier lookup
      const cursorsMap = {};
      otherUserCursors.forEach(userData => {
        cursorsMap[userData.id] = {
          position: userData.position,
          name: userData.name,
          color: userData.color || '#ff0000'
        };
      });
      
      setCursors(cursorsMap);
    };

    // Handle user leaving
    const handleUserLeft = (userId) => {
      setCursors(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    socket.on('cursor-positions', handleCursorPositions);
    socket.on('user-left', handleUserLeft);
    
    return () => {
      socket.off('cursor-positions', handleCursorPositions);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, boardId]);

  return (
    <div className="user-cursors-container">
      {Object.keys(cursors).map(userId => {
        const cursor = cursors[userId];
        if (!cursor.position) return null;
        
        return (
          <div 
            key={userId}
            className="user-cursor"
            style={{
              left: cursor.position.x,
              top: cursor.position.y,
              color: cursor.color
            }}
            data-name={cursor.name || 'Anonymous'}
          />
        );
      })}
    </div>
  );
}

export default UserPresence;
