import { useState, useEffect } from 'react';
import { FaUserPlus } from 'react-icons/fa';

function JoinNotification({ user, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Allow time for fade-out animation
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div 
      className={`
        fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg 
        flex items-center space-x-2 transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div className="bg-blue-600 p-2 rounded-full">
        <FaUserPlus />
      </div>
      <div>
        <p className="font-medium">
          {user.name || 'Someone'} joined the board
        </p>
      </div>
    </div>
  );
}

export default JoinNotification;
