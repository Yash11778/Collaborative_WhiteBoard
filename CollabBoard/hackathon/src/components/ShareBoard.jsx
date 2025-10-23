
import { useState } from 'react';
import { FaCopy, FaShare, FaQrcode, FaTimes, FaDownload, FaCheck } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { exportCanvasAsPNG } from '../utils/helpers';

function ShareBoard({ boardId, boardName }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null);
  
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
  
  // Export board as PNG and open sharing options
  const exportAndShare = async () => {
    const canvas = window.fabricCanvas;
    if (!canvas) return;
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `collabboard-${boardName ? boardName.toLowerCase().replace(/\s+/g, '-') : 'untitled'}-${timestamp}.png`;
      
      const exportResult = exportCanvasAsPNG(canvas, filename);
      if (exportResult) {
        exportResult.download();
        setExportSuccess('Image exported successfully!');
        setTimeout(() => setExportSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Error exporting for sharing:', error);
      setExportSuccess(false);
      setTimeout(() => setExportSuccess(null), 3000);
    }
  };
  
  return (
    <>
      <div className="flex space-x-2">
        <button
          onClick={shareViaAPI}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          aria-label="Share this board"
        >
          <FaShare /> Share Link
        </button>
        
        <button
          onClick={exportAndShare}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          aria-label="Export as PNG"
        >
          <FaDownload /> Export PNG
        </button>
      </div>
      
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
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                You can also export this board as an image:
              </p>
              <button
                onClick={() => {
                  exportAndShare();
                  setIsModalOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                <FaDownload /> Export as PNG
              </button>
            </div>
          </div>
        </div>
      )}
      
      {exportSuccess !== null && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg 
          flex items-center space-x-2 transition-opacity duration-300
          ${exportSuccess ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
        >
          <div className={`${exportSuccess ? 'bg-green-600' : 'bg-red-600'} p-2 rounded-full`}>
            {exportSuccess ? <FaCheck /> : <FaTimes />}
          </div>
          <div>
            <p className="font-medium">
              {exportSuccess === true 
                ? 'Image exported successfully!' 
                : 'Failed to export image'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default ShareBoard;
