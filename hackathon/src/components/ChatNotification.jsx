import { useState, useEffect } from 'react';
import { FaComment } from 'react-icons/fa';
import { useChatStore } from '../store/chatStore';

function ChatNotification({ message }) {
  const [visible, setVisible] = useState(true);
  const setChatOpen = useChatStore(state => state.setChatOpen);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Open chat when notification is clicked
  const handleClick = () => {
    setChatOpen(true);
    setVisible(false);
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        fixed bottom-20 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg 
        flex items-center space-x-2 transition-opacity duration-300 cursor-pointer
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      <div className="bg-blue-600 p-2 rounded-full">
        <FaComment />
      </div>
      <div>
        <div className="font-bold">
          {message.sender.name}
        </div>
        <p className="font-medium max-w-xs truncate">
          {message.text}
        </p>
      </div>
    </div>
  );
}

export default ChatNotification;
