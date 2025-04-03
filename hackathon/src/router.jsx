import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import BoardView from './pages/BoardView';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

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
          element: (
            <ProtectedRoute>
              <BoardView />
            </ProtectedRoute>
          ),
        },
        {
          path: 'login',
          element: <Login />,
        },
        {
          path: 'register',
          element: <Register />,
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
