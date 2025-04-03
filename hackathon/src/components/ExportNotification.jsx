import { useState, useEffect } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

function ExportNotification({ success, message, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Allow time for fade-out animation
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div 
      className={`
        fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg 
        flex items-center space-x-2 transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
        ${success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
      `}
    >
      <div className={`${success ? 'bg-green-600' : 'bg-red-600'} p-2 rounded-full`}>
        {success ? <FaCheck /> : <FaTimes />}
      </div>
      <div>
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}

export default ExportNotification;
