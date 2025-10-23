import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Canvas from '../components/Canvas';
import Toolbar from '../components/Toolbar';
import CanvasInfo from '../components/CanvasInfo';
import ConnectionStatus from '../components/ConnectionStatus';
import CollaborationIndicator from '../components/CollaborationIndicator';
import { useBoardStore } from '../store/boardStore';
import { useSocketStore } from '../store/socketStore';
import ActiveUserCount from '../components/ActiveUserCount';
import ChatPanel from '../components/ChatPanel';
import ShareBoard from '../components/ShareBoard';

function BoardView() {
  const { boardId } = useParams();
  const { setElements } = useBoardStore();
  const { socket, initSocket } = useSocketStore();
  const [boardName, setBoardName] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize socket if not already done
    if (!socket) {
      initSocket();
    }

    // Fetch board data
    const fetchBoard = async () => {
      try {
        const response = await axios.get(`/api/boards/${boardId}`);
        const board = response.data;
        
        setBoardName(board.name || 'Untitled Board');
        if (board.elements) {
          setElements(board.elements);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching board:', err);
        setError('Failed to load board data');
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardId, setElements, socket, initSocket]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-300">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 text-xl">{error}</div>
        <p className="mt-2">Please try again or create a new board.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <ConnectionStatus />
      <CollaborationIndicator boardId={boardId} />
      
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold truncate">{boardName}</h1>
        <div className="flex items-center space-x-3">
          <ActiveUserCount boardId={boardId} />
          <ShareBoard boardId={boardId} boardName={boardName} />
        </div>
      </div>
      
      <Toolbar boardId={boardId} />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <Canvas boardId={boardId} />
          <CanvasInfo />
        </div>
        <ChatPanel boardId={boardId} />
      </div>
    </div>
  );
}

export default BoardView;
