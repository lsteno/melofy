import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { HomePage } from './pages/Home';
import { ListsPage } from './pages/Lists';
import { AuthPage } from './pages/Auth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/lists',
        element: <ListsPage />,
      },
      {
        path: '/auth',
        element: <AuthPage />,
      },
    ],
  },
]);
