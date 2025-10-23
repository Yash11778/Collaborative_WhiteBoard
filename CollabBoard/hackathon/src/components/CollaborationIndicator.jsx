import { useEffect, useState } from 'react';
import { useSocketStore } from '../store/socketStore';
import { 
  Pencil, 
  Square, 
  Circle, 
  Type, 
  Eraser, 
  MousePointer2,
  PenTool,
  Triangle,
  Star,
  Diamond,
  ArrowRight,
  Minus
} from 'lucide-react';

const toolIcons = {
  select: MousePointer2,
  pen: Pencil,
  rectangle: Square,
  circle: Circle,
  text: Type,
  eraser: Eraser,
  line: Minus,
  arrow: ArrowRight,
  triangle: Triangle,
  star: Star,
  diamond: Diamond,
  ellipse: Circle
};

const toolNames = {
  select: 'Selection',
  pen: 'Pen',
  rectangle: 'Rectangle',
  circle: 'Circle',
  text: 'Text',
  eraser: 'Eraser',
  line: 'Line',
  arrow: 'Arrow',
  triangle: 'Triangle',
  star: 'Star',
  diamond: 'Diamond',
  ellipse: 'Ellipse'
};

function CollaborationIndicator({ boardId }) {
  const { socket } = useSocketStore();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Handle tool change notifications
    const handleToolChanged = ({ tool, userId, username }) => {
      // Don't show notifications for our own tool changes
      if (userId === socket.id) return;

      const notification = {
        id: Date.now() + Math.random(),
        tool,
        username,
        timestamp: Date.now()
      };

      setNotifications(prev => [...prev, notification]);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 3000);
    };

    socket.on('tool-changed', handleToolChanged);

    return () => {
      socket.off('tool-changed', handleToolChanged);
    };
  }, [socket, boardId]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2">
      {notifications.map(notification => {
        const Icon = toolIcons[notification.tool] || PenTool;
        const toolName = toolNames[notification.tool] || notification.tool;

        return (
          <div
            key={notification.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center space-x-3 animate-slide-in-right border border-blue-200 dark:border-blue-700"
            style={{
              animation: 'slideInRight 0.3s ease-out, fadeOut 0.5s ease-in 2.5s forwards'
            }}
          >
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
              <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {notification.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                switched to {toolName}
              </p>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default CollaborationIndicator;
