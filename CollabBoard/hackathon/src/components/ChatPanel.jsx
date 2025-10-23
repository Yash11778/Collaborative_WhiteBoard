import { useState, useEffect, useRef } from 'react';
import { FaComment, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { useSocketStore } from '../store/socketStore';
import { useChatStore } from '../store/chatStore';
import { playSound } from '../utils/soundUtils';
import ChatNotification from './ChatNotification';

function ChatPanel({ boardId }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState(null);
  
  const { socket } = useSocketStore();
  const { 
    messages, 
    addMessage, 
    unreadCount, 
    isChatOpen, 
    setChatOpen,
    clearUnreadCount
  } = useChatStore();

  // Handle incoming messages
  useEffect(() => {
    if (!socket || !boardId) return;

    const handleChatHistory = (history) => {
      useChatStore.getState().setMessages(history);
    };

    const handleNewMessage = (message) => {
      addMessage(message);
      
      // Play sound and show notification if chat isn't open and message isn't from current user
      if (!isChatOpen && message.sender?.id !== socket?.id) {
        playSound('message', 0.3);
        
        // Show notification
        setNotificationMsg(message);
        setShowNotification(true);
        
        // Hide notification after 5 seconds
        setTimeout(() => setShowNotification(false), 5000);
      }
    };

    socket.on('chat-history', handleChatHistory);
    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('chat-history', handleChatHistory);
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, boardId, addMessage, isChatOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isChatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Clear unread count when opening chat
  useEffect(() => {
    if (isChatOpen) {
      clearUnreadCount();
    }
  }, [isChatOpen, clearUnreadCount]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!socket || !newMessage.trim()) return;
    
    socket.emit('send-message', boardId, { text: newMessage.trim() });
    setNewMessage('');
  };

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        {isChatOpen ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-blue-500 dark:border-blue-400 w-96 flex flex-col chat-animation-enter-active" 
               style={{ height: '500px' }}>
            {/* Chat Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <FaComment className="text-lg" />
                <h3 className="font-bold text-lg">
                  Live Chat 💬
                </h3>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white hover:text-gray-200 hover:scale-110 transition-transform"
                aria-label="Close chat"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            {/* Message Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center italic">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={msg.id || index} 
                    className={`flex ${msg.sender?.id === socket?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] rounded-lg px-3 py-2 
                        ${msg.sender?.id === socket?.id 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                    >
                      {msg.sender?.id !== socket?.id && (
                        <div 
                          className="font-semibold text-xs" 
                          style={{ color: msg.sender?.color || '#888' }}
                        >
                          {msg.sender?.name || 'Anonymous'}
                        </div>
                      )}
                      <p className="break-words">{msg.text}</p>
                      <div className="text-xs text-right opacity-70 mt-1">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="border-t dark:border-gray-700 p-2">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-l-lg focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-2 rounded-r-lg"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-5 rounded-full shadow-2xl relative transform hover:scale-110 transition-all duration-200 animate-pulse"
            aria-label="Open chat"
            title="Open Live Chat 💬"
          >
            <FaComment className="text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center badge-pulse shadow-lg animate-bounce">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
      
      {/* Notification for new messages */}
      {showNotification && notificationMsg && (
        <ChatNotification message={notificationMsg} />
      )}
    </>
  );
}

export default ChatPanel;
