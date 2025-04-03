import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import BoardView from './pages/BoardView';

// Create a router instance to handle future flag warnings
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: 'board/:boardId',
          element: <BoardView />,
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);
