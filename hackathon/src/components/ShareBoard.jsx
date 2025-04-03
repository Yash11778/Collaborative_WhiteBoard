import { useState } from 'react';
import { FaCopy, FaShare, FaQrcode, FaTimes } from 'react-icons/fa';
import QRCode from 'react-qr-code';

function ShareBoard({ boardId, boardName }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Create shareable URL
  const shareableUrl = `${window.location.origin}/board/${boardId}`;
  
  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  
  // Share via Web Share API if available
  const shareViaAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CollabBoard - ${boardName || 'Untitled Board'}`,
          text: 'Join my collaborative whiteboard session!',
          url: shareableUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      setIsModalOpen(true);
    }
  };
  
  return (
    <>
      <button
        onClick={shareViaAPI}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        aria-label="Share this board"
      >
        <FaShare /> Share
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Share this board</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setShowQR(false);
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Share this link with others to collaborate in real-time:
            </p>
            
            <div className="flex mb-6">
              <input
                type="text"
                value={shareableUrl}
                readOnly
                className="flex-grow border rounded-l px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={copyToClipboard}
                className={`px-3 py-2 rounded-r border-y border-r ${
                  copied 
                    ? 'bg-green-500 text-white border-green-500' 
                    : 'bg-gray-100 dark:bg-gray-600 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                }`}
                aria-label="Copy link"
              >
                {copied ? 'Copied!' : <FaCopy />}
              </button>
            </div>
            
            <div className="flex flex-col items-center">
              {showQR ? (
                <div className="mb-4 p-4 bg-white rounded-lg">
                  <QRCode value={shareableUrl} size={200} />
                </div>
              ) : (
                <button
                  onClick={() => setShowQR(true)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded-lg"
                >
                  <FaQrcode /> Show QR Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ShareBoard;
